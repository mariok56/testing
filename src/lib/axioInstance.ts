import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import {refreshAccessToken} from '../services/authApi';

const BASE_URL = 'https://backend-practice.eurisko.me';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get tokens from secure storage
export const getTokens = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({service: 'auth'});
    if (credentials) {
      return JSON.parse(credentials.password);
    }
    return null;
  } catch (error) {
    console.error('Error getting tokens from keychain:', error);
    return null;
  }
};

// Function to store tokens in secure storage
export const storeTokens = async (
  accessToken: string,
  refreshToken: string,
) => {
  try {
    await Keychain.setGenericPassword(
      'auth_tokens',
      JSON.stringify({accessToken, refreshToken}),
      {service: 'auth'},
    );
    return true;
  } catch (error) {
    console.error('Error storing tokens in keychain:', error);
    return false;
  }
};

// Function to clear tokens from secure storage
export const clearTokens = async () => {
  try {
    await Keychain.resetGenericPassword({service: 'auth'});
    return true;
  } catch (error) {
    console.error('Error clearing tokens from keychain:', error);
    return false;
  }
};

// Set up request interceptor for authentication
apiClient.interceptors.request.use(
  async config => {
    // Add authorization header to requests if access token exists
    const tokens = await getTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Set up response interceptor for token refresh
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If error is 401 Unauthorized and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = await getTokens();

        if (tokens?.refreshToken) {
          // Try to refresh the token
          const newTokens = await refreshAccessToken(tokens.refreshToken);

          if (newTokens) {
            // Store new tokens
            await storeTokens(newTokens.accessToken, newTokens.refreshToken);

            // Update the authorization header and retry the request
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return apiClient(originalRequest);
          }
        }

        // If refresh token is invalid or expired, clear tokens and force logout
        await clearTokens();

        // Dispatch an event to notify the app to redirect to login
        // You can use an event emitter or state management solution
        // This will be handled by our Zustand store
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        await clearTokens();
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
