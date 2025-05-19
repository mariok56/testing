export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/signup',
    verify: '/auth/verify-otp',
    resendOtp: '/auth/resend-otp',
    refreshToken: '/auth/refresh-token',
    forgotPassword: '/auth/forgot-password',
  },
  user: {
    getUser: '/user/profile/:userId',
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
