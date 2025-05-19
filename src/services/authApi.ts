import apiClient from '../lib/axioInstance';
import {endpoints} from '../constant/endpoint';

// Types for API responses and requests
interface AuthResponse {
  success: boolean;
  data: {
    accessToken?: string;
    refreshToken?: string;
    message?: string;
    isEmailVerified?: boolean;
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      profileImage?: {
        url: string;
      };
      isEmailVerified: boolean;
    };
  };
}

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profileImage?: File;
}

interface VerifyOtpData {
  email: string;
  otp: string;
}

interface LoginData {
  email: string;
  password: string;
  token_expires_in?: string;
}

interface RefreshTokenData {
  refreshToken: string;
  token_expires_in?: string;
}

// Authentication API functions
export const signup = async (data: SignupData): Promise<AuthResponse> => {
  const formData = new FormData();
  formData.append('email', data.email);
  formData.append('password', data.password);
  formData.append('firstName', data.firstName);
  formData.append('lastName', data.lastName);

  if (data.profileImage) {
    formData.append('profileImage', data.profileImage);
  }

  const response = await apiClient.post<AuthResponse>(
    endpoints.auth.register,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
};

export const verifyOtp = async (data: VerifyOtpData): Promise<AuthResponse> => {
  const formData = new FormData();
  formData.append('email', data.email);
  formData.append('otp', data.otp);

  const response = await apiClient.post<AuthResponse>(
    endpoints.auth.verify,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
};

export const resendVerificationOtp = async (
  email: string,
): Promise<AuthResponse> => {
  const formData = new FormData();
  formData.append('email', email);

  const response = await apiClient.post<AuthResponse>(
    endpoints.auth.resendOtp,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    endpoints.auth.login,
    data,
  );
  return response.data;
};

export const refreshAccessToken = async (
  refreshToken: string,
): Promise<{accessToken: string; refreshToken: string} | null> => {
  try {
    const data: RefreshTokenData = {
      refreshToken,
    };

    const response = await apiClient.post<AuthResponse>(
      endpoints.auth.refreshToken,
      data,
    );

    if (
      response.data.success &&
      response.data.data.accessToken &&
      response.data.data.refreshToken
    ) {
      return {
        accessToken: response.data.data.accessToken,
        refreshToken: response.data.data.refreshToken,
      };
    }

    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

export const forgotPassword = async (email: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    endpoints.auth.forgotPassword,
    {
      email,
    },
  );
  return response.data;
};

export const getUserProfile = async (): Promise<AuthResponse> => {
  const response = await apiClient.get<AuthResponse>(endpoints.user.getUser);
  return response.data;
};

export const updateUserProfile = async (data: {
  firstName?: string;
  lastName?: string;
  profileImage?: File;
}): Promise<AuthResponse> => {
  const formData = new FormData();

  if (data.firstName) {
    formData.append('firstName', data.firstName);
  }

  if (data.lastName) {
    formData.append('lastName', data.lastName);
  }

  if (data.profileImage) {
    formData.append('profileImage', data.profileImage);
  }

  const response = await apiClient.put<AuthResponse>(
    endpoints.user.updateUser,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
};
