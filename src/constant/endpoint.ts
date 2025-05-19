export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/signup',
    verify: '/auth/verify-otp',
    resendOtp: '/auth/resend-verification-otp', // Updated to match the API documentation
    refreshToken: '/auth/refresh-token',
    forgotPassword: '/auth/forgot-password',
  },
  user: {
    getUser: '/user/profile', // Changed from '/user/profile/:userId'
    getUserById: '/user/profile/:userId', // Added for getting other user profiles
    updateUser: '/user/profile',
  },
  posts: {
    getPosts: '/posts',
  },
  products: {
    getProducts: '/products',
    searchProducts: '/products/search',
    getProductById: '/products/:id',
    createProduct: '/products',
    updateProduct: '/products/:id',
    deleteProduct: '/products/:id',
  },
};
