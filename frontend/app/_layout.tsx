import 'react-native-gesture-handler'; // MUST BE FIRST LINE!

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { socketService } from '../src/services/socket';

export default function RootLayout() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      socketService.connect(user.id);

      const handleNotification = (notif: any) => {
        Alert.alert('New Notification', notif.message);
      };

      socketService.onNotification(handleNotification);

      return () => {
        socketService.offNotification(handleNotification);
      };
    } else {
      socketService.disconnect();
    }
  }, [user]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="home" />

        <Stack.Screen name="products/index" />
        <Stack.Screen name="products/[id]" />

        <Stack.Screen name="cart" />
        <Stack.Screen name="checkout" />

        <Stack.Screen name="orders/index" />

        <Stack.Screen name="farmer/index" />
        <Stack.Screen name="farmer/orders" />
        <Stack.Screen name="farmer/products" />

        <Stack.Screen name="admin/index" />
        <Stack.Screen name="admin/dashboard" />
        <Stack.Screen name="admin/products" />

        <Stack.Screen name="payment/success" />
        <Stack.Screen name="payment/failure" />
      </Stack>
    </>
  );
}