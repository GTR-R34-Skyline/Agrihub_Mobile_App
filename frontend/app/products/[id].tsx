import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { productAPI, cartAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/Button';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { theme } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productAPI.getById(id as string);
      setProduct(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add items to cart', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ]);
      return;
    }

    if (user.role !== 'buyer') {
      Alert.alert('Restricted', 'Only buyers can add items to cart');
      return;
    }

    try {
      setAddingToCart(true);
      await cartAPI.add(product.id, 1);
      Alert.alert('Success', 'Added to cart successfully', [
        { text: 'Keep Shopping', style: 'cancel' },
        { text: 'Go to Cart', onPress: () => router.push('/cart') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="outline" style={{ marginTop: 20 }} />
      </View>
    );
  }

  const isOutOfStock = product.quantity <= 0;

  return (
    <>
      <Stack.Screen options={{ title: product.name }} />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image */}
          <View style={styles.imageContainer}>
            {product.images && product.images.length > 0 ? (
              <Image source={{ uri: product.images[0] }} style={styles.image} resizeMode="cover" />
            ) : (
                <View style={[styles.image, styles.placeholderImage]}>
                    <Ionicons name="image-outline" size={64} color={theme.colors.textSecondary} />
                </View>
            )}
            {isOutOfStock && (
                <View style={styles.outOfStockBadge}>
                    <Text style={styles.outOfStockText}>Out of Stock</Text>
                </View>
            )}
          </View>

          <View style={styles.content}>
            {/* Header Info */}
            <View style={styles.headerRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{product.category}</Text>
              </View>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {product.avg_rating ? product.avg_rating.toFixed(1) : 'No ratings'} ({product.review_count || 0})
                </Text>
              </View>
            </View>

            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.price}>₹{product.price.toFixed(2)}</Text>

            {/* Farmer Info */}
            {product.farmer && (
              <View style={styles.farmerContainer}>
                <View style={styles.farmerAvatar}>
                    <Ionicons name="person" size={20} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.soldByLabel}>Sold by</Text>
                  <Text style={styles.farmerName}>{product.farmer.name}</Text>
                </View>
              </View>
            )}

            {/* Description */}
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>

            {/* Available Quantity */}
            <View style={styles.stockContainer}>
                <Text style={styles.stockLabel}>Available Quantity:</Text>
                <Text style={styles.stockValue}>{product.quantity} units</Text>
            </View>
            
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <Button
            title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
            onPress={handleAddToCart}
            loading={addingToCart}
            disabled={isOutOfStock}
            style={styles.addToCartBtn}
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e1e1e1',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  outOfStockText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 12,
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary + '20', // 20% opacity
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 20,
  },
  farmerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  farmerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
  },
  soldByLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textSecondary,
    marginBottom: 24,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 80, // Space for bottom bar
  },
  stockLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginRight: 8,
  },
  stockValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addToCartBtn: {
    width: '100%',
  },
});
