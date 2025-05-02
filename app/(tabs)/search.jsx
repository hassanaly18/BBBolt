//C:\Users\faeiz\Desktop\BBBolt\app\(tabs)\search.jsx
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
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { customerApi, categoryApi } from '../services/api';
import { useLocation } from '../context/LocationContext';
import { useCart } from '../context/CartContext';
import theme from '../theme';

const { width } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = width - 32;

export default function SearchScreen() {
  const navigation = useNavigation();
  const { location, getLocationParams } = useLocation();
  const { addToCart } = useCart();

  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [results, setResults] = useState({ vendors: [], products: [] });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showingRecent, setShowingRecent] = useState(false);

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

  // Search function
  const performSearch = async () => {
    if (!location) {
      return;
    }

    if (!searchTerm.trim() && !selectedCategory) {
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
        radius: 1, // 10km radius search
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

      const response = await customerApi.searchNearbyVendorsAndProducts(params);
      setResults(response.data || { vendors: [], products: [] });
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

  // Search on text change or category selection with debounce
  useEffect(() => {
    if (!searchTerm.trim() && !selectedCategory) {
      setShowingRecent(true);
      setResults({ vendors: [], products: [] });
      return;
    }

    const delaySearch = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, selectedCategory, location]);

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

  // Render vendor item
  const renderVendor = ({ item }) => (
    <TouchableOpacity
      style={styles.vendorCard}
      onPress={() =>
        router.push({ pathname: '/vendor/[id]', params: { id: item._id } })
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
          {calculateDistance(item.location)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render product item
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
            <Text style={styles.ratingText}>4.5</Text>
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
            {calculateDistance(item.vendor?.location)}
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

      {/* Categories */}
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      />

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
        <FlatList
          data={[
            ...(results.vendors.length > 0 ? [{ type: 'vendorHeader' }] : []),
            ...results.vendors.map((vendor) => ({
              type: 'vendor',
              data: vendor,
            })),
            ...(results.products.length > 0 ? [{ type: 'productHeader' }] : []),
            ...results.products.map((product) => ({
              type: 'product',
              data: product,
            })),
          ]}
          renderItem={({ item }) => {
            if (item.type === 'vendorHeader') {
              return renderSectionHeader('Vendors', results.vendors.length);
            } else if (item.type === 'vendor') {
              return renderVendor({ item: item.data });
            } else if (item.type === 'productHeader') {
              return renderSectionHeader('Products', results.products.length);
            } else if (item.type === 'product') {
              return renderProduct({ item: item.data });
            }
            return null;
          }}
          keyExtractor={(item, index) => {
            if (item.type === 'vendor' || item.type === 'product') {
              return `${item.type}-${item.data._id}`;
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
                  {searchTerm
                    ? 'Try a different search term or category.'
                    : 'Enter a search term or select a category to find vendors and products.'}
                </Text>
              </View>
            )
          }
        />
      )}
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
  categoriesContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
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
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary.main,
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
  // Add these styles to your StyleSheet in search.jsx
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
priceContainer: {
  flexDirection: 'column',
},
originalPrice: {
  fontSize: 12,
  fontWeight: '400',
  color: theme.colors.text.secondary,
  textDecorationLine: 'line-through',
},
productBottom: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-end', // Changed from 'center' to 'flex-end'
},
});
