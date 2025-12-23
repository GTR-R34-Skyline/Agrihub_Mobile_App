import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { productAPI } from '../../src/services/api';
import { ProductCard } from '../../src/components/ProductCard';
import { Input } from '../../src/components/Input';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { ErrorState } from '../../src/components/ErrorState';
import { theme } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../src/types';

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Herbs', 'Dairy', 'Others'];

export default function ProductCatalog() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'priceLow' | 'priceHigh'>('newest');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await productAPI.getAll();
      setProducts(data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch products', error);
      setError('Failed to load marketplace.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }

    // Filter by Category
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'priceLow':
          return a.price - b.price;
        case 'priceHigh':
          return b.price - a.price;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchProducts} />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Marketplace' }} />
      <View style={styles.container}>
        {/* Search & Header */}
        <View style={styles.header}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
                <Input
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search crops, fruits..."
                    containerStyle={styles.searchInput}
                    style={{ borderWidth: 0, height: 40 }} // Override Input styles
                />
            </View>
            
            {/* Sort Button (Simple Toggle) */}
            <TouchableOpacity 
                style={styles.sortBtn}
                onPress={() => {
                    if (sortBy === 'newest') setSortBy('priceLow');
                    else if (sortBy === 'priceLow') setSortBy('priceHigh');
                    else setSortBy('newest');
                }}
            >
                <Ionicons name="filter" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        style={[
                            styles.categoryChip,
                            selectedCategory === cat && styles.categoryChipActive
                        ]}
                        onPress={() => setSelectedCategory(cat)}
                    >
                        <Text style={[
                            styles.categoryText,
                            selectedCategory === cat && styles.categoryTextActive
                        ]}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
        
        {/* Product Grid */}
        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
                <ProductCard
                    product={item}
                    onPress={() => router.push(`/products/${item.id}`)}
                />
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 12,
      alignItems: 'center', // Center search bar and sort button vertically
  },
  searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 8,
      height: 48, // Fixed height for search container
      overflow: 'hidden', // Ensure content stays inside
  },
  searchIcon: {
      marginRight: 4,
  },
  searchInput: {
      flex: 1,
      marginBottom: 0, // Remove Input component's default margin
      height: '100%', // Take full height of container
      justifyContent: 'center', // Vertically align text input
  },
  sortBtn: {
      width: 48,
      height: 48,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
  },
  categoriesContainer: {
      height: 60,
  },
  categoriesContent: {
      paddingHorizontal: 16,
      alignItems: 'center',
      gap: 8,
  },
  categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
  },
  categoryChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
  },
  categoryText: {
      color: theme.colors.textSecondary,
      fontWeight: '600',
  },
  categoryTextActive: {
      color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
      justifyContent: 'space-between',
      gap: 16, // Use gap if supported or handle via item style
  },
  gridItem: {
      flex: 1,
      marginBottom: 16,
      maxWidth: '48%', // Ensure 2 columns
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
  },
});
