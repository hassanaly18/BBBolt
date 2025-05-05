// C:\Users\faeiz\Desktop\BBBolt\app\(tabs)\vendor-details.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import {
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShoppingCart,
  Star,
  Filter,
  ArrowUpDown,
  Tag,
  ChevronDown,
  Check,
  Store,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { vendorApi, categoryApi, vendorProductApi } from '../services/api';
import { useLocation } from '../context/LocationContext';
import { useCart } from '../context/CartContext';
import theme from '../theme';
import { Modal } from 'react-native';

const { width } = Dimensions.get('window');
const numColumns = 2;

// Sorting options
const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'cheapest', label: 'Price: Low to High' },
  { value: 'expensive', label: 'Price: High to Low' },
];

export default function VendorDetailsScreen() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const { location, getLocationParams } = useLocation();
  const { addToCart } = useCart();

  const [vendor, setVendor] = useState(null);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [sortBy, setSortBy] = useState('popular');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  // Fetch vendor details and products
  useEffect(() => {
    const fetchVendorDetails = async () => {
      try {
        setLoading(true);
        
        // Get vendor details
        const vendorResponse = await vendorApi.getVendorById(id);
        setVendor(vendorResponse.data);
        
        // Get categories for filtering
        const categoriesResponse = await categoryApi.getAllCategories();
        setCategories(categoriesResponse.data || []);
        
        // Get vendor products
        await fetchVendorProducts();
      } catch (error) {
        console.error('Error fetching vendor details:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchVendorDetails();
  }, [id]);
  
  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!selectedCategory) {
        setSubCategories([]);
        setSelectedSubCategory(null);
        return;
      }
      
      try {
        const response = await categoryApi.getSubCategoriesByCategory(selectedCategory);
        setSubCategories(response.data || []);
        setSelectedSubCategory(null); // Reset subcategory when category changes
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        setSubCategories([]);
      }
    };

    fetchSubCategories();
  }, [selectedCategory]);
  
  // Refetch products when filters change
  useEffect(() => {
    if (vendor) {
      fetchVendorProducts();
    }
  }, [selectedCategory, selectedSubCategory, sortBy]);
  
  // Fetch vendor products with filters
  const fetchVendorProducts = async () => {
    try {
      const locParams = getLocationParams ? getLocationParams() : {};
      
      // Prepare params for API call
      const params = {
        ...locParams,
        vendorId: id,
      };
      
      // Add category filter if selected
      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }
      
      // Add subcategory filter if selected
      if (selectedSubCategory) {
        params.subCategoryId = selectedSubCategory;
      }
      
      // Add sort parameter
      params.sortBy = sortBy;
      
      // Fetch vendor products
      const response = await vendorProductApi.getVendorProductsByFilters(params);
      
      if (response.data) {
        setVendorProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching vendor products:', error);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchVendorProducts();
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setSortBy('popular');
    setShowFilterModal(false);
  };
  
  // Apply filters and close modal
  const applyFilters = () => {
    setShowFilterModal(false);
  };
  
  // Utility: extract price from string or return number
  const extractPrice = (str) => {
    if (typeof str === 'number') return str;
    const m = String(str).match(/\d+/g);
    return m ? parseInt(m.join(''), 10) : 0;
  };
  
  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (vendorLocation) => {
    try {
      if (!location || !vendorLocation || !vendorLocation.coordinates) {
        return 'Unknown distance';
      }

      const vendorCoords = vendorLocation.coordinates;

      // Radius of the Earth in kilometers
      const R = 6371;

      // Convert latitude and longitude from degrees to radians
      const lat1Rad = location.latitude * (Math.PI / 180);
      const lat2Rad = vendorCoords[1] * (Math.PI / 180);
      const latDiffRad =
        (vendorCoords[1] - location.latitude) * (Math.PI / 180);
      const longDiffRad =
        (vendorCoords[0] - location.longitude) * (Math.PI / 180);

      // Haversine formula
      const a =
        Math.sin(latDiffRad / 2) * Math.sin(latDiffRad / 2) +
        Math.cos(lat1Rad) *
          Math.cos(lat2Rad) *
          Math.sin(longDiffRad / 2) *
          Math.sin(longDiffRad / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Format distance for display
      if (distance < 1) {
        return `${Math.round(distance * 1000)} m`;
      } else {
        return `${distance.toFixed(1)} km`;
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      return 'Unknown';
    }
  };
  
  // Render a product card in the grid
  const renderProduct = ({ item }) => {
    // Parse base price and calculate discounted price
    const basePrice = extractPrice(item.product?.price || 0);
    let finalPrice = basePrice;
    
    // Apply discount if available
    if (item.discountType && item.discountValue) {
      finalPrice = 
        item.discountType === 'percentage'
          ? basePrice * (1 - item.discountValue / 100)
          : Math.max(0, basePrice - item.discountValue);
    }
    
    // Calculate discount percentage for display
    const discountPercent = 
      basePrice > finalPrice
        ? Math.round(((basePrice - finalPrice) / basePrice) * 100)
        : 0;
  
    return (
      <TouchableOpacity
        style={styles.gridProductCard}
        onPress={() =>
          router.push({ pathname: '/product/[id]', params: { id: item._id } })
        }
        activeOpacity={0.8}
      >
        <View style={styles.gridImageContainer}>
          <Image
            source={{
              uri: item.product?.imageUrl || 'https://via.placeholder.com/150',
            }}
            style={styles.gridProductImage}
            resizeMode="cover"
          />
          
          {/* Add discount badge if there's a discount */}
          {discountPercent > 0 && (
            <View style={styles.gridDiscountBadge}>
              <Text style={styles.gridDiscountText}>{discountPercent}%</Text>
            </View>
          )}
        </View>
        
        <View style={styles.gridProductInfo}>
          <Text style={styles.gridProductName} numberOfLines={2}>
            {item.product?.title || 'Product'}
          </Text>

          <View style={styles.categoryTag}>
            <Tag size={10} color={theme.colors.primary.main} />
            <Text style={styles.categoryName} numberOfLines={1}>
              {item.product?.category?.name?.replace(/_/g, ' ') || 'Category'}
            </Text>
          </View>
          
          <View style={styles.gridProductBottom}>
            <View style={styles.gridPriceContainer}>
              <Text style={styles.gridProductPrice}>
                Rs. {finalPrice.toLocaleString()}
              </Text>
              {basePrice > finalPrice && (
                <Text style={styles.gridOriginalPrice}>
                  Rs. {basePrice.toLocaleString()}
                </Text>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.gridAddBtn}
          onPress={(e) => {
            e.stopPropagation();
            addToCart(item);
          }}
        >
          <ShoppingCart size={14} color="#FFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={styles.loadingText}>Loading vendor details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Details</Text>
        <View style={{ width: 40 }} /> {/* Empty view for balanced header */}
      </View>

      <FlatList
        data={vendorProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        numColumns={numColumns}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.main]}
          />
        }
        contentContainerStyle={
          vendorProducts.length === 0 && !loading
            ? styles.emptyList
            : styles.productsList
        }
        columnWrapperStyle={styles.row}
        ListHeaderComponent={() => (
          <>
            {/* Vendor Info Card */}
            <View style={styles.vendorCard}>
              <LinearGradient
                colors={[theme.colors.primary.main + '20', theme.colors.primary.light + '10']}
                style={styles.vendorHeader}
              >
                <View style={styles.vendorIconContainer}>
                  <Store size={32} color={theme.colors.primary.main} />
                </View>
                <Text style={styles.vendorName}>{vendor?.name}</Text>
                <View style={styles.ratingContainer}>
                  <Star size={16} color="#FFB800" fill="#FFB800" />
                  <Text style={styles.ratingText}>4.8</Text>
                  <Text style={styles.ratingCount}>(120)</Text>
                </View>
                {vendor?.location && (
                  <View style={styles.vendorAddressRow}>
                    <MapPin size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.vendorAddress}>
                      {vendor.location.formattedAddress}
                    </Text>
                  </View>
                )}
                <View style={styles.vendorInfo}>
                  {vendor?.phone && (
                    <TouchableOpacity style={styles.vendorInfoItem}>
                      <Phone size={16} color={theme.colors.primary.main} />
                      <Text style={styles.vendorInfoText}>{vendor.phone}</Text>
                    </TouchableOpacity>
                  )}
                  {vendor?.email && (
                    <TouchableOpacity style={styles.vendorInfoItem}>
                      <Mail size={16} color={theme.colors.primary.main} />
                      <Text style={styles.vendorInfoText}>{vendor.email}</Text>
                    </TouchableOpacity>
                  )}
                  {vendor?.workingHours && (
                    <View style={styles.vendorInfoItem}>
                      <Clock size={16} color={theme.colors.primary.main} />
                      <Text style={styles.vendorInfoText}>{vendor.workingHours}</Text>
                    </View>
                  )}
                </View>
                {vendor?.description && (
                  <Text style={styles.vendorDescription}>{vendor.description}</Text>
                )}
              </LinearGradient>
            </View>

            {/* Filter Bar */}
            <View style={styles.filterBar}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category._id}
                    style={[
                      styles.categoryPill,
                      selectedCategory === category._id && styles.categoryPillSelected,
                    ]}
                    onPress={() =>
                      setSelectedCategory(
                        selectedCategory === category._id ? null : category._id
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        selectedCategory === category._id && styles.categoryPillTextSelected,
                      ]}
                    >
                      {category.name.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilterModal(true)}
              >
                <Filter size={16} color={theme.colors.primary.main} />
              </TouchableOpacity>
            </View>

            {/* Products Header */}
            <View style={styles.productsHeader}>
              <Text style={styles.productsTitle}>Products</Text>
              <Text style={styles.productsCount}>
                {vendorProducts.length} {vendorProducts.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Image
              source={require('../../assets/images/no-shops.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>No products available</Text>
            <Text style={styles.emptyText}>
              This vendor doesn't have any products matching your filters.
            </Text>
          </View>
        )}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters & Sort</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text  style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Category Section - Only if not already selected in main screen */}

                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Category</Text>
                  <ScrollView
                    contentContainerStyle={styles.modalCategoriesContainer}
                  >
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category._id}
                        style={[
                          styles.modalCategoryPill,
                          selectedCategory === category._id && styles.modalCategoryPillSelected,
                        ]}
                        onPress={() => {
                          setSelectedCategory(
                            selectedCategory === category._id ? null : category._id
                          );
                          setSelectedSubCategory(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.modalCategoryPillText,
                            selectedCategory === category._id && 
                              styles.modalCategoryPillTextSelected,
                          ]}
                        >
                          {category.name.replace(/_/g, ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              

              {/* Sub-Category Section - Only show when category is selected */}
              {selectedCategory && subCategories.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Sub-Category</Text>
                  <ScrollView
                    contentContainerStyle={styles.modalCategoriesContainer}
                  >
                    {subCategories.map((subCategory) => (
                      <TouchableOpacity
                        key={subCategory._id}
                        style={[
                          styles.modalCategoryPill,
                          selectedSubCategory === subCategory._id &&
                            styles.modalCategoryPillSelected,
                        ]}
                        onPress={() =>
                          setSelectedSubCategory(
                            selectedSubCategory === subCategory._id ? null : subCategory._id
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.modalCategoryPillText,
                            selectedSubCategory === subCategory._id &&
                              styles.modalCategoryPillTextSelected,
                          ]}
                        >
                          {subCategory.name.replace(/_/g, ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Sort By Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sort By</Text>
                <View style={styles.dropdownSelector}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowSortOptions(!showSortOptions)}
                  >
                    <Text style={styles.dropdownButtonText}>
                      {sortOptions.find((opt) => opt.value === sortBy)?.label ||
                        'Most Popular'}
                    </Text>
                    <ChevronDown size={16} color={theme.colors.text.secondary} />
                  </TouchableOpacity>

                  {showSortOptions && (
                    <View style={styles.dropdownOptions}>
                      {sortOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.dropdownOption,
                            sortBy === option.value && styles.dropdownOptionSelected,
                          ]}
                          onPress={() => {
                            setSortBy(option.value);
                            setShowSortOptions(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              sortBy === option.value && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                          {sortBy === option.value && (
                            <Check size={16} color={theme.colors.primary.main} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                <Text style={styles.resetButtonText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  vendorCard: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  vendorHeader: {
    padding: 16,
  },
  vendorIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  vendorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  vendorAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vendorAddress: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 8,
    flex: 1,
  },
  vendorInfo: {
    marginBottom: 16,
  },
  vendorInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorInfoText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  vendorDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  categoriesContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  categoryPillSelected: {
    backgroundColor: theme.colors.primary.main,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  categoryPillTextSelected: {
    color: '#fff',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  productsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  productsCount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  productsList: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  gridProductCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    width: (width - 48) / 2, // Adjust for margins and padding
    marginBottom: 16,
    height: 320,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  gridImageContainer: {
    height: 120,
    position: 'relative',
  },
  gridProductImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  gridDiscountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF4D67',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  gridDiscountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  gridProductInfo: {
    padding: 10,
    flex: 1,
  },
  gridProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 6,
    height: 36, // Limit to 2 lines
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 10,
    marginLeft: 4,
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  gridProductBottom: {
    marginTop: 'auto',
  },
  gridPriceContainer: {
    flexDirection: 'column',
  },
  gridProductPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary.main,
  },
  gridOriginalPrice: {
    fontSize: 10,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  gridAddBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: theme.colors.primary.main,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  closeButton: {
    fontSize: 20,
    color: theme.colors.text.primary,
    padding: 4,
  },
  modalBody: {
    padding: 16,
    maxHeight: '60%',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  modalCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 8,
  },
  modalCategoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    marginBottom: 10,
  },
  modalCategoryPillSelected: {
    backgroundColor: theme.colors.primary.main,
  },
  modalCategoryPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  modalCategoryPillTextSelected: {
    color: '#fff',
  },
  dropdownSelector: {
    position: 'relative',
    zIndex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  dropdownOptions: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
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
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  dropdownOptionTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary.main,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },})