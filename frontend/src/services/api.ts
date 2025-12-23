// API service for AgriHub
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SignupData } from '../types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Auth APIs
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  signup: async (data: SignupData) => {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }
    return response.json();
  },

  getMe: async () => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { ...headers },
    });
    if (!response.ok) throw new Error('Failed to get user info');
    return response.json();
  },
};

// Product APIs
export const productAPI = {
  getAll: async (filters?: { category?: string; minPrice?: number; maxPrice?: number }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.minPrice) params.append('min_price', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('max_price', filters.maxPrice.toString());
    
    const response = await fetch(`${API_URL}/api/products?${params}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_URL}/api/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },

  create: async (data: any) => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create product');
    return response.json();
  },

  update: async (id: string, data: any) => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update product');
    return response.json();
  },

  delete: async (id: string) => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: { ...headers },
    });
    if (!response.ok) throw new Error('Failed to delete product');
    return response.json();
  },

  getFarmerProducts: async () => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/farmer/products`, {
      headers: { ...headers },
    });
    if (!response.ok) throw new Error('Failed to fetch farmer products');
    return response.json();
  },
};

// Cart APIs
export const cartAPI = {
  get: async () => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/cart`, {
      headers: { ...headers },
    });
    if (!response.ok) throw new Error('Failed to fetch cart');
    return response.json();
  },

  add: async (productId: string, quantity: number) => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/cart`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    if (!response.ok) throw new Error('Failed to add to cart');
    return response.json();
  },

  update: async (cartItemId: string, quantity: number) => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/cart/${cartItemId}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) throw new Error('Failed to update cart');
    return response.json();
  },

  remove: async (cartItemId: string) => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/cart/${cartItemId}`, {
      method: 'DELETE',
      headers: { ...headers },
    });
    if (!response.ok) throw new Error('Failed to remove from cart');
    return response.json();
  },

  clear: async () => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/cart`, {
      method: 'DELETE',
      headers: { ...headers },
    });
    if (!response.ok) throw new Error('Failed to clear cart');
    return response.json();
  },
};

// Order APIs
export const orderAPI = {
  create: async (shippingAddress: string, items: any[]) => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipping_address: shippingAddress, items }),
    });
    if (!response.ok) throw new Error('Failed to create order');
    return response.json();
  },

  getAll: async () => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/orders`, {
      headers: { ...headers },
    });
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  getById: async (id: string) => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/orders/${id}`, {
      headers: { ...headers },
    });
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
  },

  updateStatus: async (id: string, status: string) => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update order status');
    return response.json();
  },
};

// Review APIs
export const reviewAPI = {
  create: async (productId: string, orderId: string, rating: number, text: string) => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/reviews`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, order_id: orderId, rating, text }),
    });
    if (!response.ok) throw new Error('Failed to create review');
    return response.json();
  },

  getByProduct: async (productId: string) => {
    const response = await fetch(`${API_URL}/api/reviews/${productId}`);
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  },
};

// Payment API
export const paymentAPI = {
  process: async () => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/payment/process`, {
      method: 'POST',
      headers: { ...headers },
    });
    if (!response.ok) throw new Error('Failed to process payment');
    return response.json();
  },
};

// Notification APIs
export const notificationAPI = {
  getAll: async () => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/notifications`, {
      headers: { ...headers },
    });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },

  markRead: async (id: string) => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: { ...headers },
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return response.json();
  },
};

// Admin APIs
export const adminAPI = {
  getUsers: async () => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/admin/users`, {
      headers: { ...headers },
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  getAnalytics: async () => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/admin/analytics`, {
      headers: { ...headers },
    });
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  },

  getPendingProducts: async () => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/admin/pending-products`, {
      headers: { ...headers },
    });
    if (!response.ok) throw new Error('Failed to fetch pending products');
    return response.json();
  },

  approveProduct: async (id: string, status: 'approved' | 'rejected') => {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/api/admin/products/${id}/approve`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to approve product');
    return response.json();
  },
};
