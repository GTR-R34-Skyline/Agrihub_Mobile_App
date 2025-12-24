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
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    if (user.role !== 'admin') {
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

  const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    subtitle?: string;
  }) => (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Admin Dashboard' }} />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.greeting}>Hello, Admin</Text>
          <Text style={styles.date}>{new Date().toDateString()}</Text>

          {analytics && (
            <>
              <View style={styles.revenueCard}>
                <Text style={styles.revenueLabel}>Total Revenue</Text>
                <Text style={styles.revenueValue}>
                  ₹{analytics.total_revenue.toLocaleString()}
                </Text>
              </View>

              <View style={styles.grid}>
                <StatCard
                  title="Orders"
                  value={analytics.total_orders}
                  icon="cart"
                  color={theme.colors.primary}
                />
                <StatCard
                  title="Users"
                  value={analytics.total_users}
                  icon="people"
                  color={theme.colors.secondary}
                  subtitle={`${analytics.total_farmers} Farmers · ${analytics.total_buyers} Buyers`}
                />
                <StatCard
                  title="Products"
                  value={analytics.total_products}
                  icon="leaf"
                  color={theme.colors.success}
                  subtitle={`${analytics.pending_products} Pending`}
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
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text },
  date: { color: theme.colors.textSecondary, marginBottom: 24 },
  revenueCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  revenueLabel: { color: '#fff', opacity: 0.8 },
  revenueValue: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    width: (width - 56) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statTitle: { fontSize: 14, color: theme.colors.textSecondary },
  statSubtitle: { fontSize: 12, opacity: 0.7 },
});
