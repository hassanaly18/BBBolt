// Modified search.jsx with filters and sorting options
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Keyboard,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import {
  ChevronLeft,
  Search,
  X,
  ShoppingCart,
  Store,
  Tag,
  MapPin,
  Star,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { customerApi, categoryApi } from '../services/api';
import { useLocation } from '../context/LocationContext';
import { useCart } from '../context/CartContext';
import theme from '../constants/theme';

const { width } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = width - 32;

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
const sortOptions = [
  { value: 'nearest', label: 'Nearest First' },
  { value: 'farthest', label: 'Farthest First' },
  { value: 'cheapest', label: 'Price: Low to High' },
  { value: 'expensive', label: 'Price: High to Low' },
  { value: 'rating_high', label: 'Highest Rated' },
  { value: 'rating_low', label: 'Lowest Rated' },
];

// Rating filter options
const ratingOptions = [
  { value: null, label: 'All Ratings' },
  { value: 5, label: '5 Stars' },
  { value: 4, label: '4+ Stars' },
  { value: 3, label: '3+ Stars' },
  { value: 2, label: '2+ Stars' },
  { value: 1, label: '1+ Stars' },
];

export default function SearchScreen() {
  const navigation = useNavigation();
  const { location, getLocationParams } = useLocation();
  const { addToCart } = useCart();

  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [results, setResults] = useState({ vendors: [], products: [] });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showingRecent, setShowingRecent] = useState(false);
  
  // New state for filters and sorting
  const [selectedRadius, setSelectedRadius] = useState(1); // Default to 1km
  const [sortBy, setSortBy] = useState('nearest'); // Default sorting
  const [selectedRating, setSelectedRating] = useState(null); // Default to all ratings
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showRadiusOptions, setShowRadiusOptions] = useState(false);
  const [showRatingOptions, setShowRatingOptions] = useState(false);
  const [showSubCategoryOptions, setShowSubCategoryOptions] = useState(false);
  const numColumns = 2;
  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getAllCategories();
        setCategories(response.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Load subcategories when category changes
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
      const userCoords = [location.longitude, location.latitude];

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

      // Return raw distance for sorting
      return distance;
    } catch (error) {
      console.error('Error calculating distance:', error);
      return 9999; // Large number for unknown distances when sorting
    }
  };

  // Format distance for display
  const formatDistance = (distance) => {
    if (typeof distance !== 'number') return 'Unknown';
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else {
      return `${distance.toFixed(1)} km`;
    }
  };

  // Search function
  const performSearch = async () => {
    if (!location) {
      return;
    }

    if (!searchTerm.trim() && !selectedCategory && !selectedSubCategory) {
      setResults({ vendors: [], products: [] });
      setShowingRecent(true);
      return;
    }

    setLoading(true);
    setShowingRecent(false);
    Keyboard.dismiss();

    try {
      const locParams = getLocationParams();
      const params = {
        ...locParams,
        radius: selectedRadius, // Use selected radius
      };

      // Add search term if provided
      if (searchTerm.trim()) {
        params.searchTerm = searchTerm.trim();

        // Save to recent searches
        if (searchTerm.trim() && !recentSearches.includes(searchTerm.trim())) {
          const newRecentSearches = [
            searchTerm.trim(),
            ...recentSearches.filter((s) => s !== searchTerm.trim()),
          ].slice(0, 5); // Keep only 5 most recent
          setRecentSearches(newRecentSearches);
        }
      }

      // Add category filter if selected
      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }

      // Add subcategory filter if selected
      if (selectedSubCategory) {
        params.subCategoryId = selectedSubCategory;
      }

      const response = await customerApi.searchNearbyVendorsAndProducts(params);
      
      // Get the raw results
      let vendorResults = response.data?.vendors || [];
      let productResults = response.data?.products || [];
      
      // Filter and sort the results based on selection
      const filterAndSortResults = () => {
        // Filter by rating if selected
        if (selectedRating !== null) {
          productResults = productResults.filter(product => {
            // Get average rating from product data (you may need to adjust this based on your API response)
            const avgRating = product.averageRating || product.product?.averageRating || 0;
            return avgRating >= selectedRating;
          });
        }

        // Sort the results based on selection
        switch (sortBy) {
          case 'nearest':
            vendorResults = vendorResults.sort((a, b) => 
              calculateDistance(a.location) - calculateDistance(b.location)
            );
            productResults = productResults.sort((a, b) => 
              calculateDistance(a.vendor?.location) - calculateDistance(b.vendor?.location)
            );
            break;
          case 'farthest':
            vendorResults = vendorResults.sort((a, b) => 
              calculateDistance(b.location) - calculateDistance(a.location)
            );
            productResults = productResults.sort((a, b) => 
              calculateDistance(b.vendor?.location) - calculateDistance(a.vendor?.location)
            );
            break;
          case 'cheapest':
            // Only affects products
            productResults = productResults.sort((a, b) => {
              const priceA = extractPrice(a.product?.price || 0);
              const priceB = extractPrice(b.product?.price || 0);
              return priceA - priceB;
            });
            break;
          case 'expensive':
            // Only affects products
            productResults = productResults.sort((a, b) => {
              const priceA = extractPrice(a.product?.price || 0);
              const priceB = extractPrice(b.product?.price || 0);
              return priceB - priceA;
            });
            break;
          case 'rating_high':
            // Sort by rating (highest first)
            productResults = productResults.sort((a, b) => {
              const ratingA = a.averageRating || a.product?.averageRating || 0;
              const ratingB = b.averageRating || b.product?.averageRating || 0;
              return ratingB - ratingA;
            });
            break;
          case 'rating_low':
            // Sort by rating (lowest first)
            productResults = productResults.sort((a, b) => {
              const ratingA = a.averageRating || a.product?.averageRating || 0;
              const ratingB = b.averageRating || b.product?.averageRating || 0;
              return ratingA - ratingB;
            });
            break;
          default:
            break;
        }
      };
      
      // Apply filtering and sorting
      filterAndSortResults();
      
      setResults({ 
        vendors: vendorResults, 
        products: productResults 
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    performSearch();
  };

  // Re-search when filters change
  useEffect(() => {
    if (location) {
      // Using a debounce for search
      const delaySearch = setTimeout(() => {
        performSearch();
      }, 500);
  
      return () => clearTimeout(delaySearch);
    }
  }, [searchTerm, selectedCategory, selectedSubCategory, selectedRadius, sortBy, selectedRating, location]);

  // Apply filters and close modal
  const applyFilters = () => {
    performSearch();
    setShowFilterModal(false);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setSelectedRadius(1);
    setSortBy('nearest');
    setSelectedRating(null);
    setShowFilterModal(false);
  };

  // Render category pill
  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryPill,
        selectedCategory === item._id && styles.categoryPillSelected,
      ]}
      onPress={() =>
        setSelectedCategory(selectedCategory === item._id ? null : item._id)
      }
    >
      <Text
        style={[
          styles.categoryPillText,
          selectedCategory === item._id && styles.categoryPillTextSelected,
        ]}
      >
        {item.name.replace(/_/g, ' ')}
      </Text>
    </TouchableOpacity>
  );
  const renderGridProduct = ({ item }) => {
    // Parse base price and calculate discounted price
    const basePrice = extractPrice(item.product?.price || 0);
    let finalPrice = basePrice;
    
    // Apply discount if available (match the same logic as in product details)
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
  
    const distanceValue = calculateDistance(item.vendor?.location);
    
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
          <Text style={styles.gridProductName} numberOfLines={1}>
            {item.product?.title || 'Product'}
          </Text>
          
          <Text style={styles.gridVendorName} numberOfLines={1}>
            {item.vendor?.name || 'Vendor'}
          </Text>

          <View style={styles.gridRatingContainer}>
            <Star
              size={12}
              color={theme.colors.secondary.main}
              fill={theme.colors.secondary.main}
            />
            <Text style={styles.gridRatingText}>
              {item.averageRating || item.product?.averageRating || 'N/A'}
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
  // Render vendor item
  const renderVendor = ({ item }) => {
    const distanceValue = calculateDistance(item.location);
    
    return (
      <TouchableOpacity
        style={styles.vendorCard}
        onPress={() =>
      router.push({ pathname: '/(tabs)/vendor-details', params: { id: item._id } })
        }
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#4d216d20', '#7d4c9f10']}
          style={styles.vendorIcon}
        >
          <Store size={24} color={theme.colors.primary.main} />
        </LinearGradient>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{item.name}</Text>
          <View style={styles.vendorAddressRow}>
            <MapPin
              size={14}
              color={theme.colors.text.secondary}
              style={styles.addressIcon}
            />
            <Text style={styles.vendorAddress} numberOfLines={1}>
              {item.location?.formattedAddress || 'No address'}
            </Text>
          </View>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>
            {formatDistance(distanceValue)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render product item
  const renderProduct = ({ item }) => {
    // Parse base price and calculate discounted price
    const basePrice = extractPrice(item.product?.price || 0);
    let finalPrice = basePrice;
    
    // Apply discount if available (match the same logic as in product details)
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
  
    const distanceValue = calculateDistance(item.vendor?.location);
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() =>
          router.push({ pathname: '/product/[id]', params: { id: item._id } })
        }
        activeOpacity={0.8}
      >
        <Image
          source={{
            uri: item.product?.imageUrl || 'https://via.placeholder.com/150',
          }}
          style={styles.productImage}
          resizeMode="cover"
        />
        
        {/* Add discount badge if there's a discount */}
        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Tag size={12} color="#FFF" />
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}
        
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <View style={styles.categoryTag}>
              <Tag size={12} color={theme.colors.primary.main} />
              <Text style={styles.categoryName} numberOfLines={1}>
                {item.product?.category?.name?.replace(/_/g, ' ') || 'Category'}
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <Star
                size={14}
                color={theme.colors.secondary.main}
                fill={theme.colors.secondary.main}
              />
              <Text style={styles.ratingText}>
                {item.averageRating || item.product?.averageRating || 'N/A'}
              </Text>
            </View>
          </View>
  
          <Text style={styles.productName} numberOfLines={2}>
            {item.product?.title || 'Product'}
          </Text>
  
          <View style={styles.productVendorRow}>
            <Text style={styles.vendorNameInProduct} numberOfLines={1}>
              {item.vendor?.name || 'Vendor'}
            </Text>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.vendorDistance}>
              {formatDistance(distanceValue)}
            </Text>
          </View>
  
          <View style={styles.productBottom}>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>
                Rs. {finalPrice.toLocaleString()}
              </Text>
              {basePrice > finalPrice && (
                <Text style={styles.originalPrice}>
                  Rs. {basePrice.toLocaleString()}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => addToCart(item)}
            >
              <ShoppingCart size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render recent search item
  const renderRecentSearch = ({ item }) => (
    <TouchableOpacity
      style={styles.recentSearchItem}
      onPress={() => setSearchTerm(item)}
    >
      <Search
        size={16}
        color={theme.colors.text.secondary}
        style={styles.recentSearchIcon}
      />
      <Text style={styles.recentSearchText}>{item}</Text>
    </TouchableOpacity>
  );

  // Render header for each section
  const renderSectionHeader = (title, count) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{count} found</Text>
    </View>
  );

  // Get current filter summary text
  const getFilterSummary = () => {
    let summary = [];
    
    if (selectedRadius !== 1) {
      summary.push(`${selectedRadius}km`);
    }
    
    if (selectedRating !== null) {
      const ratingName = ratingOptions.find(option => option.value === selectedRating)?.label;
      if (ratingName) summary.push(ratingName);
    }
    
    if (sortBy !== 'nearest') {
      const sortName = sortOptions.find(option => option.value === sortBy)?.label;
      if (sortName) summary.push(sortName);
    }
    
    if (summary.length === 0) return 'Filter';
    return summary.join(' • ');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Search size={18} color={theme.colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products or vendors..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoFocus
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <X size={18} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter/Sort Bar */}
      <View style={styles.filterSortBar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category._id}
              style={[
                styles.categoryPill,
                selectedCategory === category._id && styles.categoryPillSelected,
              ]}
              onPress={() =>
                setSelectedCategory(selectedCategory === category._id ? null : category._id)
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
          <LinearGradient
            colors={theme.colors.gradients.primary}
            style={styles.filterButtonGradient}
          >
            <SlidersHorizontal size={16} color={theme.colors.primary.contrastText} />
            <Text style={styles.filterButtonText}>{getFilterSummary()}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Searching nearby...</Text>
        </View>
      ) : showingRecent && recentSearches.length > 0 ? (
        // Recent searches section
        <View style={styles.recentSearchesContainer}>
          <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
          <FlatList
            data={recentSearches}
            renderItem={renderRecentSearch}
            keyExtractor={(item, index) => `recent-${index}`}
            contentContainerStyle={styles.recentSearchesList}
          />
        </View>
      ) : (
// Replace the current FlatList component with this updated version

<FlatList
  data={[
    // Show products first in a grid
    ...(results.products.length > 0 ? [{ type: 'productHeader' }] : []),
    // Special handling for grid layout
    ...(results.products.length > 0
      ? [{ type: 'productGrid', data: results.products }]
      : []),
    // Then show vendors in a list
    ...(results.vendors.length > 0 ? [{ type: 'vendorHeader' }] : []),
    ...results.vendors.map((vendor) => ({
      type: 'vendor',
      data: vendor,
    })),
  ]}
  renderItem={({ item }) => {
    if (item.type === 'productHeader') {
      return renderSectionHeader('Products', results.products.length);
    } else if (item.type === 'productGrid') {
      // Render a grid of products
      return (
        <View style={styles.productsGrid}>
          {item.data.map((product, index) => (
            <View 
              key={`product-${product._id}`} 
              style={[
                styles.gridProductContainer,
                // Add right margin to items in the left column
                index % numColumns === 0 ? { marginRight: 8 } : { marginLeft: 8 }
              ]}
            >
              {renderGridProduct({ item: product })}
            </View>
          ))}
        </View>
      );
    } else if (item.type === 'vendorHeader') {
      return renderSectionHeader('Vendors', results.vendors.length);
    } else if (item.type === 'vendor') {
      return renderVendor({ item: item.data });
    }
    return null;
  }}
  keyExtractor={(item, index) => {
    if (item.type === 'vendor') {
      return `${item.type}-${item.data._id}`;
    } else if (item.type === 'productGrid') {
      return 'product-grid';
    }
    return `${item.type}-${index}`;
  }}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[theme.colors.primary.main]}
    />
  }
  contentContainerStyle={[
    styles.resultsList,
    !results.vendors.length &&
      !results.products.length &&
      styles.emptyListContainer,
  ]}
  ListEmptyComponent={
    !loading && (
      <View style={styles.emptyContainer}>
        <Image
          source={require('../../assets/images/no-shops.png')}
          style={styles.emptyImage}
          resizeMode="contain"
        />
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.emptyText}>
          {searchTerm || selectedCategory || selectedSubCategory
            ? 'Try different search terms, categories, or expand your search radius.'
            : 'Enter a search term or select a category to find vendors and products.'}
        </Text>
      </View>
    )
  }
/>
      )}

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
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Category Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Category</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.modalCategoriesContainer}
                >
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category._id}
                      style={[
                        styles.modalCategoryPill,
                        selectedCategory === category._id && styles.modalCategoryPillSelected,
                      ]}
                      onPress={() => {
                        setSelectedCategory(selectedCategory === category._id ? null : category._id);
                        setSelectedSubCategory(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalCategoryPillText,
                          selectedCategory === category._id && styles.modalCategoryPillTextSelected,
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
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.modalCategoriesContainer}
                  >
                    {subCategories.map(subCategory => (
                      <TouchableOpacity
                        key={subCategory._id}
                        style={[
                          styles.modalCategoryPill,
                          selectedSubCategory === subCategory._id && styles.modalCategoryPillSelected,
                        ]}
                        onPress={() =>
                          setSelectedSubCategory(selectedSubCategory === subCategory._id ? null : subCategory._id)
                        }
                      >
                        <Text
                          style={[
                            styles.modalCategoryPillText,
                            selectedSubCategory === subCategory._id && styles.modalCategoryPillTextSelected,
                          ]}
                        >
                          {subCategory.name.replace(/_/g, ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Radius Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Search Radius</Text>
                <View style={styles.dropdownSelector}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => setShowRadiusOptions(!showRadiusOptions)}
                  >
                    <Text style={styles.dropdownButtonText}>
                      {radiusOptions.find(opt => opt.value === selectedRadius)?.label || '1 km'}
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
              </View>

              {/* Rating Filter Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                <View style={styles.dropdownSelector}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => setShowRatingOptions(!showRatingOptions)}
                  >
                    <Text style={styles.dropdownButtonText}>
                      {ratingOptions.find(opt => opt.value === selectedRating)?.label || 'All Ratings'}
                    </Text>
                    <ChevronDown size={16} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                  
                  {showRatingOptions && (
                    <View style={styles.dropdownOptions}>
                      {ratingOptions.map(option => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.dropdownOption,
                            selectedRating === option.value && styles.dropdownOptionSelected
                          ]}
                          onPress={() => {
                            setSelectedRating(option.value);
                            setShowRatingOptions(false);
                          }}
                        >
                          <Text 
                            style={[
                              styles.dropdownOptionText,
                              selectedRating === option.value && styles.dropdownOptionTextSelected
                            ]}
                          >
                            {option.label}
                          </Text>
                          {selectedRating === option.value && (
                            <Check size={16} color={theme.colors.primary.main} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Sort By Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sort By</Text>
                <View style={styles.dropdownSelector}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => setShowSortOptions(!showSortOptions)}
                  >
                    <Text style={styles.dropdownButtonText}>
                      {sortOptions.find(opt => opt.value === sortBy)?.label || 'Nearest First'}
                    </Text>
                    <ArrowUpDown size={16} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                  
                  {showSortOptions && (
                    <View style={styles.dropdownOptions}>
                      {sortOptions.map(option => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.dropdownOption,
                            sortBy === option.value && styles.dropdownOptionSelected
                          ]}
                          onPress={() => {
                            setSortBy(option.value);
                            setShowSortOptions(false);
                          }}
                        >
                          <Text 
                            style={[
                              styles.dropdownOptionText,
                              sortBy === option.value && styles.dropdownOptionTextSelected
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
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: theme.colors.text.primary,
    height: 48,
    paddingVertical: 8,
  },
  filterSortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoriesContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 60,
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
    marginLeft: 8,
  },
  filterButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary.contrastText,
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.default,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  recentSearchesContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
    paddingTop: 16,
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  recentSearchesList: {
    paddingHorizontal: 16,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentSearchIcon: {
    marginRight: 12,
  },
  recentSearchText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  resultsList: {
    paddingBottom: 20,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  gridProductContainer: {
    width: (width - 40) / 2, // Account for padding and margins
    marginBottom: 16,
  },
  gridProductCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    height: 220,
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
    marginBottom: 4,
  },
  gridVendorName: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  gridRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridRatingText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.secondary.main,
    marginLeft: 3,
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

  sectionCount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vendorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  vendorAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIcon: {
    marginRight: 4,
  },
  vendorAddress: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  distanceBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary.main,
  },
  productCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  productImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f5f5f5',
  },
  productInfo: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: '70%',
  },
  categoryName: {
    fontSize: 12,
    marginLeft: 4,
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: theme.colors.text.primary,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
    lineHeight: 24,
  },
  productVendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vendorNameInProduct: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    maxWidth: '60%',
  },
  bulletPoint: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginHorizontal: 6,
  },
  vendorDistance: {
    fontSize: 14,
    color: theme.colors.primary.main,
  },
  productBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainer: {
    flexDirection: 'column',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary.main,
  },
  originalPrice: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    backgroundColor: theme.colors.primary.main,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyContainer: {
    paddingHorizontal: 32,
    paddingVertical: 40,
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
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FF4D67',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  
  // Filter Modal Styles
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