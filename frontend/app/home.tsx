import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { productAPI } from '../src/services/api';
import { ProductCard } from '../src/components/ProductCard';
import { LoadingSpinner } from '../src/components/LoadingSpinner';
import { EmptyState } from '../src/components/EmptyState';
import { ErrorState } from '../src/components/ErrorState';
import { theme } from '../src/utils/theme';
import { Product } from '../src/types';

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'TA'>('EN');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await productAPI.getAll();
      setProducts(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                  <View style={styles.logoContainer}>
                    <Ionicons name="leaf" size={32} color={theme.colors.primary} />
                    <Text style={styles.logoText}>AgriHub</Text>
                  </View>
                  <TouchableOpacity onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
                 <Text style={styles.welcome}>Welcome, {user?.name}!</Text>
            </View>
            <View style={{flex: 1, justifyContent: 'center'}}>
                 <ErrorState message={error} onRetry={fetchProducts} />
            </View>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Ionicons name="leaf" size={32} color={theme.colors.primary} />
            <Text style={styles.logoText}>AgriHub</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => setLanguage(language === 'EN' ? 'TA' : 'EN')}
            >
              <Text style={styles.languageText}>{language}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.welcome}>Welcome, {user?.name}!</Text>
        <Text style={styles.subtitle}>Connecting Farmers & Buyers</Text>
      </View>

      <View style={styles.heroSection}>
        <View style={styles.heroBadge}>
          <Ionicons name="leaf" size={20} color={theme.colors.primary} />
          <Text style={styles.heroBadgeText}>Fresh from Farm</Text>
        </View>
        <Text style={styles.heroTitle}>Farm Fresh Products</Text>
        <Text style={styles.heroSubtitle}>
          Discover organic products directly from local farmers
        </Text>
      </View>

      {user?.role === 'buyer' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/products')}
          >
            <Ionicons name="cart" size={24} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Buy Crops</Text>
          </TouchableOpacity>
        </View>
      )}

      {user?.role === 'farmer' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/farmer/products')}
          >
            <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Sell Crops</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/farmer/orders')}
          >
            <Ionicons name="list" size={24} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>My Orders</Text>
          </TouchableOpacity>
        </View>
      )}

      {user?.role === 'admin' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/admin/dashboard')}
          >
            <Ionicons name="stats-chart" size={24} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/admin/products')}
          >
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Approve Products</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Products</Text>
        {user?.role === 'buyer' && (
          <TouchableOpacity onPress={() => router.push('/products')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.productsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {products.length === 0 ? (
          <EmptyState
            icon="basket-outline"
            title="No Products Yet"
            message="Check back soon for fresh farm products!"
          />
        ) : (
          <View style={styles.productsList}>
            {products.slice(0, 6).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => router.push(`/products/${product.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  logoText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  languageButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary,
  },
  languageText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  welcome: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  heroSection: {
    backgroundColor: theme.colors.leaf + '15',
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  heroBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  heroSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    gap: theme.spacing.sm,
  },
  actionButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  viewAll: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  productsContainer: {
    flex: 1,
  },
  productsList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
});
