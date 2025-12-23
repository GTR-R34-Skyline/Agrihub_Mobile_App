import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, ScrollView, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { productAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { theme } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../src/types';

export default function FarmerProductsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    description: '',
    image: null as string | null,
  });

  useEffect(() => {
    // Basic role check (though navigation should handle this)
    if (user && user.role !== 'farmer') {
         router.replace('/');
         return;
    }
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    try {
      const data = await productAPI.getFarmerProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      quantity: '',
      description: '',
      image: null,
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      description: product.description,
      image: product.images && product.images.length > 0 ? product.images[0] : null,
    });
    setIsEditing(true);
    setEditingId(product.id);
    setModalVisible(true);
  };

  const pickImage = async () => {
    // Request permission
    if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const base64Image = `data:image/jpeg;base64,${asset.base64}`;
      setFormData({ ...formData, image: base64Image });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.category) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
    }

    setSubmitting(true);
    try {
        const payload = {
            name: formData.name,
            category: formData.category,
            price: parseFloat(formData.price),
            quantity: parseInt(formData.quantity) || 0,
            description: formData.description,
            images: formData.image ? [formData.image] : [],
        };

        if (isEditing && editingId) {
            await productAPI.update(editingId, payload);
            Alert.alert('Success', 'Product updated successfully');
        } else {
            await productAPI.create(payload);
            Alert.alert('Success', 'Product created successfully');
        }
        
        setModalVisible(false);
        fetchProducts();
    } catch (error: any) {
        Alert.alert('Error', error.message || 'Operation failed');
    } finally {
        setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
        'Delete Product',
        'Are you sure you want to delete this product?',
        [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        await productAPI.delete(id);
                        fetchProducts();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete product');
                    }
                }
            }
        ]
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <View style={[
                styles.statusBadge, 
                item.status === 'approved' ? styles.statusApproved : 
                item.status === 'rejected' ? styles.statusRejected : styles.statusPending
            ]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
        </View>
        <Text style={styles.productPrice}>₹{item.price.toFixed(2)}</Text>
      </View>
      
      <View style={styles.cardBody}>
          {item.images && item.images.length > 0 ? (
              <Image source={{ uri: item.images[0] }} style={styles.productImage} />
          ) : (
              <View style={[styles.productImage, styles.placeholderImage]}>
                  <Ionicons name="image-outline" size={24} color={theme.colors.textSecondary} />
              </View>
          )}
          <View style={styles.details}>
              <Text style={styles.detailText}>Category: {item.category}</Text>
              <Text style={styles.detailText}>Stock: {item.quantity}</Text>
              <Text style={styles.detailText} numberOfLines={2}>{item.description}</Text>
          </View>
      </View>

      <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.editBtn]} 
            onPress={() => openEditModal(item)}
          >
              <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item.id)}
          >
              <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
              <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'My Products' }} />
      <View style={styles.container}>
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
              <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No products found.</Text>
                  <Text style={styles.emptySubText}>Add your first product to start selling.</Text>
              </View>
          }
        />

        <TouchableOpacity style={styles.fab} onPress={openAddModal}>
            <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>

        {/* Add/Edit Modal */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{isEditing ? 'Edit Product' : 'Add New Product'}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                            {formData.image ? (
                                <Image source={{ uri: formData.image }} style={styles.previewImage} />
                            ) : (
                                <View style={styles.imagePlaceholder}>
                                    <Ionicons name="camera" size={32} color={theme.colors.textSecondary} />
                                    <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <Input
                            label="Product Name"
                            value={formData.name}
                            onChangeText={(text) => setFormData({...formData, name: text})}
                            placeholder="e.g., Organic Tomatoes"
                        />
                        <Input
                            label="Category"
                            value={formData.category}
                            onChangeText={(text) => setFormData({...formData, category: text})}
                            placeholder="e.g., Vegetables"
                        />
                        <View style={styles.row}>
                            <Input
                                label="Price (₹)"
                                value={formData.price}
                                onChangeText={(text) => setFormData({...formData, price: text})}
                                keyboardType="numeric"
                                containerStyle={{ flex: 1, marginRight: 8 }}
                            />
                            <Input
                                label="Quantity"
                                value={formData.quantity}
                                onChangeText={(text) => setFormData({...formData, quantity: text})}
                                keyboardType="numeric"
                                containerStyle={{ flex: 1, marginLeft: 8 }}
                            />
                        </View>
                        <Input
                            label="Description"
                            value={formData.description}
                            onChangeText={(text) => setFormData({...formData, description: text})}
                            multiline
                            numberOfLines={3}
                            style={{ height: 80, textAlignVertical: 'top' }}
                        />

                        <Button 
                            title={isEditing ? "Update Product" : "Create Product"}
                            onPress={handleSubmit}
                            loading={submitting}
                            style={{ marginTop: 10 }}
                        />
                    </ScrollView>
                </View>
            </View>
        </Modal>
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
    paddingBottom: 80,
  },
  emptyContainer: {
      alignItems: 'center',
      marginTop: 40,
  },
  emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
  },
  emptySubText: {
      color: theme.colors.textSecondary,
      marginTop: 8,
  },
  fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
  },
  card: {
      backgroundColor: '#fff',
      borderRadius: 12,
      marginBottom: 16,
      padding: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
  },
  cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
  },
  headerInfo: {
      flex: 1,
  },
  productName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
  },
  productPrice: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginLeft: 8,
  },
  statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
  },
  statusPending: {
      backgroundColor: theme.colors.warning + '20',
  },
  statusApproved: {
      backgroundColor: theme.colors.success + '20',
  },
  statusRejected: {
      backgroundColor: theme.colors.error + '20',
  },
  statusText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: theme.colors.textSecondary,
  },
  cardBody: {
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
      justifyContent: 'center',
  },
  detailText: {
      color: theme.colors.textSecondary,
      marginBottom: 2,
      fontSize: 14,
  },
  cardFooter: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
  },
  actionBtn: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
  },
  editBtn: {
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
  },
  deleteBtn: {
      
  },
  editBtnText: {
      color: theme.colors.primary,
      fontWeight: '600',
  },
  deleteBtnText: {
      color: theme.colors.error,
      fontWeight: '600',
  },
  
  // Modal Styles
  modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
  },
  modalContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '90%',
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
  },
  imagePicker: {
      width: '100%',
      height: 200,
      backgroundColor: '#f0f0f0',
      borderRadius: 12,
      marginBottom: 20,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
  },
  previewImage: {
      width: '100%',
      height: '100%',
  },
  imagePlaceholder: {
      alignItems: 'center',
  },
  imagePlaceholderText: {
      marginTop: 8,
      color: theme.colors.textSecondary,
  },
  row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
  },
});
