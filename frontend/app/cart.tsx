import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useCartStore } from '../src/store/cartStore';
import { Button } from '../src/components/Button';
import { LoadingSpinner } from '../src/components/LoadingSpinner';
import { theme } from '../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '../src/types';

export default function CartScreen() {
  const router = useRouter();
  const { items, total, loading, fetchCart, updateQuantity, removeFromCart } = useCartStore();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    
    try {
      setUpdatingId(itemId);
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      Alert.alert('Error', 'Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
             try {
                setUpdatingId(itemId);
                await removeFromCart(itemId);
             } catch(error) {
                 Alert.alert('Error', 'Failed to remove item');
             } finally {
                 setUpdatingId(null);
             }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      {item.product?.images && item.product.images.length > 0 ? (
        <Image source={{ uri: item.product.images[0] }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.placeholderImage]}>
             <Ionicons name="image-outline" size={24} color={theme.colors.textSecondary} />
        </View>
      )}
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={1}>{item.product?.name || 'Unknown Product'}</Text>
        <Text style={styles.itemPrice}>₹{item.product?.price.toFixed(2)}</Text>
        
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
            disabled={updatingId === item.id}
          >
            <Ionicons name="remove" size={16} color={theme.colors.text} />
          </TouchableOpacity>
          
          <Text style={styles.qtyText}>{item.quantity}</Text>
          
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
            disabled={updatingId === item.id}
          >
            <Ionicons name="add" size={16} color={theme.colors.text} />
          </TouchableOpacity>

          {updatingId === item.id && (
             <View style={{marginLeft: 10}}>
                <LoadingSpinner /> 
             </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => handleRemoveItem(item.id)}
        disabled={updatingId === item.id}
      >
        <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );

  if (loading && items.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'My Cart' }} />
      <View style={styles.container}>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <Button
              title="Start Shopping"
              onPress={() => router.back()} // Or router.push('/products')
              variant="primary"
            />
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
            
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
              </View>
              <Button
                title="Proceed to Checkout"
                onPress={() => router.push('/checkout')}
              />
            </View>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  removeBtn: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    marginTop: 10,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});
