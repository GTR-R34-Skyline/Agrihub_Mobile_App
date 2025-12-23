import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button } from '../../src/components/Button';
import { theme } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentSuccess() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="checkmark-circle" size={100} color={theme.colors.success} />
          <Text style={styles.title}>Order Placed!</Text>
          <Text style={styles.message}>
            Your payment was successful and your order has been placed. You will receive updates shortly.
          </Text>
        </View>
        
        <View style={styles.footer}>
          <Button
            title="View Orders"
            onPress={() => router.replace('/orders' as any)}
            variant="outline"
            style={styles.mb}
          />
          <Button
            title="Continue Shopping"
            onPress={() => router.replace('/')}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    marginBottom: 20,
  },
  mb: {
    marginBottom: 12,
  },
});
