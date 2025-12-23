import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { socketService } from '../src/services/socket';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

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
    <ErrorBoundary>
      <StatusBar style="auto" />
<Stack
  screenOptions={{
    headerShown: false,
    animation: 'slide_from_right',
  }}
>
  {/* Auth & Root */}
  <Stack.Screen name="index" />
  <Stack.Screen name="login" />
  <Stack.Screen name="signup" />
  <Stack.Screen name="home" />

  {/* Products */}
  <Stack.Screen name="products/index" />
  <Stack.Screen name="products/[id]" />

  {/* Cart & Checkout */}
  <Stack.Screen name="cart" />
  <Stack.Screen name="checkout" />

  {/* Orders */}
  <Stack.Screen name="orders/index" />

  {/* Farmer */}
  <Stack.Screen name="farmer/index" />
  <Stack.Screen name="farmer/orders" />
  <Stack.Screen name="farmer/products" />

  {/* Admin */}
  <Stack.Screen name="admin/index" />
  <Stack.Screen name="admin/dashboard" />
  <Stack.Screen name="admin/products" />

  {/* Payment */}
  <Stack.Screen name="payment/success" />
  <Stack.Screen name="payment/failure" />
</Stack>

    </ErrorBoundary>
  );
}


