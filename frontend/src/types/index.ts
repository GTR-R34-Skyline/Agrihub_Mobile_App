// Type definitions for AgriHub

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'farmer' | 'buyer' | 'admin';
  address?: string;
  created_at: string;
}

export interface Product {
  id: string;
  farmer_id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  avg_rating: number;
  review_count: number;
  created_at: string;
  farmer?: {
    id: string;
    name: string;
    phone: string;
  };
  reviews?: Review[];
}

export interface CartItem {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
  subtotal?: number;
}

export interface Order {
  id: string;
  buyer_id: string;
  farmer_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  shipping_address: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  buyer?: {
    id: string;
    name: string;
    phone: string;
  };
  farmer?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  product?: Product;
}

export interface Review {
  id: string;
  product_id: string;
  buyer_id: string;
  order_id: string;
  rating: number;
  text: string;
  created_at: string;
  buyer_name?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
  address?: string;
}

export interface CartState {
  items: CartItem[];
  total: number;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}
