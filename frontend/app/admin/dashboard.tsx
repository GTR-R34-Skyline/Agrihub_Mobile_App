import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { adminAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { theme } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  total_users: number;
  total_farmers: number;
  total_buyers: number;
  total_products: number;
  approved_products: number;
  pending_products: number;
  total_orders: number;
  total_revenue: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const data = await adminAPI.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
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
    fetchAnalytics();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalytics();
  }, []);

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Admin Dashboard' }} />
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Hello, Admin</Text>
                <Text style={styles.date}>{new Date().toDateString()}</Text>
            </View>

            {analytics && (
                <>
                {/* Revenue Section */}
                <View style={styles.revenueCard}>
                    <View style={styles.revenueHeader}>
                        <Text style={styles.revenueLabel}>Total Revenue</Text>
                        <Ionicons name="wallet-outline" size={24} color="#fff" />
                    </View>
                    <Text style={styles.revenueValue}>₹{analytics.total_revenue.toLocaleString()}</Text>
                    <Text style={styles.revenueSub}>Lifetime earnings across the platform</Text>
                </View>

                <Text style={styles.sectionTitle}>Overview</Text>
                <View style={styles.grid}>
                    <StatCard 
                        title="Total Orders" 
                        value={analytics.total_orders} 
                        icon="cart" 
                        color={theme.colors.primary} 
                    />
                    <StatCard 
                        title="Users" 
                        value={analytics.total_users} 
                        icon="people" 
                        color={theme.colors.secondary}
                        subtitle={`${analytics.total_farmers} Farmers, ${analytics.total_buyers} Buyers`}
                    />
                    <StatCard 
                        title="Products" 
                        value={analytics.total_products} 
                        icon="leaf" 
                        color={theme.colors.success}
                        subtitle={`${analytics.pending_products} Pending Approval`}
                    />
                     <StatCard 
                        title="System Health" 
                        value="100%" 
                        icon="pulse" 
                        color={theme.colors.info}
                        subtitle="All systems operational"
                    />
                </View>
                </>
            )}
        </View>
      </ScrollView>
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
  header: {
      marginBottom: 24,
  },
  greeting: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
  },
  date: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 4,
  },
  revenueCard: {
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      padding: 24,
      marginBottom: 32,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
  },
  revenueHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
  },
  revenueLabel: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 16,
      fontWeight: '600',
  },
  revenueValue: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 8,
  },
  revenueSub: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 14,
  },
  sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
  },
  grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
  },
  card: {
      width: (width - 56) / 2, // 2 columns with padding/gap
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
  },
  iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
  },
  statContent: {
      flex: 1,
  },
  statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
  },
  statTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 4,
  },
  statSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      opacity: 0.8,
  },
});
