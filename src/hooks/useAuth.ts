import {useMutation, useQuery} from '@tanstack/react-query';
import * as authApi from '../services/authApi';
import {storeTokens, getTokens} from '../lib/axioInstance';
import {ImageFile} from '../types/auth';

// Types for auth data
interface LoginData {
  email: string;
  password: string;
}

// Updated to use ImageFile instead of File
interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profileImage?: ImageFile; // Changed from File to ImageFile
}

interface VerifyOtpData {
  email: string;
  otp: string;
}

// Hook for login mutation
export const useLogin = () => {
  return useMutation({
    mutationFn: async ({email, password}: LoginData) => {
      const response = await authApi.login({email, password});

      if (
        response.success &&
        response.data.accessToken &&
        response.data.refreshToken
      ) {
        // Store tokens securely
        await storeTokens(
          response.data.accessToken,
          response.data.refreshToken,
        );
        return response.data;
      }

      throw new Error(response.data.message || 'Login failed');
    },
  });
};

// Hook for signup mutation
export const useSignup = () => {
  return useMutation({
    mutationFn: async ({
      firstName,
      lastName,
      email,
      password,
      profileImage,
    }: SignupData) => {
      const response = await authApi.signup({
        firstName,
        lastName,
        email,
        password,
        profileImage,
      });

      if (!response.success) {
        throw new Error(response.data.message || 'Signup failed');
      }

      return response.data;
    },
  });
};

// Hook for OTP verification mutation
export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: async ({email, otp}: VerifyOtpData) => {
      const response = await authApi.verifyOtp({email, otp});

      if (!response.success) {
        throw new Error(response.data.message || 'OTP verification failed');
      }

      return response.data;
    },
  });
};

// Hook for resend OTP mutation
export const useResendOtp = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await authApi.resendVerificationOtp(email);

      if (!response.success) {
        throw new Error(response.data.message || 'Failed to resend OTP');
      }

      return response.data;
    },
  });
};

// Hook for forgot password mutation
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await authApi.forgotPassword(email);

      if (!response.success) {
        throw new Error(response.data.message || 'Failed to send reset email');
      }

      return response.data;
    },
  });
};

// Hook to get user profile
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const tokens = await getTokens();

      // Only fetch profile if we have tokens
      if (!tokens?.accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await authApi.getUserProfile();

      if (!response.success || !response.data.user) {
        throw new Error(response.data.message || 'Failed to get user profile');
      }

      // Map the API response to our User type
      const user = response.data.user;
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        isEmailVerified: user.isEmailVerified,
      };
    },
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false,
  });
};

// Hook to update user profile - updated with ImageFile type
export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (data: {
      firstName?: string;
      lastName?: string;
      profileImage?: ImageFile; // Changed from File to ImageFile
    }) => {
      const response = await authApi.updateUserProfile(data);

      if (!response.success) {
        throw new Error(response.data.message || 'Failed to update profile');
      }

      return response.data.user;
    },
  });
};
