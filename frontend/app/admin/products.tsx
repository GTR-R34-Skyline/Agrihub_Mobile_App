import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image, Alert, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { adminAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/Button';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { theme } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../src/types';

export default function AdminProductsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingProducts = async () => {
    try {
      const data = await adminAPI.getPendingProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch pending products', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Basic role check
    if (user && user.role !== 'admin') {
         router.replace('/');
         return;
    }
    fetchPendingProducts();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPendingProducts();
  }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
      try {
          setProcessingId(id);
          await adminAPI.approveProduct(id, status);
          
          // Remove from list
          setProducts(prev => prev.filter(p => p.id !== id));
          
          Alert.alert('Success', `Product ${status} successfully`);
      } catch (error: any) {
          Alert.alert('Error', error.message || `Failed to ${status} product`);
      } finally {
          setProcessingId(null);
      }
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
          {item.images && item.images.length > 0 ? (
              <Image source={{ uri: item.images[0] }} style={styles.productImage} />
          ) : (
              <View style={[styles.productImage, styles.placeholderImage]}>
                  <Ionicons name="image-outline" size={32} color={theme.colors.textSecondary} />
              </View>
          )}
          
          <View style={styles.details}>
              <View style={styles.headerRow}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>₹{item.price.toFixed(2)}</Text>
              </View>
              
              <Text style={styles.categoryBadge}>{item.category}</Text>
              <Text style={styles.stockText}>Quantity: {item.quantity}</Text>
              
              {item.farmer && (
                  <View style={styles.farmerRow}>
                      <Ionicons name="person-outline" size={12} color={theme.colors.textSecondary} />
                      <Text style={styles.farmerName}>Farmer: {item.farmer.name}</Text>
                  </View>
              )}
          </View>
      </View>
      
      <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>Description:</Text>
          <Text style={styles.descriptionText} numberOfLines={3}>{item.description}</Text>
      </View>

      <View style={styles.actionFooter}>
          <Button 
            title="Reject" 
            onPress={() => handleAction(item.id, 'rejected')}
            variant="outline"
            style={[styles.actionBtn, { borderColor: theme.colors.error }]}
            textStyle={{ color: theme.colors.error }}
            loading={processingId === item.id}
            disabled={processingId !== null}
          />
          <Button 
            title="Approve" 
            onPress={() => handleAction(item.id, 'approved')}
            style={styles.actionBtn}
            loading={processingId === item.id}
            disabled={processingId !== null}
          />
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Pending Approvals' }} />
      <View style={styles.container}>
        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color={theme.colors.success} />
            <Text style={styles.emptyText}>All Caught Up!</Text>
            <Text style={styles.emptySubText}>No pending products to review.</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProductCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
  },
  emptySubText: {
      color: theme.colors.textSecondary,
      marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
  },
  productName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
      marginRight: 8,
  },
  productPrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
  },
  categoryBadge: {
      fontSize: 12,
      color: theme.colors.primary,
      backgroundColor: theme.colors.primary + '15',
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 6,
  },
  stockText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
  },
  farmerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
  },
  farmerName: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
  },
  descriptionContainer: {
      backgroundColor: '#f9f9f9',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
  },
  descriptionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
  },
  descriptionText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
  },
  actionFooter: {
      flexDirection: 'row',
      gap: 12,
  },
  actionBtn: {
      flex: 1,
  },
});
