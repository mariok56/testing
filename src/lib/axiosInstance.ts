import axios from 'axios';
import * as Keychain from 'react-native-keychain';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://backend-practice.eurisko.me', // Actual API URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  async config => {
    try {
      // Get the access token from secure storage
      const credentials = await Keychain.getGenericPassword({
        service: 'auth_tokens',
      });

      if (credentials) {
        const {password: tokens} = credentials;
        const {accessToken} = JSON.parse(tokens);

        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }
      return config;
    } catch (error) {
      console.error('Error adding auth token to request:', error);
      return config;
    }
  },
  error => {
    return Promise.reject(error);
  },
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If error is 401 (Unauthorized) and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get the refresh token
        const credentials = await Keychain.getGenericPassword({
          service: 'auth_tokens',
        });

        if (credentials) {
          const {password: tokens} = credentials;
          const {refreshToken} = JSON.parse(tokens);

          // Call refresh token endpoint
          const response = await axios.post(
            'https://backend-practice.eurisko.me/auth/refresh-token',
            {refreshToken},
          );

          const {accessToken, refreshToken: newRefreshToken} =
            response.data.data;

          // Save the new tokens
          await Keychain.setGenericPassword(
            'auth_tokens',
            JSON.stringify({accessToken, refreshToken: newRefreshToken}),
            {service: 'auth_tokens'},
          );

          // Update the original request with the new token
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        // If refresh fails, logout the user
        await Keychain.resetGenericPassword({service: 'auth_tokens'});
        // Here we would typically trigger a logout action from the auth store
        // We'll implement this once we have our auth store
      }
    }

    return Promise.reject(error);
  },
);

export default api;
