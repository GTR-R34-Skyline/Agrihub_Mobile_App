import AsyncStorage from '@react-native-async-storage/async-storage';
import { SignupData } from '../types';

/**
 * Backend URL
 */
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!API_URL) {
  throw new Error('EXPO_PUBLIC_BACKEND_URL is not defined');
}

/**
 * Always returns a VALID HeadersInit
 */
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem('token');

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

/* =========================
   AUTH
========================= */
export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error('Invalid credentials');

    const data = await res.json();
    await AsyncStorage.setItem('token', data.access_token);

    return data;
  },

  signup: async (data: SignupData) => {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Signup failed');
    }

    return res.json();
  },

  getMe: async () => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/auth/me`, { headers });

    if (!res.ok) throw new Error('Auth expired');
    return res.json();
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
  },
};

/* =========================
   PRODUCTS
========================= */
export const productAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/api/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_URL}/api/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    return res.json();
  },

  create: async (data: any) => {
    const headers = await getAuthHeaders();

    const res = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Create product failed');
    return res.json();
  },

  getFarmerProducts: async () => {
    const headers = await getAuthHeaders();

    const res = await fetch(`${API_URL}/api/farmer/products`, { headers });
    if (!res.ok) throw new Error('Failed to fetch farmer products');
    return res.json();
  },
};

/* =========================
   CART
========================= */
export const cartAPI = {
  get: async () => {
    const headers = await getAuthHeaders();

    const res = await fetch(`${API_URL}/api/cart`, { headers });
    if (!res.ok) throw new Error('Failed to fetch cart');
    return res.json();
  },

  add: async (productId: string, quantity: number) => {
    const headers = await getAuthHeaders();

    const res = await fetch(`${API_URL}/api/cart`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_id: productId, quantity }),
    });

    if (!res.ok) throw new Error('Add to cart failed');
    return res.json();
  },
};

/* =========================
   ORDERS
========================= */
export const orderAPI = {
  create: async (shippingAddress: string, items: any[]) => {
    const headers = await getAuthHeaders();

    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shipping_address: shippingAddress,
        items,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Order creation failed');
    }

    return res.json();
  },

  getAll: async () => {
    const headers = await getAuthHeaders();

    const res = await fetch(`${API_URL}/api/orders`, { headers });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  updateStatus: async (
    orderId: string,
    status: 'confirmed' | 'shipped' | 'delivered'
  ) => {
    const headers = await getAuthHeaders();

    const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update order status');
    }

    return res.json();
  },
};

/* =========================
   PAYMENT (MOCK)
========================= */
export const paymentAPI = {
  process: async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      transaction_id: `TXN_${Date.now()}`,
    };
  },
};

/* =========================
   ADMIN
========================= */
export const adminAPI = {
  getPendingProducts: async () => {
    const headers = await getAuthHeaders();

    const res = await fetch(`${API_URL}/api/admin/pending-products`, { headers });
    if (!res.ok) throw new Error('Failed to fetch pending products');
    return res.json();
  },

  approveProduct: async (
    id: string,
    status: 'approved' | 'rejected'
  ) => {
    const headers = await getAuthHeaders();

    const res = await fetch(
      `${API_URL}/api/admin/products/${id}/approve`,
      {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      }
    );

    if (!res.ok) throw new Error('Approval failed');
    return res.json();
  },
};
