import {create} from 'zustand';
import * as Keychain from 'react-native-keychain';
import api from '../lib/axiosInstance';
import {User} from '../types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    profileImage?: File,
  ) => Promise<boolean>;
  verify: (email: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  resendVerificationOtp: (email: string) => Promise<boolean>;
  updateProfile: (
    firstName: string,
    lastName: string,
    profileImage?: File,
  ) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({isLoading: true, error: null});

    try {
      // Call the login API
      const response = await api.post('/auth/login', {email, password});
      const {accessToken, refreshToken} = response.data.data;

      // Store tokens securely
      await Keychain.setGenericPassword(
        'auth_tokens',
        JSON.stringify({accessToken, refreshToken}),
        {service: 'auth_tokens'},
      );

      // We don't set isAuthenticated to true yet, since the user still needs to verify
      set({
        isLoading: false,
        user: {
          name: '', // Will be filled after verification
          email,
          phoneNumber: '',
        },
      });
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      set({
        isLoading: false,
        error:
          error?.response?.data?.message || 'Login failed. Please try again.',
      });
      return false;
    }
  },

  register: async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    profileImage?: File,
  ) => {
    set({isLoading: true, error: null});

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);

      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      // Call the register API
      await api.post('/auth/signup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      set({isLoading: false});
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      set({
        isLoading: false,
        error:
          error?.response?.data?.message ||
          'Registration failed. Please try again.',
      });
      return false;
    }
  },

  verify: async (email: string, otp: string) => {
    set({isLoading: true, error: null});

    try {
      // Call the verify OTP API
      await api.post('/auth/verify-otp', {email, otp});

      // After verification, get the user profile
      const userResponse = await api.get('/user/profile');
      const userData = userResponse.data.data.user;

      set({
        user: {
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          email: userData.email || email, // Make sure email is always defined
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phoneNumber: userData.phoneNumber || '',
          profileImage: userData.profileImage?.url || '',
          isEmailVerified: userData.isEmailVerified || false,
        },
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      console.error('Verification error:', error);
      set({
        isLoading: false,
        error:
          error?.response?.data?.message ||
          'Verification failed. Please try again.',
      });
      return false;
    }
  },

  logout: async () => {
    set({isLoading: true});

    try {
      // No logout endpoint in the API, we just clear tokens
      await Keychain.resetGenericPassword({service: 'auth_tokens'});

      // Reset state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      set({isLoading: false});
    }
  },

  refreshTokens: async () => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'auth_tokens',
      });

      if (credentials) {
        const {password: tokens} = credentials;
        const {refreshToken} = JSON.parse(tokens);

        // Call the refresh token API
        const response = await api.post('/auth/refresh-token', {refreshToken});
        const {accessToken, refreshToken: newRefreshToken} = response.data.data;

        await Keychain.setGenericPassword(
          'auth_tokens',
          JSON.stringify({accessToken, refreshToken: newRefreshToken}),
          {service: 'auth_tokens'},
        );

        // Get user profile
        const userResponse = await api.get('/user/profile');
        const userData = userResponse.data.data.user;

        set({
          user: {
            name: `${userData.firstName || ''} ${
              userData.lastName || ''
            }`.trim(),
            email: userData.email, // Email is required
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phoneNumber: userData.phoneNumber || '',
            profileImage: userData.profileImage?.url || '',
            isEmailVerified: userData.isEmailVerified || false,
          },
          isAuthenticated: true,
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  },

  resendVerificationOtp: async (email: string) => {
    set({isLoading: true, error: null});

    try {
      // Call the resend verification OTP API
      await api.post('/auth/resend-verification-otp', {email});

      set({isLoading: false});
      return true;
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      set({
        isLoading: false,
        error:
          error?.response?.data?.message ||
          'Failed to resend verification code.',
      });
      return false;
    }
  },

  updateProfile: async (
    firstName: string,
    lastName: string,
    profileImage?: File,
  ) => {
    set({isLoading: true, error: null});

    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);

      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      // Call the update profile API
      const response = await api.put('/user/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const userData = response.data.data.user;
      const currentUser = get().user;

      // Make sure we don't lose the required email field
      set({
        user: {
          ...currentUser,
          email: currentUser?.email || userData.email, // Ensure email is always preserved
          name: `${userData.firstName} ${userData.lastName}`,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImage: userData.profileImage?.url || '',
          isEmailVerified: userData.isEmailVerified,
        },
        isLoading: false,
      });

      return true;
    } catch (error: any) {
      console.error('Update profile error:', error);
      set({
        isLoading: false,
        error: error?.response?.data?.message || 'Failed to update profile.',
      });
      return false;
    }
  },
}));

// Hook to check and load auth state on app launch
export const useAuthInit = () => {
  const {isAuthenticated, isLoading, refreshTokens} = useAuthStore();

  const initAuth = async () => {
    if (!isAuthenticated && !isLoading) {
      try {
        const credentials = await Keychain.getGenericPassword({
          service: 'auth_tokens',
        });

        if (credentials) {
          // We have credentials, try to refresh the token
          await refreshTokens();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      }
    }
  };

  return {initAuth};
};
