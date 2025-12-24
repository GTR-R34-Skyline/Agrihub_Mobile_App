import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useCartStore } from '../src/store/cartStore';
import { paymentAPI, orderAPI } from '../src/services/api';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { theme } from '../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, total } = useCartStore();

  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!address.trim()) {
      Alert.alert('Required', 'Please enter a shipping address');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      router.back();
      return;
    }

    // 🔒 Type-safe validation
    const invalidItem = items.find(item => !item.product);
    if (invalidItem) {
      Alert.alert(
        'Cart Error',
        'Some products are no longer available. Please refresh your cart.'
      );
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Mock payment
      const paymentResult = await paymentAPI.process();

      if (!paymentResult.success) {
        router.replace('/payment/failure');
        return;
      }

      // 2️⃣ Create backend-safe order payload
      const orderItems = items.map(item => ({
        product_id: item.product!.id, // safe due to validation above
        quantity: item.quantity,
      }));

      // 3️⃣ Create order
      await orderAPI.create(address, orderItems);

      // 4️⃣ Navigate to success screen
      router.replace('/payment/success');

    } catch (error: any) {
      console.error('Checkout error:', error);
      Alert.alert('Error', error.message || 'Order creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Checkout' }} />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Shipping Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <Input
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your full address"
              multiline
              numberOfLines={3}
              style={{ height: 100, textAlignVertical: 'top' }}
            />
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>

            {items.map(item => (
              <View key={item.id} style={styles.summaryItem}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.product!.name} × {item.quantity}
                </Text>
                <Text style={styles.itemPrice}>
                  ₹{item.product!.price * item.quantity}
                </Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title={`Pay ₹${total.toFixed(2)}`}
            onPress={handlePayment}
            loading={loading}
            disabled={loading}
          />

          <View style={styles.secureBadge}>
            <Ionicons name="lock-closed" size={12} color={theme.colors.textSecondary} />
            <Text style={styles.secureText}>
              Payments are secure and encrypted
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  secureBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  secureText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
