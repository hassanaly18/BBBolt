import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  FlatList,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft,
  MapPin,
  Filter,
  ShoppingCart,
  Trash,
  ChevronDown,
  ArrowUpDown,
  Check,
  Package,
  Star,
  Tag,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/theme';
import { categoryApi } from '../services/api';
import { useLocation } from '../context/LocationContext';
import theme from '../constants/theme';

const { width } = Dimensions.get('window');

export default function RationPacks() {
  const router = useRouter();
  const { location, getCurrentLocation } = useLocation();
  const [step, setStep] = useState('categories'); // 'categories', 'subcategories', 'products'
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // New state for radius and sorting
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [sortBy, setSortBy] = useState('nearest');
  const [showRadiusOptions, setShowRadiusOptions] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  // Predefined radius options
  const radiusOptions = [
    { value: 1, label: '1 km' },
    { value: 3, label: '3 km' },
    { value: 5, label: '5 km' },
    { value: 10, label: '10 km' },
    { value: 15, label: '15 km' },
    { value: 20, label: '20 km' },
    { value: 25, label: '25 km' },
    { value: 50, label: '50 km' },
  ];
  
  // Sorting options
  const sortOptions = {
    nearest: 'Nearest First',
    farthest: 'Farthest First',
    cheapest: 'Price: Low to High',
    expensive: 'Price: High to Low',
  };

  // Load categories and get location when component mounts
  useEffect(() => {
    fetchCategories();
    getCurrentLocation();
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
    if (selectedProducts.length === 0) {
      Alert.alert('Error', 'Please select at least one product for your ration pack');
      return;
    }

    const productTitles = selectedProducts.map(product => product.title);
    
    router.push({
      pathname: '/ration-pack-details',
      params: { 
        selectedItems: JSON.stringify(productTitles),
        productIds: JSON.stringify(selectedProducts.map(p => p._id)),
        radius: selectedRadius,
        sortBy: sortBy
      },
    });
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p._id !== productId));
  };

  // Render functions for the header with filters
  const renderFiltersHeader = () => (
    <View style={styles.filtersHeader}>
      <LinearGradient
        colors={theme.colors.gradients.card}
        style={styles.filtersHeaderGradient}
      >
        <View style={styles.filterOption}>
          <Text style={styles.filterLabel}>Search Radius</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => {
              setShowRadiusOptions(!showRadiusOptions);
              setShowSortOptions(false);
            }}
          >
            <Text style={styles.dropdownButtonText}>
              {radiusOptions.find(opt => opt.value === selectedRadius)?.label || '5 km'}
            </Text>
            <ChevronDown size={16} color={theme.colors.text.secondary} />
          </TouchableOpacity>
          
          {showRadiusOptions && (
            <View style={styles.dropdownOptions}>
              {radiusOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownOption,
                    selectedRadius === option.value && styles.dropdownOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedRadius(option.value);
                    setShowRadiusOptions(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.dropdownOptionText,
                      selectedRadius === option.value && styles.dropdownOptionTextSelected
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedRadius === option.value && (
                    <Check size={16} color={theme.colors.primary.main} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.filterOption}>
          <Text style={styles.filterLabel}>Sort By</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => {
              setShowSortOptions(!showSortOptions);
              setShowRadiusOptions(false);
            }}
          >
            <Text style={styles.dropdownButtonText}>
              {sortOptions[sortBy] || 'Nearest First'}
            </Text>
            <ArrowUpDown size={16} color={theme.colors.text.secondary} />
          </TouchableOpacity>
          
          {showSortOptions && (
            <View style={styles.dropdownOptions}>
              {Object.entries(sortOptions).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.dropdownOption,
                    sortBy === key && styles.dropdownOptionSelected
                  ]}
                  onPress={() => {
                    setSortBy(key);
                    setShowSortOptions(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.dropdownOptionText,
                      sortBy === key && styles.dropdownOptionTextSelected
                    ]}
                  >
                    {label}
                  </Text>
                  {sortBy === key && (
                    <Check size={16} color={theme.colors.primary.main} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  // Render selected products list
  const renderSelectedProductsList = () => {
    if (selectedProducts.length === 0) {
      return (
        <View style={styles.emptyProductsContainer}>
          <LinearGradient
            colors={theme.colors.gradients.card}
            style={styles.emptyProductsGradient}
          >
            <Package size={48} color={theme.colors.primary.main} />
            <Text style={styles.emptyProductsText}>No products selected yet</Text>
            <Text style={styles.emptyProductsSubtext}>Select products from categories below to create your custom ration pack</Text>
          </LinearGradient>
        </View>
      );
    }
    
    return (
      <View style={styles.selectedProductsContainer}>
        <LinearGradient
          colors={theme.colors.gradients.card}
          style={styles.selectedProductsGradient}
        >
          <View style={styles.sectionHeader}>
            <Package size={20} color={theme.colors.primary.main} />
            <Text style={styles.sectionTitle}>Your Ration Pack</Text>
            <View style={styles.selectedCountBadge}>
              <Text style={styles.selectedCountText}>{selectedProducts.length}</Text>
            </View>
          </View>
          <View>
            {selectedProducts.map((item) => (
              <View key={item._id} style={styles.selectedProductCard}>
                <Image 
                  source={{ uri: item.imageUrl || 'https://via.placeholder.com/60' }} 
                  style={styles.selectedProductImage}
                />
                <View style={styles.selectedProductInfo}>
                  <Text style={styles.selectedProductTitle}>{item.title}</Text>
                  <Text style={styles.selectedProductPrice}>Rs {item.price}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeProduct(item._id)}
                >
                  <Trash size={18} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>
    );
  };

  // Render functions for each step
  const renderCategories = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Package size={20} color={theme.colors.primary.main} />
        <Text style={styles.sectionTitle}>Select a Category</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : (
        <View style={styles.itemsGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category._id}
              style={styles.categoryCard}
              onPress={() => handleCategorySelect(category)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.colors.gradients.card}
                style={styles.categoryCardGradient}
              >
                <View style={styles.categoryIconContainer}>
                  <Package size={24} color={theme.colors.primary.main} />
                </View>
                <Text style={styles.categoryName}>{category.name.replace(/_/g, ' ')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderSubcategories = () => (
    <View style={styles.section}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={theme.colors.primary.main} />
        </TouchableOpacity>
        <View style={styles.sectionHeader}>
          <Package size={20} color={theme.colors.primary.main} />
          <Text style={styles.sectionTitle}>
            {selectedCategory?.name.replace(/_/g, ' ')}: Select Subcategory
          </Text>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading subcategories...</Text>
        </View>
      ) : (
        <View style={styles.itemsGrid}>
          {subcategories.map((subcategory) => (
            <TouchableOpacity
              key={subcategory._id}
              style={styles.subcategoryCard}
              onPress={() => handleSubcategorySelect(subcategory)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.colors.gradients.card}
                style={styles.subcategoryCardGradient}
              >
                <View style={styles.subcategoryIconContainer}>
                  <Tag size={20} color={theme.colors.secondary.main} />
                </View>
                <Text style={styles.subcategoryName}>{subcategory.name.replace(/_/g, ' ')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderProducts = () => (
    <View style={styles.section}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={theme.colors.primary.main} />
        </TouchableOpacity>
        <View style={styles.sectionHeader}>
          <Package size={20} color={theme.colors.primary.main} />
          <Text style={styles.sectionTitle}>
            {selectedSubcategory?.name.replace(/_/g, ' ')}: Select Products
          </Text>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <View style={styles.productsGrid}>
          {products.map((product) => {
            const isSelected = selectedProducts.some(p => p._id === product._id);
            return (
              <TouchableOpacity
                key={product._id}
                style={[
                  styles.productCard,
                  isSelected && styles.selectedProduct,
                ]}
                onPress={() => toggleProductSelection(product)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isSelected ? theme.colors.gradients.primary : theme.colors.gradients.card}
                  style={styles.productCardGradient}
                >
                  <Image 
                    source={{ uri: product.imageUrl || 'https://via.placeholder.com/80' }} 
                    style={styles.productImage}
                  />
                  <View style={styles.productInfo}>
                    <Text style={[
                      styles.productName,
                      isSelected && styles.selectedProductText
                    ]}>{product.title}</Text>
                    <Text style={[
                      styles.productPrice,
                      isSelected && styles.selectedProductText
                    ]}>Rs {product.price}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.selectedCheckmark}>
                      <Check size={16} color={theme.colors.primary.contrastText} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={theme.colors.gradients.primary}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Package size={28} color={theme.colors.primary.contrastText} />
            <Text style={styles.headerText}>Ration Packs</Text>
          </View>
          <View style={styles.locationInfo}>
            <MapPin size={16} color={theme.colors.secondary.main} />
            <Text style={styles.locationText}>
              {location ? 'Using your current location' : 'Location not available'}
            </Text>
          </View>
        </LinearGradient>

        {renderFiltersHeader()}
        
        {renderSelectedProductsList()}

        <View style={styles.customizeSection}>
          <View style={styles.sectionHeader}>
            <Package size={20} color={theme.colors.primary.main} />
            <Text style={styles.sectionTitle}>Customize your Ration Pack</Text>
          </View>
          
          {step === 'categories' && renderCategories()}
          {step === 'subcategories' && renderSubcategories()}
          {step === 'products' && renderProducts()}
        </View>
      </ScrollView>

      {selectedProducts.length > 0 && (
        <View style={styles.createButtonContainer}>
          <LinearGradient
            colors={theme.colors.gradients.card}
            style={styles.createButtonGradient}
          >
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Selected Items: {selectedProducts.length}</Text>
              <Text style={styles.totalPrice}>
                Rs {selectedProducts.reduce((total, product) => total + (parseFloat(product.price) || 0), 0)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateCustomPack}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.colors.gradients.primary}
                style={styles.createButtonGradient}
              >
                <Package size={20} color={theme.colors.primary.contrastText} />
                <Text style={styles.createButtonText}>Create Custom Pack</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  headerText: {
    ...theme.typography.h2,
    color: theme.colors.primary.contrastText,
    marginLeft: theme.spacing.sm,
  },
  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    ...theme.typography.body2,
    color: theme.colors.primary.contrastText,
    marginLeft: theme.spacing.xs,
  },
  section: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  customizeSection: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  categoryCardGradient: {
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryName: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  subcategoryCard: {
    width: '48%',
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  subcategoryCardGradient: {
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  subcategoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.secondary.main + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  subcategoryName: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  productCard: {
    width: '48%',
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  productCardGradient: {
    padding: theme.spacing.sm,
    position: 'relative',
  },
  selectedProduct: {
    ...theme.shadows.lg,
  },
  productImage: {
    width: '100%',
    height: 80,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.secondary,
  },
  productInfo: {
    paddingTop: theme.spacing.sm,
  },
  productName: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  selectedProductText: {
    color: theme.colors.primary.contrastText,
  },
  productPrice: {
    ...theme.typography.h5,
    color: theme.colors.primary.main,
  },
  selectedCheckmark: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.secondary.main,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonContainer: {
    padding: theme.spacing.md,
    ...theme.shadows.lg,
  },
  createButtonGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  totalLabel: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
  },
  totalPrice: {
    ...theme.typography.h3,
    color: theme.colors.primary.main,
  },
  createButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  createButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary.contrastText,
    marginLeft: theme.spacing.sm,
  },
  filtersHeader: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  filtersHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  filterOption: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    position: 'relative',
  },
  filterLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background.white,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    ...theme.shadows.xs,
  },
  dropdownButtonText: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
  },
  dropdownOptions: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background.white,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.lg,
    zIndex: 100,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownOptionSelected: {
    backgroundColor: theme.colors.primary.main + '10',
  },
  dropdownOptionText: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
  },
  dropdownOptionTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  selectedProductsContainer: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  selectedProductsGradient: {
    padding: theme.spacing.md,
  },
  selectedCountBadge: {
    backgroundColor: theme.colors.secondary.main,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  selectedCountText: {
    ...theme.typography.caption,
    color: theme.colors.secondary.contrastText,
    fontWeight: '600',
  },
  selectedProductCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.white,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  selectedProductImage: {
    width: 60,
    height: 60,
    backgroundColor: theme.colors.background.secondary,
  },
  selectedProductInfo: {
    flex: 1,
    padding: theme.spacing.sm,
    justifyContent: 'center',
  },
  selectedProductTitle: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  selectedProductPrice: {
    ...theme.typography.h5,
    color: theme.colors.primary.main,
  },
  removeButton: {
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyProductsContainer: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  emptyProductsGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyProductsText: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyProductsSubtext: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
});