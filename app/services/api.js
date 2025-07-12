//C:\Users\faeiz\Desktop\BBBolt\app\services\api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './_apiConfig';

// Create axios instance with base URL from config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to attach the auth token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (expired token)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Remove token and let auth context handle the redirect
      await AsyncStorage.removeItem('userToken');

      // You can dispatch an event or use context to handle logout
      // For example: EventEmitter.emit('unauthorized');
    }

    return Promise.reject(error);
  }
);

// Customer API endpoints
// Updated Customer API endpoints in api.js
export const customerApi = {
  // Auth
  register: (data) => api.post('/customers/register', data),
  login: (data) => api.post('/customers/login', data),
  verifyEmail: (token) => api.get(`/customers/verify-email/${token}`),

  // Profile
  getProfile: () => api.get('/customers/profile'),
  updateProfile: (data) => api.put('/customers/profile', data),

  // Location
  updateLocation: (data) => api.post('/customers/update-location', data),
  getNearbyVendors: (params) =>
    api.get('/customers/nearby-vendors', { params }),
  getNearbyProducts: (params) =>
    api.get('/customers/nearby-products', { params }),

  // Enhanced search with more filters and sorting
  searchNearbyVendorsAndProducts: (params) =>
    api.get('/customers/search-nearby-vendors-products', { params }),
  
  priceComparison: (params) =>
    api.get('/customers/price-comparison', { params }),
  createRationPack: (data) => api.post('/customers/ration-packs', data, {
    timeout: 30000 // 30 seconds timeout for this specific endpoint
  }),
};

// Helper function to add to LocationContext.js
// This can be added to your LocationContext.js file to include sortBy parameter
export const getLocationAndSearchParams = (options = {}) => {
  const { location } = useLocation();
  const params = {};
  
  if (location) {
    params.lat = location.latitude;
    params.lng = location.longitude;
  }
  
  // Add radius if specified
  if (options.radius) {
    params.radius = options.radius;
  }
  
  // Add category and subcategory if specified
  if (options.categoryId) {
    params.categoryId = options.categoryId;
  }
  
  if (options.subCategoryId) {
    params.subCategoryId = options.subCategoryId;
  }
  
  // Add search term if specified
  if (options.searchTerm) {
    params.searchTerm = options.searchTerm;
  }
  
  // Add sort option if specified
  if (options.sortBy) {
    params.sortBy = options.sortBy;
  }
  
  return params;
};

// Products API endpoints
export const productApi = {
  getAllProducts: () => api.get('/products'),
  getProductById: (id) => api.get(`/products/${id}`),
  getProductsByCategory: (categoryId) =>
    api.get(`/products/category/${categoryId}`),
  getProductsBySubCategory: (subCategoryId) =>
    api.get(`/products/sub-category/${subCategoryId}`),
  searchProducts: (keyword) => api.get(`/products/search/${keyword}`),
}

// Vendor Products API endpoints
export const vendorProductApi = {
  getNearbyVendorProducts: (params) =>
    api.get('/customers/nearby-products', { params }),
  getVendorProductById: (id) => api.get(`/vendor-products/${id}`),
  getVendorProductsByCategory: (categoryId, locationParams) =>
    api.get('/customers/nearby-products', {
      params: { ...locationParams, categoryId },
    }),
  searchProductsByKeyword: (keyword, locationParams) =>
    api.get('/customers/nearby-products', {
      params: { ...locationParams, keyword },
    }),
    getVendorProductsByFilters: (params) => {
      const { vendorId, ...otherParams } = params;
      return api.get(`/vendor-products/by-vendor/${vendorId}`, { 
        params: otherParams 
      });
    },
  };
  

export const vendorApi = {
  getNearbyVendors: (params) => api.get('/vendors/nearby', { params }),
  getAllVendors: () => api.get('/vendors'),
  getVendorById: (id) => api.get(`/vendors/${id}`),
};

// Categories API endpoints
export const categoryApi = {
  getAllCategories: () => api.get('/categories'),
  getCategoryById: (id) => api.get(`/categories/${id}`),
  getAllSubCategories: () => api.get('/subcategories'),
  getSubCategoriesByCategory: (categoryId) =>
    api.get(`/subcategories/by-category/${categoryId}`),
  getProductsBySubCategory: (subCategoryId) =>
    api.get(`/products/sub-category/${subCategoryId}`),
};

// Cart API endpoints
export const cartApi = {
  getCart: () => api.get('/cart'),
  addToCart: (vendorProductId, quantity = 1) =>
    api.post('/cart', { vendorProductId, quantity }),
  updateCartItem: (vendorProductId, quantity) =>
    api.put(`/cart/${vendorProductId}`, { quantity }),
  removeCartItem: (vendorProductId) => api.delete(`/cart/${vendorProductId}`),
  clearCart: () => api.delete('/cart'),
};

// Order API endpoints
export const orderApi = {
  createOrder: (data) => api.post('/orders', data),
  createDirectOrder: (data) => api.post('/orders/direct', data), // Add new endpoint for direct orders
  // Customer order endpoints (these are the correct ones)
  getOrders: (params) => api.get('/customer/orders', { params }),
  getOrderById: (id) => api.get(`/customer/orders/${id}`),
  cancelOrder: (id, reason) =>
    api.put(`/customer/orders/${id}/cancel`, { reason }),
  getOrderTracking: (id) => api.get(`/customer/orders/${id}/tracking`),
};

// Recipe API endpoints
export const recipeApi = {
  generateRecipe: (cartItems) => api.post('/recipe/generate', { cartItems }),
};

// Review API endpoints
export const reviewApi = {
  // Submit a new review
  submitReview: (data) => api.post('/reviews/submit', data),
  
  // Get reviews for a vendor product
  getProductReviews: (vendorProductId, params = {}) => 
    api.get(`/reviews/product/${vendorProductId}`, { params }),
  
  // Get customer's reviews
  getCustomerReviews: (params = {}) => 
    api.get('/reviews/my-reviews', { params }),
  
  // Get reviewable products for customer
  getReviewableProducts: (params = {}) => 
    api.get('/reviews/reviewable-products', { params }),
  
  // Update a review
  updateReview: (reviewId, data) => 
    api.put(`/reviews/${reviewId}`, data),
  
  // Delete a review
  deleteReview: (reviewId) => 
    api.delete(`/reviews/${reviewId}`),
};

export default api;
