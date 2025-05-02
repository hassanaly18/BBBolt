import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  ScrollView,
  SafeAreaView,
  FlatList,
  Pressable,
  ImageBackground,
  Easing,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Heart,
  Store,
  MapPin,
  Truck,
  Shield,
  Plus,
  Minus,
  Info,
  Clock,
  Tag,
  ChevronRight,
  Share2,
} from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { vendorProductApi, vendorApi, customerApi } from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import theme from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import { BlurView } from 'expo-blur'; // You'll need to install this dependency

const { width, height } = Dimensions.get('window');

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, getCartCount } = useCart();
  const { isLoggedIn } = useAuth();
  const { location, getLocationParams } = useLocation();
  const cartCount = getCartCount();
  const scrollY = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const [activeTab, setActiveTab] = useState('details');
  const [vendorProduct, setVendorProduct] = useState(null);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [vendorDistance, setVendorDistance] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  const [comparisons, setComparisons] = useState([]);
  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState(null);

  // Enhanced animations
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [0, 0.8, 1],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [1.2, 1, 0.8],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const parseCoordinates = (locData) => {
    if (!locData) return null;
    if (typeof locData === 'string') {
      const parts = locData.split(',');
      if (parts.length === 2)
        return [parseFloat(parts[0]), parseFloat(parts[1])];
    }
    if (Array.isArray(locData) && locData.length === 2)
      return [locData[0], locData[1]];
    if (locData && Array.isArray(locData.coordinates))
      return [locData.coordinates[0], locData.coordinates[1]];
    if (locData?.latitude && locData?.longitude)
      return [locData.longitude, locData.latitude];
    return null;
  };

  const calculateDistance = (vendorLoc) => {
    try {
      const vendorCoords = parseCoordinates(vendorLoc);
      const userCoords = parseCoordinates(location);
      if (!vendorCoords || !userCoords) return 'Unknown distance';
      const [vLon, vLat] = vendorCoords;
      const [uLon, uLat] = userCoords;
      const R = 6371;
      const dLat = (vLat - uLat) * (Math.PI / 180);
      const dLon = (vLon - uLon) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((uLat * Math.PI) / 180) *
          Math.cos((vLat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
      return dist < 1
        ? `${Math.round(dist * 1000)} m`
        : `${dist.toFixed(1)} km`;
    } catch {
      return 'Unknown distance';
    }
  };

  const parsePrice = (ps) => {
    if (!ps) return 0;
    if (typeof ps === 'number') return ps;
    const m = String(ps).match(/[\d,]+/);
    return m ? parseInt(m[0].replace(/,/g, ''), 10) : 0;
  };

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: vp } = await vendorProductApi.getVendorProductById(id);
      setVendorProduct(vp);
      let vendor = null;
      let distance = '';
      const vid = typeof vp.vendor === 'string' ? vp.vendor : vp.vendor?._id;
      if (vid) {
        try {
          const { data } = await vendorApi.getVendorById(vid);
          vendor = data;
          distance = calculateDistance(data.location);
          setVendorDistance(distance);
        } catch {}
      }
      setVendorDetails(vendor);
      const p = vp.product;
      const base = parsePrice(p.price);
      let final = base;
      if (vp.discountType && vp.discountValue) {
        final =
          vp.discountType === 'percentage'
            ? base * (1 - vp.discountValue / 100)
            : Math.max(0, base - vp.discountValue);
      }
      setProduct({
        id: p._id,
        name: p.title,
        description: p.description || 'Premium quality product.',
        price: final,
        originalPrice: base,
        image: p.imageUrl,
        vendor: {
          id: vid,
          name: vendor?.name || 'Unknown Store',
          location: vendor?.location?.formattedAddress || 'N/A',
          distance,
        },
        inStock: vp.inStock !== false,
      });
    } catch {
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisons = async () => {
    if (!product) return;

    setCompLoading(true);
    setCompError(null);
    try {
      const coords = getLocationParams();
      const { data } = await customerApi.priceComparison({
        name: product.name,
        excludeId: id,
        ...coords,
        radius: 1,
      });
      setComparisons(data);
    } catch {
      setCompError('Failed to load price comparisons');
    } finally {
      setCompLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id, location]);

  useEffect(() => {
    if (product) {
      fetchComparisons();
    }
  }, [product]);

  const toggleFavorite = () => {
    setIsFavorite((prev) => !prev);

    // Heart animation
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.3,
        duration: 150,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 150,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const increaseQuantity = () => setQuantity((q) => q + 1);
  const decreaseQuantity = () => quantity > 1 && setQuantity((q) => q - 1);

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      return Alert.alert('Login Required', 'Please login to add to cart', [
        { text: 'Login', onPress: () => router.push('/auth/login') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }

    if (!product.inStock) {
      return Alert.alert(
        'Out of Stock',
        'This product is currently out of stock'
      );
    }

    setAddingToCart(true);
    try {
      await addToCart(vendorProduct, quantity);

      // Success feedback
      Alert.alert(
        'Added to Cart',
        `${product.name} (${quantity} item${
          quantity > 1 ? 's' : ''
        }) added to your cart.`,
        [
          {
            text: 'View Cart',
            onPress: () => router.push('/cart'),
          },
          {
            text: 'Continue Shopping',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const getEstimatedDelivery = (dist) => {
    if (!dist || (!dist.includes('km') && !dist.includes('m')))
      return '30-45 min';
    const km = dist.includes('km') ? parseFloat(dist) : parseFloat(dist) / 1000;
    if (isNaN(km)) return '30-45 min';
    if (km < 0.2) return '5 min';
    if (km < 0.5) return '10-15 min';
    if (km < 0.7) return '15-20 min';
    if (km < 1) return '20-25 min';
    return '25-35 min';
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality would be implemented here.');
    // Implement share functionality
  };

  // Loading state with enhanced UI
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingIndicatorContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state with enhanced UI
  if (error || !product) {
    return (
      <SafeAreaView style={[styles.container, styles.errorContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.headerError}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButtonError}
          >
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContentContainer}>
          <Info size={60} color="#FF4D4F" />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error || 'Product not found'}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButtonLarge}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const discountPercent =
    product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : 0;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Animated Header Background */}
      <Animated.View
        style={[styles.headerBackground, { opacity: headerOpacity }]}
      />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <Animated.Text
            numberOfLines={1}
            style={[
              styles.headerTitle,
              {
                opacity: headerOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            {product.name}
          </Animated.Text>

          <View style={styles.headerRightButtons}>
            <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
              <Share2 size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleFavorite}
              style={styles.iconButton}
            >
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Heart
                  size={20}
                  fill={isFavorite ? '#FF4D67' : 'none'}
                  color={isFavorite ? '#FF4D67' : theme.colors.text.primary}
                />
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/cart')}
              style={styles.cartButton}
            >
              <ShoppingCart size={20} color={theme.colors.text.primary} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('details')}
          style={[
            styles.tabItem,
            activeTab === 'details' && styles.tabItemActive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'details' && styles.tabTextActive,
            ]}
          >
            Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('compare')}
          style={[
            styles.tabItem,
            activeTab === 'compare' && styles.tabItemActive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'compare' && styles.tabTextActive,
            ]}
          >
            Compare Prices
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product Details */}
      {activeTab === 'details' ? (
        <Animated.ScrollView
          style={styles.scrollView}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {/* Product Image */}
          <Animated.View
            style={[
              styles.imageContainer,
              {
                transform: [{ scale: imageScale }],
                opacity: imageOpacity,
              },
            ]}
          >
            <Image
              source={{ uri: product.image }}
              style={styles.image}
              resizeMode="contain"
              defaultSource={require('../../../assets/images/no-shops.png')}
            />

            {/* Discount Badge */}
            {discountPercent > 0 && (
              <View style={styles.discountBadge}>
                <Tag size={14} color="#FFF" />
                <Text style={styles.discountText}>{discountPercent}% OFF</Text>
              </View>
            )}

            {/* Out of Stock Badge */}
            {!product.inStock && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
          </Animated.View>

          {/* Product Information */}
          <View style={styles.detailsContainer}>
            {/* Product Name & Price */}
            <View style={styles.productHeaderContainer}>
              <Text style={styles.name}>{product.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>Rs {product.price.toFixed(2)}</Text>
                {product.originalPrice > product.price && (
                  <Text style={styles.originalPrice}>
                    Rs {product.originalPrice.toFixed(2)}
                  </Text>
                )}
              </View>
            </View>

            {/* Vendor Card */}
            <TouchableOpacity
              style={styles.vendorCard}
              onPress={() => router.push(`/vendor/${product.vendor.id}`)}
            >
              <View style={styles.vendorIconContainer}>
                <Store size={20} color={theme.colors.primary.main} />
              </View>
              <View style={styles.vendorInfo}>
                <Text style={styles.vendorName}>{product.vendor.name}</Text>
                <View style={styles.locationRow}>
                  <MapPin size={12} color={theme.colors.text.secondary} />
                  <Text style={styles.vendorLocation} numberOfLines={1}>
                    {product.vendor.distance} • Est.{' '}
                    {getEstimatedDelivery(product.vendor.distance)}
                  </Text>
                </View>
              </View>
              <View style={styles.vendorRating}>
                <Star size={14} color="#FFB800" fill="#FFB800" />
                <Text style={styles.ratingText}>4.8</Text>
                <ChevronRight
                  size={16}
                  color={theme.colors.text.secondary}
                  style={{ marginLeft: 4 }}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Quantity Selector */}
            {/* <View style={styles.quantitySection}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  onPress={decreaseQuantity}
                  disabled={quantity <= 1}
                  style={[
                    styles.quantityButton,
                    quantity <= 1 && styles.quantityButtonDisabled,
                  ]}
                >
                  <Minus
                    size={18}
                    color={quantity <= 1 ? '#ccc' : theme.colors.primary.main}
                  />
                </TouchableOpacity>
                <View style={styles.quantityTextContainer}>
                  <Text style={styles.quantityText}>{quantity}</Text>
                </View>
                <TouchableOpacity
                  onPress={increaseQuantity}
                  style={styles.quantityButton}
                >
                  <Plus size={18} color={theme.colors.primary.main} />
                </TouchableOpacity>
              </View>
            </View> */}

            <View style={styles.divider} />

            {/* Product Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>

            {/* Delivery Info Cards */}
            <View style={styles.cardsContainer}>
              <View style={styles.infoCard}>
                <View style={styles.deliveryIconContainer}>
                  <Truck size={20} color={theme.colors.primary.main} />
                </View>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardTitle}>Fast Delivery</Text>
                  <Text style={styles.infoCardText}>
                    Est. {getEstimatedDelivery(product.vendor.distance)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.deliveryIconContainer}>
                  <Shield size={20} color={theme.colors.primary.main} />
                </View>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardTitle}>Quality Guarantee</Text>
                  <Text style={styles.infoCardText}>
                    100% authentic products
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.deliveryIconContainer}>
                  <Clock size={20} color={theme.colors.primary.main} />
                </View>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardTitle}>Easy Returns</Text>
                  <Text style={styles.infoCardText}>7-day return policy</Text>
                </View>
              </View>
            </View>

            {/* Extra space at bottom for footer overlap */}
            <View style={{ height: 100 }} />
          </View>
        </Animated.ScrollView>
      ) : (
        /* Price Comparison Tab */
        <View style={styles.comparisonWrapper}>
          {compLoading ? (
            <View style={styles.comparisonLoading}>
              <ActivityIndicator
                size="large"
                color={theme.colors.primary.main}
              />
              <Text style={styles.comparisonLoadingText}>
                Comparing prices...
              </Text>
            </View>
          ) : (
            <FlatList
              data={comparisons}
              keyExtractor={(item) => item._id}
              ListEmptyComponent={() => (
                <View style={styles.emptyComparison}>
                  {compError ? (
                    <Text style={styles.errorText}>{compError}</Text>
                  ) : (
                    <>
                      <Text style={styles.emptyComparisonTitle}>
                        No comparisons found
                      </Text>
                      <Text style={styles.emptyComparisonText}>
                        This product is unique to this vendor in your area.
                      </Text>
                    </>
                  )}
                </View>
              )}
              contentContainerStyle={styles.comparisonContainer}
              ListHeaderComponent={() => (
                <View style={styles.comparisonHeader}>
                  <Text style={styles.comparisonHeaderTitle}>
                    Price Comparison
                  </Text>
                  <Text style={styles.comparisonHeaderText}>
                    Comparing {product.name} prices from nearby vendors
                  </Text>
                </View>
              )}
              renderItem={({ item }) => {
                // Use the server-provided finalPrice and basePrice fields
                const comparisonPrice =
                  item.finalPrice || parsePrice(item.product?.price);
                const yourPrice = product.price;
                const priceDifference = yourPrice - comparisonPrice;
                const isCheaper = priceDifference > 0;

                return (
                  <View style={styles.comparisonItem}>
                    <View style={styles.comparisonVendorSection}>
                      <View style={styles.compVendorIcon}>
                        <Store size={18} color={theme.colors.primary.main} />
                      </View>
                      <View style={styles.compVendorDetails}>
                        <Text style={styles.compVendorName}>
                          {item.vendor.name}
                        </Text>
                        <Text style={styles.compVendorDistance}>
                          {calculateDistance(item.vendor.location)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.comparisonPriceSection}>
                      <Text
                        style={[
                          styles.compPrice,
                          isCheaper ? styles.compPriceBetter : null,
                        ]}
                      >
                        Rs {comparisonPrice.toFixed(2)}
                      </Text>

                      {priceDifference !== 0 && (
                        <Text
                          style={[
                            styles.compSaving,
                            isCheaper
                              ? styles.compSavingPositive
                              : styles.compSavingNegative,
                          ]}
                        >
                          {isCheaper ? 'Save ' : 'Costs '}
                          Rs {Math.abs(priceDifference).toFixed(2)}
                        </Text>
                      )}
                    </View>

                    <Pressable
                      style={styles.viewButton}
                      onPress={() => router.push(`/product/${item._id}`)}
                    >
                      <Text style={styles.viewButtonText}>View</Text>
                    </Pressable>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* Footer with Add to Cart */}
      <View style={styles.footer}>
        <View style={styles.footerPriceContainer}>
          <Text style={styles.footerPriceLabel}>Total Price</Text>
          <Text style={styles.footerPrice}>
            Rs {(product.price * quantity).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleAddToCart}
          disabled={!product.inStock || addingToCart}
          style={[
            styles.addToCartButton,
            !product.inStock && styles.disabledButton,
            addingToCart && styles.loadingButton,
          ]}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <ShoppingCart size={20} color="#fff" />
              <Text style={styles.addToCartButtonText}>
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  // Loading state styles
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingIndicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },

  // Error state styles
  errorContainer: {
    backgroundColor: '#f8f9fa',
  },
  headerError: {
    height: 60,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonError: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4D4F',
    marginBottom: 30,
    textAlign: 'center',
  },
  backButtonLarge: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },

  // Header styles
  safeTop: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: 'transparent',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 120 : 100 + StatusBar.currentHeight,
    backgroundColor: theme.colors.background.default,
    zIndex: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    height: 56,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    maxWidth: width - 160,
    textAlign: 'center',
    position: 'absolute',
    left: 80,
    right: 80,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.primary.main,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  // Tab Bar styles
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    paddingTop: 8,
    marginTop: 20, // Fix border overlap
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primary.main,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  tabTextActive: {
    color: theme.colors.primary.main,
    fontWeight: '700',
  },

  // ScrollView and content styles
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FF4D67',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 77, 103, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Details container styles
  detailsContainer: {
    padding: 20,
    backgroundColor: theme.colors.background.main,
  },
  productHeaderContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.primary.main,
  },
  originalPrice: {
    fontSize: 18,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    textDecorationLine: 'line-through',
    marginLeft: 12,
  },

  // Vendor card styles
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.background.default,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  vendorIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  vendorLocation: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  vendorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: 20,
  },

  // Quantity section styles
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.default,
    borderRadius: 30,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#eee',
  },
  quantityTextContainer: {
    minWidth: 40,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },

  // Description styles
  descriptionContainer: {
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text.secondary,
    marginTop: 10,
  },

  // Cards container styles
  cardsContainer: {
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: theme.colors.background.default,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  deliveryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  infoCardText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },

  // Comparison tab styles
  comparisonWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  comparisonLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  comparisonLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  comparisonContainer: {
    padding: 16,
    paddingBottom: 100, // Extra space for footer
  },
  comparisonHeader: {
    marginBottom: 20,
  },
  comparisonHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  comparisonHeaderText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  comparisonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.default,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  comparisonVendorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compVendorIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compVendorDetails: {
    flex: 1,
  },
  compVendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  compVendorDistance: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  comparisonPriceSection: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  compPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  compPriceBetter: {
    color: '#00C853',
  },
  compSaving: {
    fontSize: 13,
    marginTop: 2,
  },
  compSavingPositive: {
    color: '#00C853',
  },
  compSavingNegative: {
    color: '#FF4D4F',
  },
  viewButton: {
    backgroundColor: theme.colors.primary.light,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  emptyComparison: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyComparisonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  emptyComparisonText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: theme.colors.background.default,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    paddingBottom: Platform.OS === 'ios' ? 26 : 16, // Add extra padding for iOS
  },
  footerPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerPriceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  footerPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.primary.main,
  },
  addToCartButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0.05,
  },
  loadingButton: {
    backgroundColor: theme.colors.primary.dark,
  },
});
