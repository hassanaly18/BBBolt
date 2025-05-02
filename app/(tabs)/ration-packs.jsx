import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import { categoryApi } from '../services/api';

export default function RationPacks() {
  const router = useRouter();
  const [step, setStep] = useState('categories'); // 'categories', 'subcategories', 'products'
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryApi.getAllCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    setLoading(true);
    try {
      const response = await categoryApi.getSubCategoriesByCategory(categoryId);
      setSubcategories(response.data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (subcategoryId) => {
    setLoading(true);
    try {
      // Fetch products by subcategory
      const response = await categoryApi.getProductsBySubCategory(subcategoryId);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    fetchSubcategories(category._id);
    setStep('subcategories');
  };

  const handleSubcategorySelect = (subcategory) => {
    setSelectedSubcategory(subcategory);
    fetchProducts(subcategory._id);
    setStep('products');
  };

  const toggleProductSelection = (product) => {
    const isSelected = selectedProducts.some(p => p._id === product._id);
    
    if (isSelected) {
      setSelectedProducts(selectedProducts.filter(p => p._id !== product._id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const handleGoBack = () => {
    if (step === 'subcategories') {
      setStep('categories');
      setSelectedCategory(null);
    } else if (step === 'products') {
      setStep('subcategories');
      setSelectedSubcategory(null);
    }
  };

  const handleCreateCustomPack = () => {
    if (selectedProducts.length === 0) return;

    const productTitles = selectedProducts.map(product => product.title);
    
    router.push({
      pathname: '/ration-pack-details',
      params: { 
        selectedItems: JSON.stringify(productTitles),
        productIds: JSON.stringify(selectedProducts.map(p => p._id))
      },
    });
  };

  // Predefined packs - could be loaded from an API in future
  const predefinedPacks = [
    {
      id: 1,
      name: 'Essential Pack',
      items: ['Atta', 'Rice', 'Dal', 'Oil'],
      price: 999,
      rating: 4.5,
    },
    {
      id: 2,
      name: 'Family Pack',
      items: ['Atta', 'Rice', 'Dal', 'Oil', 'Tea', 'Sugar'],
      price: 1499,
      rating: 4.8,
    },
  ];

  // Render functions for each step
  const renderCategories = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select a Category</Text>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <View style={styles.itemsGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category._id}
              style={styles.categoryCard}
              onPress={() => handleCategorySelect(category)}
            >
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderSubcategories = () => (
    <View style={styles.section}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity onPress={handleGoBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>
          {selectedCategory?.name}: Select Subcategory
        </Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <View style={styles.itemsGrid}>
          {subcategories.map((subcategory) => (
            <TouchableOpacity
              key={subcategory._id}
              style={styles.subcategoryCard}
              onPress={() => handleSubcategorySelect(subcategory)}
            >
              <Text style={styles.subcategoryName}>{subcategory.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderProducts = () => (
    <View style={styles.section}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity onPress={handleGoBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>
          {selectedSubcategory?.name}: Select Products
        </Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <View style={styles.itemsGrid}>
          {products.map((product) => (
            <TouchableOpacity
              key={product._id}
              style={[
                styles.productCard,
                selectedProducts.some(p => p._id === product._id) && styles.selectedProduct,
              ]}
              onPress={() => toggleProductSelection(product)}
            >
              <Text style={styles.productIcon}>🛒</Text>
              <Text style={styles.productName}>{product.title}</Text>
              <Text style={styles.productPrice}>Rs {product.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerText}>Ration Packs</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Selling Ration Packs</Text>
          <View style={styles.packsList}>
            {predefinedPacks.map((pack) => (
              <View key={pack.id} style={styles.packCard}>
                <Text style={styles.packName}>{pack.name}</Text>
                <Text style={styles.packItems}>{pack.items.join(', ')}</Text>
                <Text style={styles.packPrice}>Rs {pack.price}</Text>
                <View style={styles.rating}>
                  <MaterialIcons name="star" size={16} color="#FFD700" />
                  <Text style={{ marginLeft: 4, color: colors.text.secondary }}>
                    {pack.rating}
                  </Text>
                </View>
                <TouchableOpacity style={styles.addToCartButton}>
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.customizeSection}>
          <Text style={styles.sectionTitle}>Customize your Ration Pack</Text>
          
          {step === 'categories' && renderCategories()}
          {step === 'subcategories' && renderSubcategories()}
          {step === 'products' && renderProducts()}
        </View>
      </ScrollView>

      {step === 'products' && selectedProducts.length > 0 && (
        <View style={styles.createButtonContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Selected Items: {selectedProducts.length}</Text>
            <Text style={styles.totalPrice}>
              Rs {selectedProducts.reduce((total, product) => total + (parseFloat(product.price) || 0), 0)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateCustomPack}
          >
            <Text style={styles.createButtonText}>Create Custom Pack</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  header: {
    padding: 16,
    backgroundColor: colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  section: {
    padding: 16,
    backgroundColor: colors.background.white,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: colors.text.primary,
  },
  packsList: {
    gap: 12,
  },
  packCard: {
    backgroundColor: colors.background.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  packName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  packItems: {
    color: colors.text.secondary,
    marginTop: 4,
  },
  packPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  customizeSection: {
    padding: 16,
    backgroundColor: colors.background.white,
    marginTop: 8,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 16,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: colors.background.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.text.primary,
  },
  subcategoryCard: {
    width: '48%',
    backgroundColor: colors.background.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  subcategoryName: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.text.primary,
  },
  productCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.background.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedProduct: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  productIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  productName: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.text.primary,
  },
  productPrice: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  createButtonContainer: {
    padding: 16,
    backgroundColor: colors.background.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.text.primary,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  createButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});