import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button } from '../../src/components/Button';
import { theme } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentFailure() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="alert-circle" size={100} color={theme.colors.error} />
          <Text style={styles.title}>Payment Failed</Text>
          <Text style={styles.message}>
            We couldn't process your payment. Please try again later.
          </Text>
        </View>
        
        <View style={styles.footer}>
          <Button
            title="Try Again"
            onPress={() => router.replace('/checkout')}
            style={styles.mb}
          />
          <Button
            title="Back to Cart"
            onPress={() => router.replace('/cart')}
            variant="outline"
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
