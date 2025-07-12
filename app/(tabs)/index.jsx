import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  ChevronRight,
  ShoppingCart,
  Star,
  MapPin,
  TrendingUp,
  Settings,
  Bell,
  Package,
} from 'lucide-react-native';
import {
  Utensils,
  Baby,
  Cake,
  Coffee,
  Milk,
  Apple,
  ShoppingBag,
  Scissors,
  Home,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { vendorProductApi, categoryApi } from '../services/api';
import { useLocation } from '../context/LocationContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../auth/AuthContext';
import theme from '../constants/theme';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CATEGORY_SIZE = 70;

export default function HomeScreen() {
  const router = useRouter();
  const { location, getLocationParams } = useLocation();
  const { addToCart } = useCart();
  const { isLoggedIn } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [vendorProducts, setVendorProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [gridView, setGridView] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  // Animation values for staggered loading
  const animatedValues = useRef(
    vendorProducts.map(() => new Animated.Value(0))
  ).current;

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.current = offsetY;

    // Update header visibility based on scroll position
    if (offsetY > 80 && !headerVisible) {
      setHeaderVisible(true);
    } else if (offsetY <= 80 && headerVisible) {
      setHeaderVisible(false);
    }
  };

  const getCategoryIcon = (categoryName) => {
    switch (categoryName.toLowerCase()) {
      case 'cooking_essentials':
        return <Utensils size={28} color={theme.colors.primary.main} />;
      case 'baby':
        return <Baby size={28} color={theme.colors.primary.main} />;
      case 'bakery':
        return <Cake size={28} color={theme.colors.primary.main} />;
      case 'beverages':
        return <Coffee size={28} color={theme.colors.primary.main} />;
      case 'dairy':
        return <Milk size={28} color={theme.colors.primary.main} />;
      case 'fresh_food':
        return <Apple size={28} color={theme.colors.primary.main} />;
      case 'groceries':
        return <ShoppingBag size={28} color={theme.colors.primary.main} />;
      case 'health_and_beauty':
        return <Scissors size={28} color={theme.colors.primary.main} />;
      case 'household':
        return <Home size={28} color={theme.colors.primary.main} />;
      default:
        // For any categories without specific icons, use first letter
        return (
          <Text
            style={{
              fontSize: 24,
              fontWeight: '600',
              color: theme.colors.primary.main,
            }}
          >
            {categoryName.charAt(0).toUpperCase()}
          </Text>
        );
    }
  };

  // Utility: format price
  // const extractPrice = (str) => {
  //   if (typeof str === 'number') return str;
  //   const m = String(str).match(/\d+/);
  //   return m ? parseInt(m[0], 10) : 0;
  // };

  const extractPrice = (ps) => {
    if (!ps) return 0;
    if (typeof ps === 'number') return ps;
    const m = String(ps).match(/[\d,]+/);
    return m ? parseInt(m[0].replace(/,/g, ''), 10) : 0;
  };


  // Parse coordinates from different possible formats
  const parseCoordinates = (locData) => {
    if (!locData) return null;

    // If it's a string like "74.3048809,31.5534976"
    if (typeof locData === 'string') {
      const parts = locData.split(',');
      if (parts.length === 2) {
        return [parseFloat(parts[0]), parseFloat(parts[1])];
      }
    }

    // If it's an array like [74.3048809, 31.5534976]
    if (Array.isArray(locData)) {
      if (locData.length === 2) {
        return [locData[0], locData[1]];
      }
    }

    // If it's an object with coordinates array
    if (locData && Array.isArray(locData.coordinates)) {
      return [locData.coordinates[0], locData.coordinates[1]];
    }

    // If it's an object with lat/long properties
    if (
      locData &&
      typeof locData.latitude === 'number' &&
      typeof locData.longitude === 'number'
    ) {
      return [locData.longitude, locData.latitude];
    }

    return null;
  };

  // Calculate distance between two coordinates using Haversine formula
  const calcDistance = (vendorLoc) => {
    try {
      // Parse coordinates from vendor location and user location
      const vendorCoords = parseCoordinates(vendorLoc);
      const userCoords = location ? parseCoordinates(location) : null;

      if (!vendorCoords || !userCoords) {
        return 'Unknown distance';
      }

      const [vendorLong, vendorLat] = vendorCoords;
      const [userLong, userLat] = userCoords;

      // Radius of the Earth in kilometers
      const R = 6371;

      // Convert latitude and longitude from degrees to radians
      const lat1Rad = userLat * (Math.PI / 180);
      const lat2Rad = vendorLat * (Math.PI / 180);
      const latDiffRad = (vendorLat - userLat) * (Math.PI / 180);
      const longDiffRad = (vendorLong - userLong) * (Math.PI / 180);

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
    } catch (err) {
      console.error('Error calculating distance:', err);
      return 'Unknown';
    }
  };

  // Fetch categories + vendor products (optionally by category)
  const fetchData = async (categoryId = null) => {
    if (!location || !isLoggedIn) return;
    setLoading(true);
    try {
      const locParams = getLocationParams();
      const [catsRes, vpRes] = await Promise.all([
        categoryApi.getAllCategories(),
        categoryId
          ? vendorProductApi.getVendorProductsByCategory(categoryId, locParams)
          : vendorProductApi.getNearbyVendorProducts(locParams),
      ]);

      setCategories(catsRes.data || []);

      // Get all products from the API
      const allProducts = vpRes.data || [];

      // 1. Create a subset of trending products - RANDOM 3 products
      const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
      setTrendingProducts(shuffled.slice(0, Math.min(shuffled.length, 3)));

      // 2. Filter products to only show 1 product per vendor
      const vendorMap = new Map();
      const filteredProducts = [];

      allProducts.forEach((product) => {
        const vendorId =
          typeof product.vendor === 'string'
            ? product.vendor
            : product.vendor?._id;

        if (vendorId && !vendorMap.has(vendorId)) {
          vendorMap.set(vendorId, true);
          filteredProducts.push(product);
        }
      });

      setVendorProducts(filteredProducts);

      // Update animated values for new items
      animatedValues.current = filteredProducts.map(
        () => new Animated.Value(0)
      );

      // Run staggered animation
      Animated.stagger(
        100,
        animatedValues.current.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          })
        )
      ).start();

      setSelectedCategory(categoryId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (location && isLoggedIn) fetchData();
  }, [location, isLoggedIn]);

  // Clear data when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      setVendorProducts([]);
      setTrendingProducts([]);
      setCategories([]);
      setSelectedCategory(null);
    }
  }, [isLoggedIn]);

  const onRefresh = () => {
    if (!isLoggedIn) return;
    setRefreshing(true);
    fetchData(selectedCategory);
  };

  const handleMenuPress = () => {
    setSideMenuOpen(true);
  };

  const handleMenuClose = () => {
    setSideMenuOpen(false);
  };

  const renderCategory = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item._id && styles.categoryItemSelected,
      ]}
      onPress={() => fetchData(item._id)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={
          selectedCategory === item._id
            ? theme.colors.gradients.primary
            : theme.colors.gradients.card
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.categoryIcon,
          selectedCategory === item._id && styles.categoryIconSelected
        ]}
      >
        {selectedCategory === item._id
          ? React.cloneElement(getCategoryIcon(item.name), {
              color: theme.colors.primary.contrastText,
            })
          : getCategoryIcon(item.name)}
      </LinearGradient>
      <Text
        style={[
          styles.categoryLabel,
          selectedCategory === item._id && styles.categoryLabelSelected,
        ]}
        numberOfLines={1}
      >
        {item.name.replace(/_/g, ' ')}
      </Text>
      {selectedCategory === item._id && (
        <View style={styles.categoryIndicator} />
      )}
    </TouchableOpacity>
  );

  const renderProduct = ({ item, index }) => {
    const vp = item; // vendorProduct
    const price = extractPrice(vp.product.price);
    const discountedPrice = vp.discountType
      ? vp.discountType === 'percentage'
        ? price * (1 - vp.discountValue / 100)
        : Math.max(0, price - vp.discountValue)
      : price;

    const hasDiscount = price !== discountedPrice;
    const distance = calcDistance(vp.vendor.location);

    // Use animated opacity and translateY for each item
    const animatedStyle = {
      opacity: animatedValues.current[index] || new Animated.Value(1),
      transform: [
        {
          translateY: (
            animatedValues.current[index] || new Animated.Value(1)
          ).interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View
        style={[{ marginLeft: index === 0 ? 16 : 12 }, animatedStyle]}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            router.push({ pathname: '/product/[id]', params: { id: vp._id } })
          }
          activeOpacity={0.9}
        >
          <View style={styles.cardImageContainer}>
            <Image
              source={{ uri: vp.product.imageUrl }}
              style={styles.cardImage}
              defaultSource={require('../../assets/images/no-shops.png')}
            />
            {hasDiscount && (
              <LinearGradient
                colors={theme.colors.gradients.secondary}
                style={styles.discountBadge}
              >
                <Text style={styles.discountText}>
                  {vp.discountType === 'percentage'
                    ? `${vp.discountValue}% OFF`
                    : `Rs ${vp.discountValue} OFF`}
                </Text>
              </LinearGradient>
            )}
            {!vp.inStock && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
          </View>

          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardCategory} numberOfLines={1}>
                {vp.product.category?.name?.replace(/_/g, ' ') || 'Item'}
              </Text>
              <View style={styles.ratingContainer}>
                <Star
                  size={12}
                  color={theme.colors.secondary.main}
                  fill={theme.colors.secondary.main}
                />
                <Text style={styles.ratingText}>4.8</Text>
              </View>
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>
              {vp.product.title}
            </Text>

            <View style={styles.vendorRow}>
              <Text style={styles.cardVendor} numberOfLines={1}>
                {vp.vendor.name}
              </Text>
              <View style={styles.distanceRow}>
                <MapPin size={10} color={theme.colors.primary.main} />
                <Text style={styles.distanceText}>{distance}</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.price}>
                  Rs {Math.round(discountedPrice).toLocaleString()}
                </Text>
                {hasDiscount && (
                  <Text style={styles.originalPrice}>
                    Rs {price.toLocaleString()}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.addBtn, !vp.inStock && styles.disabledButton]}
                onPress={() => vp.inStock && addToCart(vp)}
                disabled={!vp.inStock}
              >
                <ShoppingCart size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderTrendingProduct = ({ item, index }) => {
    const vp = item;
    const price = extractPrice(vp.product.price);

    return (
      <TouchableOpacity
        style={styles.trendingItem}
        onPress={() =>
          router.push({ pathname: '/product/[id]', params: { id: vp._id } })
        }
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: vp.product.imageUrl }}
          style={styles.trendingImage}
          defaultSource={require('../../assets/images/no-shops.png')}
        />
        <View style={styles.trendingInfo}>
          <Text style={styles.trendingTitle} numberOfLines={1}>
            {vp.product.title}
          </Text>
          <Text style={styles.trendingPrice}>Rs {price.toLocaleString()}</Text>
        </View>
        <Text style={styles.trendingRank}>#{index + 1}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      {/* Header with menu button */}
      <Header onMenuPress={handleMenuPress} />

      {/* Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.main]}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Discover Nearby</Text>
          <Text style={styles.subtitle}>Fresh groceries at your doorstep</Text>
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => fetchData(null)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(c) => c._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        />

        {/* Trending Section */}
        {trendingProducts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <TrendingUp size={16} color={theme.colors.primary.main} />
                <Text style={styles.sectionTitle}>Trending</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={trendingProducts}
              renderItem={renderTrendingProduct}
              keyExtractor={(vp) => `trending-${vp._id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trendingContainer}
            />
          </>
        )}

        {/* Featured Products */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Package size={16} color={theme.colors.primary.main} />
            <Text style={styles.sectionTitle}>Featured Products</Text>
          </View>
          <TouchableOpacity
            onPress={() => fetchData(null)}
            style={styles.clearFilter}
          >
            <Text style={styles.clearText}>
              {selectedCategory ? 'Clear Filter' : 'Refresh'}
            </Text>
            <ChevronRight size={14} color={theme.colors.primary.main} />
          </TouchableOpacity>
        </View>

        {/* Product list */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text style={styles.loadingText}>Finding nearby products...</Text>
          </View>
        ) : vendorProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image
              source={require('../../assets/images/no-shops.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>
              Try selecting a different category or refresh
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => fetchData(null)}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={vendorProducts}
            renderItem={renderProduct}
            keyExtractor={(vp) => vp._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productList}
            snapToInterval={CARD_WIDTH + 12}
            decelerationRate="fast"
            snapToAlignment="start"
          />
        )}

        {/* Footer Spacer */}
        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Side Menu */}
      <SideMenu isOpen={sideMenuOpen} onClose={handleMenuClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 120 : 100,
    backgroundColor: theme.colors.background.default,
    zIndex: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  header: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginLeft: 6,
  },
  viewAllText: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },

  categories: {
    paddingLeft: 16,
    paddingRight: 8,
    marginBottom: 16,
  },
  categoryItem: {
    width: CATEGORY_SIZE + 10,
    alignItems: 'center',
    marginRight: 16,
  },
  categoryItemSelected: {},
  categoryIcon: {
    width: CATEGORY_SIZE,
    height: CATEGORY_SIZE,
    borderRadius: CATEGORY_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryIconSelected: {
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  categoryInitial: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  categoryInitialSelected: {
    color: theme.colors.primary.contrastText,
  },
  categoryLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  categoryLabelSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  categoryIndicator: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.primary.main,
    marginTop: 4,
  },

  trendingContainer: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 8,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.default,
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trendingImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.background.paper,
  },
  trendingInfo: {
    flex: 1,
    marginLeft: 10,
  },
  trendingTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  trendingPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  trendingRank: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.secondary.main,
    marginLeft: 8,
  },

  clearFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary.main}10`,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  clearText: {
    color: theme.colors.primary.main,
    fontWeight: '600',
    fontSize: 12,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.text.secondary,
  },

  productList: {
    paddingRight: 16,
    paddingLeft: 0,
    paddingBottom: 8,
  },

  card: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.background.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary.main,
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
    }),
  },
  cardImageContainer: {
    position: 'relative',
    backgroundColor: theme.colors.background.paper,
  },
  cardImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  outOfStockBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#FF4D4F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  outOfStockText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  cardInfo: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardCategory: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.background.paper,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.secondary.main}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.secondary.dark,
    marginLeft: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
    lineHeight: 22,
  },
  vendorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardVendor: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary.main}10`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary.main,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  originalPrice: {
    fontSize: 14,
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
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  disabledButton: {
    backgroundColor: theme.colors.text.secondary,
    opacity: 0.7,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },

  footerSpacer: {
    height: 40,
  },
});
