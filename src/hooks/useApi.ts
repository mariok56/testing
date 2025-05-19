import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import api from '../lib/axiosInstance';
import {useAuthStore} from '../store/authStore';

// Auth API
export const useSignup = () => {
  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post('/auth/signup', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
  });
};

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: async (data: {email: string; otp: string}) => {
      const response = await api.post('/auth/verify-otp', data);
      return response.data;
    },
  });
};

export const useResendOtp = () => {
  return useMutation({
    mutationFn: async (data: {email: string}) => {
      const response = await api.post('/auth/resend-verification-otp', data);
      return response.data;
    },
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      token_expires_in?: string;
    }) => {
      const response = await api.post('/auth/login', data);
      return response.data;
    },
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: async (data: {
      refreshToken: string;
      token_expires_in?: string;
    }) => {
      const response = await api.post('/auth/refresh-token', data);
      return response.data;
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data: {email: string}) => {
      const response = await api.post('/auth/forgot-password', data);
      return response.data;
    },
  });
};

// User Profile API
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.put('/user/profile', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['userProfile']});
    },
  });
};

export const useUserProfile = (userId?: string) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const endpoint = userId ? `/user/profile/${userId}` : '/user/profile';
      const response = await api.get(endpoint);
      return response.data.data;
    },
    enabled: isAuthenticated, // Only run if user is authenticated
  });
};

// Products API
export const useProducts = (
  page = 1,
  limit = 10,
  minPrice?: number,
  maxPrice?: number,
  sortBy?: string,
  order: 'asc' | 'desc' = 'desc',
) => {
  return useQuery({
    queryKey: ['products', page, limit, minPrice, maxPrice, sortBy, order],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      if (minPrice !== undefined) {
        params.append('minPrice', minPrice.toString());
      }

      if (maxPrice !== undefined) {
        params.append('maxPrice', maxPrice.toString());
      }

      if (sortBy) {
        params.append('sortBy', sortBy);
        params.append('order', order);
      }

      const response = await api.get(`/products?${params.toString()}`);
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
};

export const useProductSearch = (query: string) => {
  return useQuery({
    queryKey: ['productSearch', query],
    queryFn: async () => {
      const response = await api.get(
        `/products/search?query=${encodeURIComponent(query)}`,
      );
      return response.data;
    },
    enabled: query.length > 0, // Only run the query if there's a search term
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      return response.data;
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post('/products', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the products list query to trigger a refetch
      queryClient.invalidateQueries({queryKey: ['products']});
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({id, data}: {id: string; data: FormData}) => {
      const response = await api.put(`/products/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Update the individual product in the cache
      queryClient.invalidateQueries({queryKey: ['product', variables.id]});
      // Invalidate the products list
      queryClient.invalidateQueries({queryKey: ['products']});
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the products list query
      queryClient.invalidateQueries({queryKey: ['products']});
    },
  });
};
