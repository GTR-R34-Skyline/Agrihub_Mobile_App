import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { orderAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/Button';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { theme } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { Order, OrderItem } from '../../src/types';

export default function FarmerOrdersScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const data = await orderAPI.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Basic role check
    if (user && user.role !== 'farmer') {
         router.replace('/');
         return;
    }
    fetchOrders();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
      try {
          setUpdatingId(orderId);
          await orderAPI.updateStatus(orderId, newStatus);
          
          // Optimistic update or refetch
          setOrders(prevOrders => 
            prevOrders.map(order => 
                order.id === orderId ? { ...order, status: newStatus as any } : order
            )
          );
          
          Alert.alert('Success', `Order status updated to ${newStatus}`);
      } catch (error: any) {
          Alert.alert('Error', error.message || 'Failed to update status');
      } finally {
          setUpdatingId(null);
      }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'confirmed': return theme.colors.primary;
      case 'shipped': return theme.colors.info;
      case 'delivered': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const renderOrderItem = (item: OrderItem) => (
    <View key={item.id} style={styles.orderItem}>
      <Text style={styles.itemText}>
        {item.quantity} x {item.product?.name || 'Product'}
      </Text>
      <Text style={styles.itemPrice}>₹{(item.price_at_purchase * item.quantity).toFixed(2)}</Text>
    </View>
  );

  const renderActionButtons = (order: Order) => {
      if (updatingId === order.id) {
          return <LoadingSpinner />;
      }

      switch (order.status) {
          case 'pending':
              return (
                  <Button 
                    title="Confirm Order" 
                    onPress={() => handleUpdateStatus(order.id, 'confirmed')}
                    size="small"
                  />
              );
          case 'confirmed':
              return (
                  <Button 
                    title="Ship Order" 
                    onPress={() => handleUpdateStatus(order.id, 'shipped')}
                    size="small"
                    variant="secondary"
                  />
              );
          case 'shipped':
              return (
                  <Button 
                    title="Mark Delivered" 
                    onPress={() => handleUpdateStatus(order.id, 'delivered')}
                    size="small"
                    style={{ backgroundColor: theme.colors.success }}
                  />
              );
          case 'delivered':
              return (
                  <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                      <Text style={styles.completedText}>Order Completed</Text>
                  </View>
              );
          default:
              return null;
      }
  };

  const renderOrderCard = ({ item }: { item: Order }) => {
    const isExpanded = expandedOrderId === item.id;
    const date = new Date(item.created_at).toLocaleDateString();
    
    return (
      <View style={styles.card}>
        <TouchableOpacity 
            style={styles.cardHeader} 
            onPress={() => toggleExpand(item.id)}
            activeOpacity={0.7}
        >
          <View style={styles.headerTop}>
            <Text style={styles.orderId}>Order #{item.id.slice(-6)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerMiddle}>
             <Text style={styles.dateText}>{date}</Text>
             <Text style={styles.totalText}>₹{item.total_amount.toFixed(2)}</Text>
          </View>
          
          {item.buyer && (
             <View style={styles.buyerRow}>
                 <Ionicons name="person-outline" size={14} color={theme.colors.textSecondary} />
                 <Text style={styles.buyerName}>{item.buyer.name}</Text>
             </View>
          )}

          <View style={styles.expandIcon}>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.cardBody}>
            <View style={styles.divider} />
            
            <View style={styles.actionsContainer}>
                {renderActionButtons(item)}
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Items</Text>
            {item.items?.map(renderOrderItem)}
            
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <Text style={styles.addressText}>{item.shipping_address}</Text>

            {item.buyer && item.buyer.phone && (
                 <View style={styles.contactContainer}>
                     <Ionicons name="call-outline" size={16} color={theme.colors.primary} />
                     <Text style={styles.contactText}>{item.buyer.phone}</Text>
                 </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Manage Orders' }} />
      <View style={styles.container}>
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No orders received yet</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderCard}
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
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerMiddle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
  },
  dateText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
  },
  totalText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
  },
  buyerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 6,
  },
  buyerName: {
      fontSize: 14,
      color: theme.colors.textSecondary,
  },
  expandIcon: {
      alignItems: 'center',
      marginTop: 8,
  },
  cardBody: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#fafafa',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  actionsContainer: {
      alignItems: 'center',
      marginBottom: 8,
  },
  completedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 8,
      backgroundColor: theme.colors.success + '10',
      borderRadius: 8,
      width: '100%',
      justifyContent: 'center',
  },
  completedText: {
      color: theme.colors.success,
      fontWeight: 'bold',
  },
  sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  addressText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
      marginBottom: 8,
  },
  contactContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
  },
  contactText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
  },
});
