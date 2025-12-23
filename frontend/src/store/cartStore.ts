// Cart state management with Zustand
import { create } from 'zustand';
import { cartAPI } from '../services/api';
import { CartState } from '../types';

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  loading: false,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const response = await cartAPI.get();
      set({ items: response.items, total: response.total, loading: false });
    } catch (error) {
      console.error('Fetch cart error:', error);
      set({ loading: false });
    }
  },

  addToCart: async (productId: string, quantity: number) => {
    try {
      await cartAPI.add(productId, quantity);
      await get().fetchCart();
    } catch (error) {
      console.error('Add to cart error:', error);
      throw error;
    }
  },

  updateQuantity: async (cartItemId: string, quantity: number) => {
    try {
      await cartAPI.update(cartItemId, quantity);
      await get().fetchCart();
    } catch (error) {
      console.error('Update quantity error:', error);
      throw error;
    }
  },

  removeFromCart: async (cartItemId: string) => {
    try {
      await cartAPI.remove(cartItemId);
      await get().fetchCart();
    } catch (error) {
      console.error('Remove from cart error:', error);
      throw error;
    }
  },

  clearCart: async () => {
    try {
      await cartAPI.clear();
      set({ items: [], total: 0 });
    } catch (error) {
      console.error('Clear cart error:', error);
      throw error;
    }
  },
}));
