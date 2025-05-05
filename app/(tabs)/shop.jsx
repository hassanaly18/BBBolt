import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
  Dimensions,
  Platform,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { 
  Filter, 
  Search, 
  MapPin, 
  ArrowDown, 
  ChevronDown,
  ArrowUpDown,
  Check,
  X,
  SlidersHorizontal,
  Store,
  Tag,
  ShoppingCart,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Banner from '../../components/Banner';
import VendorCard from '../../components/VendorCard';
import { vendorApi, categoryApi, customerApi } from '../services/api';
import { useLocation } from '../context/LocationContext';
import { router } from 'expo-router';
import theme from '../theme';

const { width } = Dimensions.get('window');

const HEADER_HEIGHT = 150;
const HEADER_SCROLL_DISTANCE = 100;

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
  nameAsc: 'Name: A → Z',
  nameDesc: 'Name: Z → A',
  cheapest: 'Price: Low to High',
  expensive: 'Price: High to Low',
};

export default function ShopScreen({ navigation }) {
  // State variables
  const [sortBy, setSortBy] = useState('nearest');
  const [showSortModal, setShowSortModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]); // Added products state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { location, getCurrentLocation, getLocationParams } = useLocation();
  
  // Filter state variables
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState(5); // Default to 5km
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showRadiusOptions, setShowRadiusOptions] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showSubCategoryOptions, setShowSubCategoryOptions] = useState(false);

  const scrollY = new Animated.Value(0);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_HEIGHT, 60],
    extrapolate: 'clamp',
  });

  // Load categories on initial load
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

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    initializeScreen();

    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

  useEffect(() => {
    if (location) {
      fetchVendors();
    }

  }, [location, selectedRadius]);

  useEffect(() => {
    if (vendors.length > 0) {
      let filtered = vendors;
      
      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter((vendor) =>
          vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply category filter
      if (selectedCategory) {
        filtered = filtered.filter((vendor) => 
          vendor.categories?.some(cat => cat._id === selectedCategory)
        );
      }
      
      // Apply subcategory filter
      if (selectedSubCategory) {
        filtered = filtered.filter((vendor) => 
          vendor.subCategories?.some(subCat => subCat._id === selectedSubCategory)
        );
      }
      
      setFilteredVendors(filtered);
    }
  }, [searchQuery, vendors, selectedCategory, selectedSubCategory]);

  // Extract price from string or return number
  const extractPrice = (str) => {
    if (typeof str === 'number') return str;
    const m = String(str).match(/\d+/g);
    return m ? parseInt(m.join(''), 10) : 0;
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (vendorLocation) => {
    try {
      if (!location || !vendorLocation || !vendorLocation.coordinates) {
        return 9999; // Return large value for unknown distances
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

      // Return raw distance for sorting
      return distance;
    } catch (error) {
      console.error('Error calculating distance:', error);
      return 9999; // Large number for unknown distances when sorting
    }
  };

  // Format distance for display
  const formatDistance = (distance) => {
    if (typeof distance !== 'number' || distance === 9999) return 'Unknown';
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else {
      return `${distance.toFixed(1)} km`;
    }
  };

  const initializeScreen = async () => {
    try {
      await getCurrentLocation();
    } catch (err) {
      console.error('Error initializing the screen:', err);
      setError('Unable to get your location. Please enable location services.');
      setLoading(false);
      // Still try to fetch all vendors
      fetchAllVendors();
    }
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);
  
      if (!location) {
        throw new Error('Location not available');
      }
  
      // Get location parameters
      const locParams = getLocationParams();
      
      // Capture current radius value in a local variable
      const currentRadius = selectedRadius;
      
      // Log the actual radius value being used
    
      
      // Prepare search parameters
      const params = {
        ...locParams,
        radius: currentRadius, // Use the local variable 
      };
      
      // Add category filter if selected
      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }
  
      // Add subcategory filter if selected
      if (selectedSubCategory) {
        params.subCategoryId = selectedSubCategory;
      }
      
      // Add search term if provided
      if (searchQuery?.trim()) {
        params.searchTerm = searchQuery.trim();
      }
      
      // Use customerApi.searchNearbyVendorsAndProducts
      const response = await customerApi.searchNearbyVendorsAndProducts(params);
      
     
      
      // Set vendors from the response
      const vendorsFromResponse = response.data?.vendors || [];
      
      // Log the vendors to help debug
 
      setVendors(vendorsFromResponse);
      setProducts(response.data?.products || []);
      
      // Apply sorting and update filteredVendors
      const sorted = [...vendorsFromResponse];
      // Apply sort logic directly here
      if (sortBy === 'nearest') {
        sorted.sort((a, b) => calculateDistance(a.location) - calculateDistance(b.location));
      } else if (sortBy === 'farthest') {
        sorted.sort((a, b) => calculateDistance(b.location) - calculateDistance(a.location));
      } else if (sortBy === 'nameAsc') {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortBy === 'nameDesc') {
        sorted.sort((a, b) => b.name.localeCompare(a.name));
      }
      
      // Force an update of filteredVendors, even if vendors are the same
      setFilteredVendors([]);
      setTimeout(() => {
        setFilteredVendors(sorted);
       
      }, 50);
      
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError(
        err.message === 'Location not available'
          ? 'Unable to get your location. Please enable location services.'
          : 'Failed to load vendors. Pull down to refresh.'
      );
  
      // Fall back to getting all vendors if location-based search fails
      fetchAllVendors();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
   
  }, [filteredVendors]);
  const fetchAllVendors = async () => {
    try {
      // Get location parameters - this should include lat/long
      const locParams = getLocationParams();
      
      // Prepare search parameters with larger radius
      const params = {
        ...locParams,
        radius: 50, // Always use a large radius (50km) to show more vendors
        categoryId: "680c944e8f83d9023285bb8a" // Default category ID for cooking essentials
      };
      
      // Use customerApi instead of vendorApi - same as your search screen
      const allVendorsResponse = await customerApi.searchNearbyVendorsAndProducts(params);
      setVendors(allVendorsResponse.data?.vendors || []);
      setProducts(allVendorsResponse.data?.products || []);
      setFilteredVendors(allVendorsResponse.data?.vendors || []);
      
      // Apply sorting
      let sortedVendors = [...(allVendorsResponse.data?.vendors || [])];
      handleSort(sortBy, sortedVendors);
    } catch (fallbackErr) {
      console.error('Error fetching all vendors:', fallbackErr);
    }
  };
  const handleSort = (sortKey, vendorsToSort = vendors) => {
    console.log(`Sorting by ${sortKey} with ${vendorsToSort.length} vendors`);
    setSortBy(sortKey);
    setShowSortModal(false);
  
    let sorted = [...vendorsToSort];
  
    switch (sortKey) {
      case 'nearest':
        sorted.sort((a, b) => calculateDistance(a.location) - calculateDistance(b.location));
        break;
      case 'farthest':
        sorted.sort((a, b) => calculateDistance(b.location) - calculateDistance(a.location));
        break;
      case 'nameAsc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break; 
      case 'nameDesc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }
  
    // Important: Force update with empty array first, then update with sorted data
    setFilteredVendors([]);
    setTimeout(() => {
      setFilteredVendors(sorted);
      console.log(`Sorted vendors updated: ${sorted.length} vendors`);
    }, 50);
  }
  const retryWithLocation = async () => {
    try {
      setError(null);
      setLoading(true);
      await getCurrentLocation();
      fetchVendors();
    } catch (err) {
      console.error('Error getting location on retry:', err);
      setError('Unable to get your location. Please enable location services.');
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (location) {
      fetchVendors();
    } else {
      retryWithLocation();
    }
  }, [location, selectedRadius, sortBy]);

  // Apply filters and close modal
// Apply filters and close modal
const applyFilters = () => {
  console.log("Applying filters with radius:", selectedRadius);
  setShowFilterModal(false);
  
  // Use a longer timeout to ensure state is fully updated
  setTimeout(() => {
    // Log the current state just before fetching
    console.log("Fetching with radius:", selectedRadius);
    fetchVendors();
  }, 300); // Increased from 100ms to 300ms
};

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setSelectedRadius(5);
    setSortBy('nearest');
    setShowFilterModal(false);
    
    // Fetch vendors with reset filters
    fetchVendors();
  };

  // Get current filter summary text
  const getFilterSummary = () => {
    let summary = [];
    
    if (selectedRadius !== 5) {
      summary.push(`${selectedRadius}km`);
    }
    
    if (sortBy !== 'nearest') {
      const sortName = sortOptions[sortBy];
      if (sortName) summary.push(sortName);
    }
    
    if (summary.length === 0) return 'Filter';
    return summary.join(' • ');
  };

  const renderHeader = () => {
    return (
      <Animated.View
        style={[styles.header, { opacity: headerOpacity, marginBottom: 10 }]}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Discover Shops</Text>
          <Text style={styles.headerSubtitle}>Find great vendors near you</Text>

          <View style={styles.locationBar}>
            {location ? (
              <View style={styles.locationInfo}>
                <MapPin size={16} color={theme.colors.secondary.main} />
                <Text style={styles.locationText}>Near your location</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={retryWithLocation}
                style={styles.locationButton}
              >
                <MapPin size={16} color={theme.colors.primary.contrastText} />
                <Text style={styles.locationButtonText}>
                  Find nearby vendors
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderSearchAndFilter = () => (
    <View style={styles.searchAndFilterContainer}>
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => router.push('/search')}
      >
        <Search size={20} color={theme.colors.text.secondary} />
        <Text style={styles.searchText}>Search vendors...</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilterModal(true)}
      >
        <SlidersHorizontal size={20} color={theme.colors.primary.main} />
      </TouchableOpacity>
    </View>
  );

  // const renderCategories = () => (
  //   <ScrollView
  //     horizontal
  //     showsHorizontalScrollIndicator={false}
  //     contentContainerStyle={styles.categoriesContainer}
  //   >
  //     {categories.map(category => (
  //       <TouchableOpacity
  //         key={category._id}
  //         style={[
  //           styles.categoryPill,
  //           selectedCategory === category._id && styles.categoryPillSelected,
  //         ]}
  //         onPress={() =>
  //           setSelectedCategory(selectedCategory === category._id ? null : category._id)
  //         }
  //       >
  //         <Text
  //           style={[
  //             styles.categoryPillText,
  //             selectedCategory === category._id && styles.categoryPillTextSelected,
  //           ]}
  //         >
  //           {category.name.replace(/_/g, ' ')}
  //         </Text>
  //       </TouchableOpacity>
  //     ))}
  //   </ScrollView>
  // );

  const renderSortIndicator = () => (
    <View style={styles.sortIndicator}>
      <Text style={styles.sortText}>Sorted by: </Text>
      <Text style={styles.sortValue}>{sortOptions[sortBy]}</Text>
      <ArrowDown size={14} color={theme.colors.primary.main} />
    </View>
  );

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

  // Render section header for each section
  const renderSectionHeader = (title, count) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{count} found</Text>
    </View>
  );
  
  // Render product item in grid
  // const renderGridProduct = ({ item }) => {
  //   // Parse base price and calculate discounted price
  //   const basePrice = extractPrice(item.product?.price || 0);
  //   let finalPrice = basePrice;
    
  //   // Apply discount if available
  //   if (item.discountType && item.discountValue) {
  //     finalPrice = 
  //       item.discountType === 'percentage'
  //         ? basePrice * (1 - item.discountValue / 100)
  //         : Math.max(0, basePrice - item.discountValue);
  //   }
    
  //   // Calculate discount percentage for display
  //   const discountPercent = 
  //     basePrice > finalPrice
  //       ? Math.round(((basePrice - finalPrice) / basePrice) * 100)
  //       : 0;
  
  //   const distanceValue = calculateDistance(item.vendor?.location);
    
  //   return (
  //     <TouchableOpacity
  //       style={styles.gridProductCard}
  //       onPress={() =>
  //         router.push({ pathname: '/product/[id]', params: { id: item._id } })
  //       }
  //       activeOpacity={0.8}
  //     >
  //       <View style={styles.gridImageContainer}>
  //         <Image
  //           source={{
  //             uri: item.product?.imageUrl || 'https://via.placeholder.com/150',
  //           }}
  //           style={styles.gridProductImage}
  //           resizeMode="cover"
  //         />
          
  //         {/* Add discount badge if there's a discount */}
  //         {discountPercent > 0 && (
  //           <View style={styles.gridDiscountBadge}>
  //             <Text style={styles.gridDiscountText}>{discountPercent}%</Text>
  //           </View>
  //         )}
  //       </View>
        
  //       <View style={styles.gridProductInfo}>
  //         <Text style={styles.gridProductName} numberOfLines={1}>
  //           {item.product?.title || 'Product'}
  //         </Text>
          
  //         <Text style={styles.gridVendorName} numberOfLines={1}>
  //           {item.vendor?.name || 'Vendor'}
  //         </Text>
  
  //         <View style={styles.gridProductBottom}>
  //           <View style={styles.gridPriceContainer}>
  //             <Text style={styles.gridProductPrice}>
  //               Rs. {finalPrice.toLocaleString()}
  //             </Text>
  //             {basePrice > finalPrice && (
  //               <Text style={styles.gridOriginalPrice}>
  //                 Rs. {basePrice.toLocaleString()}
  //               </Text>
  //             )}
  //           </View>
  //         </View>
  //       </View>
  
  //       <TouchableOpacity
  //         style={styles.gridAddBtn}
  //         onPress={(e) => {
  //           e.stopPropagation();
  //           // You can add to cart functionality here
  //           // addToCart(item);
  //         }}
  //       >
  //         <ShoppingCart size={14} color="#FFF" />
  //       </TouchableOpacity>
  //     </TouchableOpacity>
  //   );
  // };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconPlaceholder}>
        <MapPin size={48} color={theme.colors.text.disabled} />
      </View>
      <Text style={styles.emptyTitle}>No vendors found</Text>
      <Text style={styles.emptyText}>
        We couldn't find any vendors in your area. Try changing your location, filters, 
        or check back later.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={retryWithLocation}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && vendors.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Discovering local vendors...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && vendors.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconPlaceholder}>
            <MapPin size={48} color={theme.colors.error} />
          </View>
          <Text style={styles.errorTitle}>Location Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={retryWithLocation}
          >
            <Text style={styles.retryButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar barStyle="dark-content" />

      {renderHeader()}

      // Improved FlatList data transformation to ensure proper rendering
// Replace the existing FlatList data prop with this version

// Inside your return statement, find the FlatList and modify its data prop:
<Animated.FlatList
  data={(() => {
    // Log the state for debugging
    console.log(`Creating FlatList data with ${filteredVendors.length} vendors and ${products.length} products`);
    
    // Create a new array for the FlatList data to force re-rendering
    const flatListData = [];
    
    // Add product section if needed
    if (products.length > 0) {
      flatListData.push({ type: 'productHeader', id: 'product-header' });
      flatListData.push({ 
        type: 'productGrid', 
        id: 'product-grid', 
        data: products 
      });
    }
    
    // Add vendor section header if there are vendors
    if (filteredVendors.length > 0) {
      flatListData.push({ 
        type: 'vendorHeader', 
        id: 'vendor-header' 
      });
      
      // Add vendor items
      filteredVendors.forEach((vendor, index) => {
        flatListData.push({
          type: 'vendor',
          id: `vendor-${vendor._id || index}`,
          data: vendor
        });
      });
    }
    
    // Log the final data array structure
    console.log(`FlatList data created with ${flatListData.length} items`);
    
    return flatListData;
  })()}
  renderItem={({ item }) => {
    // Log each render for debugging
    console.log(`Rendering item type: ${item.type}`);
    
    if (item.type === 'productHeader') {
      // Return product header renderer
      // return renderSectionHeader('Products', products.length);
    } else if (item.type === 'productGrid') {
      // Return product grid renderer
      // return (
      //   // <View style={styles.productsGrid}>
      //   //   {item.data.map((product, index) => (
      //   //     <View 
      //   //       key={`product-${product._id}`} 
      //   //       style={[
      //   //         styles.gridProductContainer,
      //   //         index % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 }
      //   //       ]}
      //   //     >
      //   //       {/* {renderGridProduct({ item: product })} */}
      //   //     </View>
      //   //   ))}
      //   // </View>
      // );
    } else if (item.type === 'vendorHeader') {
      // Return vendor header renderer
      return renderSectionHeader('Vendors', filteredVendors.length);
    } else if (item.type === 'vendor') {
      // Return vendor item renderer with additional logging
      console.log(`Rendering vendor: ${item.data.name}`);
      return renderVendor({ item: item.data });
    }
    return null;
  }}
  keyExtractor={(item) => item.id}
  contentContainerStyle={styles.listContent}
  showsVerticalScrollIndicator={false}
  ListHeaderComponent={
    <>
      {/* <Banner /> */}
      {renderSearchAndFilter()}
      {/* {renderCategories()} */}
      {filteredVendors.length > 0 && renderSortIndicator()}
    </>
  }
  ListEmptyComponent={(() => {
    // Only show empty state if both arrays are empty
    if (filteredVendors.length === 0 && products.length === 0) {
      console.log("Rendering empty state component");
      return renderEmptyState();
    }
    return null;
  })()}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[theme.colors.primary.main]}
      tintColor={theme.colors.primary.main}
    />
  }
  onScroll={Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  )}
  scrollEventThrottle={16}
  // Force rerender by adding a key
  key={`flatlist-${filteredVendors.length}-${products.length}`}
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
    backgroundColor: theme.colors.background.default,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 0 : theme.spacing.md,
    paddingBottom: theme.spacing.md,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.colors.primary.contrastText,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.subtitle1.fontSize,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.md,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  locationText: {
    color: theme.colors.primary.contrastText,
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.body2.fontSize,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary.main,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  locationButtonText: {
    color: theme.colors.primary.main,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
  },
  searchAndFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginTop: HEADER_HEIGHT - 20,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  searchBar: {
    marginTop: 40,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.body2.fontSize,
  },
  filterButton: {
    marginTop: 40,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  sortIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sortText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text.secondary,
  },
  sortValue: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary.main,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  cardContainer: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  // Vendor card styles
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
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
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl * 2,
  },
  emptyIconPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: theme.colors.primary.contrastText,
    fontSize: theme.typography.button.fontSize,
    fontWeight: theme.typography.button.fontWeight,
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
  },
  // Product grid styles
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
    marginBottom: 6,
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
  sectionCount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
});