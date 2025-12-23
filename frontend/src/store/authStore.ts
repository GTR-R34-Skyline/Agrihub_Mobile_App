// Auth state management with Zustand
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { AuthState, SignupData } from '../types';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      await AsyncStorage.setItem('token', response.access_token);
      set({ user: response.user, token: response.access_token, isAuthenticated: true });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  signup: async (data: SignupData) => {
    try {
      const response = await authAPI.signup(data);
      await AsyncStorage.setItem('token', response.access_token);
      set({ user: response.user, token: response.access_token, isAuthenticated: true });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const user = await authAPI.getMe();
        set({ user, token, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Load user error:', error);
      await AsyncStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
