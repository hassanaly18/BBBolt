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
  Alert
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
  Check
} from 'lucide-react-native';
import colors from '../constants/colors';
import { categoryApi } from '../services/api';
import { useLocation } from '../context/LocationContext';

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
      <View style={styles.filterOption}>
        <Text style={styles.filterLabel}>Radius:</Text>
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
          <ChevronDown size={16} color={colors.text.secondary} />
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
                  <Check size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      <View style={styles.filterOption}>
        <Text style={styles.filterLabel}>Sort by:</Text>
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
          <ArrowUpDown size={16} color={colors.text.secondary} />
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
                  <Check size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  // Render selected products list
  const renderSelectedProductsList = () => {
    if (selectedProducts.length === 0) {
      return (
        <View style={styles.emptyProductsContainer}>
          <Text style={styles.emptyProductsText}>No products selected yet</Text>
          <Text style={styles.emptyProductsSubtext}>Select products from categories below to create your custom ration pack</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.selectedProductsContainer}>
        <Text style={styles.sectionTitle}>Your Ration Pack</Text>
        <FlatList
          data={selectedProducts}
          horizontal={false}
          renderItem={({ item }) => (
            <View style={styles.selectedProductCard}>
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
                <Trash size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={item => item._id}
        />
      </View>
    );
  };

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
          <ArrowLeft size={24} color={colors.text.primary} />
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
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>
          {selectedSubcategory?.name}: Select Products
        </Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <View style={styles.productsGrid}>
          {products.map((product) => (
            <TouchableOpacity
              key={product._id}
              style={[
                styles.productCard,
                selectedProducts.some(p => p._id === product._id) && styles.selectedProduct,
              ]}
              onPress={() => toggleProductSelection(product)}
            >
              <Image 
                source={{ uri: product.imageUrl || 'https://via.placeholder.com/80' }} 
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.title}</Text>
                <Text style={styles.productPrice}>Rs {product.price}</Text>
              </View>
              {selectedProducts.some(p => p._id === product._id) && (
                <View style={styles.selectedCheckmark}>
                  <Check size={16} color="#fff" />
                </View>
              )}
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
          <View style={styles.locationInfo}>
            <MapPin size={16} color={colors.primary} />
            <Text style={styles.locationText}>
              {location ? 'Using your current location' : 'Location not available'}
            </Text>
          </View>
        </View>

        {renderFiltersHeader()}
        
        {renderSelectedProductsList()}

        <View style={styles.customizeSection}>
          <Text style={styles.sectionTitle}>Customize your Ration Pack</Text>
          
          {step === 'categories' && renderCategories()}
          {step === 'subcategories' && renderSubcategories()}
          {step === 'products' && renderProducts()}
        </View>
      </ScrollView>

      {selectedProducts.length > 0 && (
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
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.text.secondary,
  },
  section: {
    padding: 16,
    backgroundColor: colors.background.white,
    marginVertical: 8,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: colors.text.primary,
    marginBottom: 12,
  },
  customizeSection: {
    padding: 16,
    backgroundColor: colors.background.white,
    marginTop: 8,
    borderRadius: 8,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: colors.background.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 12,
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
    width: '48%',
    backgroundColor: colors.background.white,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedProduct: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  productImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
    backgroundColor: '#f5f5f5',
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 4,
  },
  selectedCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.background.white,
    marginVertical: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  filterOption: {
    flex: 1,
    marginHorizontal: 4,
    position: 'relative',
  },
  filterLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  dropdownOptions: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    zIndex: 100,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionSelected: {
    backgroundColor: '#f6f0ff',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  dropdownOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  selectedProductsContainer: {
    backgroundColor: colors.background.white,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
  },
  selectedProductCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  selectedProductImage: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
    backgroundColor: '#f5f5f5',
  },
  selectedProductInfo: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  selectedProductTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  selectedProductPrice: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  removeButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyProductsContainer: {
    backgroundColor: colors.background.white,
    marginVertical: 8,
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyProductsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyProductsSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});