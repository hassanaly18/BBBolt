import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Keyboard,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Trash2,
  MinusCircle,
  PlusCircle,
  ChevronLeft,
  ShoppingBag,
  MapPin,
  Clock,
  ChevronRight,
  X,
  ChefHat,
  Sparkles,
} from 'lucide-react-native';


import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useCart } from '../context/CartContext';
import { useOrder } from '../context/OrderContext';
import { recipeApi } from '../services/api';

import { useAuth } from '../auth/AuthContext';
import { useLocation } from '../context/LocationContext';
import theme from '../constants/theme';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

export default function CartScreen() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { location } = useLocation();
  const {
    cartItems,
    isLoading: cartLoading,
    error: cartError,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    fetchCart,
  } = useCart();

  const { createOrder, loading: orderLoading, createDirectOrder } = useOrder();
  const isFocused = useIsFocused();
  const [groupedItems, setGroupedItems] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Phone input modal state
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const phoneInputRef = useRef(null);

  // Recipe generation state
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState(null);

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
  const calculateDistance = (vendorLoc) => {
    try {
      // Parse coordinates from vendor location and user location
      const vendorCoords = parseCoordinates(vendorLoc);
      const userCoords = location ? parseCoordinates(location) : null;
console.log(
 
  vendorCoords,
  userCoords


)
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

  // Estimate delivery time based on distance
  const calculateDeliveryTime = (distance) => {
    // Parse the distance value
    let distanceValue = 0;
    try {
      if (typeof distance === 'string') {
        if (distance.includes('km')) {
          distanceValue = parseFloat(distance.split(' ')[0]);
        } else if (distance.includes('m')) {
          distanceValue = parseFloat(distance.split(' ')[0]) / 1000;
        }
      }
    } catch (err) {
      console.error('Error parsing distance:', err);
      return 'Est. 30-45 min';
    }

    // Calculate delivery time based on distance
    if (distanceValue < 1) {
      return 'Est. 15-25 min';
    } else if (distanceValue < 3) {
      return 'Est. 25-35 min';
    } else if (distanceValue < 5) {
      return 'Est. 35-45 min';
    } else {
      return 'Est. 45-60 min';
    }
  };

  // Group items by vendor when cart items change
  useEffect(() => {
    console.log('=== CART DEBUG: Cart Items Updated ===');
    console.log('Cart items length:', cartItems.length);
    
    // Group items by vendor
    const grouped = {};
    cartItems.forEach((item) => {
      const vendorId = item.vendorProduct?.vendor?._id || item.vendor?.id;
      if (!vendorId) return;

      if (!grouped[vendorId]) {
        grouped[vendorId] = {
          vendorId,
          vendorName: item.vendorProduct?.vendor?.name || item.vendor?.name,
          vendor: item.vendorProduct?.vendor || item.vendor,
          items: [],
          subtotal: 0,
          distance: calculateDistance(item.vendorProduct?.vendor?.location || item.vendor?.location),
          deliveryTime: calculateDeliveryTime(calculateDistance(item.vendorProduct?.vendor?.location || item.vendor?.location)),
        };
      }
      grouped[vendorId].items.push(item);
      // Calculate subtotal properly
      grouped[vendorId].subtotal += (item.finalPrice || item.price || 0) * item.quantity;
    });
    
    setGroupedItems(grouped);
    
    // Trigger recipe debug logs
    console.log('=== TRIGGERING RECIPE DEBUG ===');
    canGenerateRecipe();
  }, [cartItems]);

  // Initialize phone number from user profile if available
  useEffect(() => {
    if (user?.phone) {
      setPhoneNumber(user.phone);
    }
  }, [user]);

  // Focus phone input when modal opens
  useEffect(() => {
    if (phoneModalVisible && phoneInputRef.current) {
      setTimeout(() => {
        phoneInputRef.current.focus();
      }, 100);
    }
  }, [phoneModalVisible]);
  // Fetch cart when component mounts and when focused
  useEffect(() => {
    console.log('=== CART DEBUG: Component Mounted or Focused ===');
    console.log('isFocused:', isFocused, 'isLoggedIn:', isLoggedIn);
    
    if (isFocused && isLoggedIn) {
      console.log('Fetching cart...');
      fetchCart();
    }
  }, [isFocused, isLoggedIn]);
  // Refresh cart data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  };

  // Increment item quantity
  const handleIncrement = (itemId) => {
    const item = cartItems.find((item) => item.id === itemId);
    if (item) {
      updateQuantity(itemId, item.quantity + 1);
    }
  };

  // Decrement item quantity
  const handleDecrement = (itemId) => {
    const item = cartItems.find((item) => item.id === itemId);
    if (item && item.quantity > 1) {
      updateQuantity(itemId, item.quantity - 1);
    } else if (item && item.quantity === 1) {
      Alert.alert(
        'Remove Item',
        'Are you sure you want to remove this item from your cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeFromCart(itemId),
          },
        ]
      );
    }
  };

  // Handle removing item
  const handleRemoveItem = (itemId) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromCart(itemId),
        },
      ]
    );
  };

  // Handle clearing cart
  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearCart,
        },
      ]
    );
  };

  // Recipe generation functions
  const getRecipeEligibleItems = () => {
    console.log('=== RECIPE DEBUG: Cart Items ===');
    console.log('Total cart items:', cartItems.length);
    
    cartItems.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        productName: item.vendorProduct?.product?.title,
        categoryName: item.vendorProduct?.product?.category?.name,
        subCategoryName: item.vendorProduct?.product?.subCategory?.name,
        food_reciepe: item.vendorProduct?.product?.subCategory?.food_reciepe,
        fullSubCategory: item.vendorProduct?.product?.subCategory
      });
    });
    
    const eligibleItems = cartItems.filter(item => 
      item.vendorProduct?.product?.subCategory?.food_reciepe === 1
    );
    
    console.log('=== RECIPE DEBUG: Eligible Items ===');
    console.log('Eligible items count:', eligibleItems.length);
    eligibleItems.forEach((item, index) => {
      console.log(`Eligible item ${index + 1}:`, item.vendorProduct?.product?.title);
    });
    
    return eligibleItems;
  };

  const canGenerateRecipe = () => {
    const eligibleCount = getRecipeEligibleItems().length;
    const canGenerate = eligibleCount >= 5;
    console.log('=== RECIPE DEBUG: Can Generate ===');
    console.log('Eligible count:', eligibleCount, 'Can generate:', canGenerate);
    return canGenerate;
  };

  const handleGenerateRecipe = async () => {
    if (!canGenerateRecipe()) return;

    setRecipeLoading(true);
    setRecipeError(null);
    setRecipeModalVisible(true);

    try {
      console.log('Generating recipe with cart items:', cartItems);
      const response = await recipeApi.generateRecipe(cartItems);
      
      if (response.data && response.data.success) {
        setGeneratedRecipe(response.data.data);
      } else {
        setRecipeError('Failed to generate recipe');
      }
    } catch (error) {
      console.error('Error generating recipe:', error);
      
      // Handle specific error cases
      if (error.response?.data?.error === 'GROQ_SDK_NOT_INSTALLED') {
        setRecipeError('Recipe generation service is temporarily unavailable. The Groq SDK needs to be installed on the server.');
      } else if (error.response?.status === 503) {
        setRecipeError('Recipe generation service is currently unavailable. Please try again later.');
      } else {
        setRecipeError(error.response?.data?.message || 'An error occurred while generating the recipe');
      }
    } finally {
      setRecipeLoading(false);
    }
  };

  const handleCloseRecipeModal = () => {
    setRecipeModalVisible(false);
    setGeneratedRecipe(null);
    setRecipeError(null);
  };

  const renderRecipeModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={recipeModalVisible}
      onRequestClose={handleCloseRecipeModal}
    >
      <View style={styles.recipeModalOverlay}>
        <View style={styles.recipeModalContent}>
          <View style={styles.recipeModalHeader}>
            <View style={styles.recipeModalTitleContainer}>
              <ChefHat size={24} color={theme.colors.primary.main} />
              <Text style={styles.recipeModalTitle}>AI Recipe Generator</Text>
            </View>
            <TouchableOpacity
              style={styles.recipeModalCloseButton}
              onPress={handleCloseRecipeModal}
            >
              <X size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.recipeModalBody}>
            {recipeLoading && (
              <View style={styles.recipeLoadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.main} />
                <Text style={styles.recipeLoadingText}>
                  Generating your Pakistani recipe...
                </Text>
                <View style={styles.recipeLoadingDots}>
                  <Sparkles size={16} color={theme.colors.primary.main} />
                  <Text style={styles.recipeLoadingSubtext}>
                    Using AI to create the perfect dish with your ingredients
                  </Text>
                </View>
              </View>
            )}

            {recipeError && (
              <View style={styles.recipeErrorContainer}>
                <Text style={styles.recipeErrorText}>{recipeError}</Text>
                <TouchableOpacity
                  style={styles.recipeRetryButton}
                  onPress={handleGenerateRecipe}
                >
                  <Text style={styles.recipeRetryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {generatedRecipe && (
              <View style={styles.recipeContainer}>
                <Text style={styles.recipeContent}>
                  {generatedRecipe.recipe}
                </Text>
                
                <View style={styles.recipeFooter}>
                  <Text style={styles.recipeFooterText}>
                    Recipe generated using {generatedRecipe.total_items} ingredients from your cart
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Handle checkout
  const handleCheckout = () => {
    if (!isLoggedIn) {
      Alert.alert('Login Required', 'Please login to continue with checkout', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ]);
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert(
        'Empty Cart',
        'Your cart is empty. Add some items before checkout.'
      );
      return;
    }

    // Navigate to checkout
    router.push('/checkout');
  };

  // Handle direct order
  // const handleDirectOrder = (vendorId) => {
  //   if (!isLoggedIn) {
  //     Alert.alert('Login Required', 'Please login to continue with checkout', [
  //       { text: 'Cancel', style: 'cancel' },
  //       { text: 'Login', onPress: () => router.push('/login') },
  //     ]);
  //     return;
  //   }

  //   // Get vendor items
  //   const vendorData = groupedItems[vendorId];
  //   if (!vendorData || vendorData.items.length === 0) return;

  //   // Check if we have a location for delivery
  //   if (!location) {
  //     Alert.alert(
  //       'Location Required',
  //       'Please set your delivery location before placing an order.',
  //       [
  //         { text: 'Cancel', style: 'cancel' },
  //         { text: 'Set Location', onPress: () => router.push('/location') },
  //       ]
  //     );
  //     return;
  //   }

  //   // Show phone input modal
  //   setSelectedVendorId(vendorId);
  //   setPhoneModalVisible(true);
  // };
  const handleDirectOrder = (vendorId) => {
    const vendorData = groupedItems[vendorId];
    // skip the phone‐modal and go straight to order
    processDirectOrder(vendorId, user.phone || '0000000000');
  };

  // Handle phone input submission
  const handlePhoneSubmit = () => {
    // Validate phone number
    if (!phoneNumber.trim() || phoneNumber.trim().length < 10) {
      setPhoneError('Please enter a valid phone number');
      return;
    }

    setPhoneError('');
    setPhoneModalVisible(false);
    processDirectOrder(selectedVendorId, phoneNumber.trim());
  };

  // Update your processDirectOrder function in cart.jsx

// Updated processDirectOrder function to fix pricing issues
const processDirectOrder = async (vendorId, contactPhone) => {
  console.log("processing direct order");
  const vendorData = groupedItems[vendorId];
  setIsProcessing(true);

  try {
    // Format the delivery address
    let deliveryAddress;
    if (location.formattedAddress) {
      deliveryAddress = {
        coordinates: parseCoordinates(location),
        formattedAddress: location.formattedAddress,
        type: 'Point',
      };
    } else {
      // Create an address object from coordinates
      deliveryAddress = {
        coordinates: parseCoordinates(location),
        type: 'Point',
        formattedAddress: 'Current Location',
      };
    }

    // Helper function to ensure we have a clean number
    const cleanNumber = (ps) => {
      if (!ps) return 0;
      if (typeof ps === 'number') return ps;
      const m = String(ps).match(/[\d,]+/);
      return m ? parseInt(m[0].replace(/,/g, ''), 10) : 0;
    };

    // Calculate item totals properly with discounts applied
    const items = vendorData.items.map((item) => {
      // Always use finalPrice which already has the discount applied
      const discountedPrice = cleanNumber(item.finalPrice);
      
      return {
        vendorProductId: item.id,
        quantity: item.quantity,
        // CRITICAL: Send the discounted price as the price field
        price: discountedPrice,
        // Send original price for reference
        originalPrice: cleanNumber(item.originalPrice),
        discountType: item.discountType,
        discountValue: item.discountValue,
        // Calculate total price using the discounted price
        totalPrice: discountedPrice * item.quantity,
      };
    });

    // Calculate subtotal correctly from the discounted prices
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Fixed delivery fee
    const deliveryFee = 40;

    // Calculate total with the correct subtotal
    const total = subtotal + deliveryFee;

    console.log('Order summary:', {
      items: items.map(i => ({
        name: vendorData.items.find(vi => vi.id === i.vendorProductId)?.name,
        quantity: i.quantity,
        price: i.price,
        totalPrice: i.totalPrice
      })),
      subtotal,
      deliveryFee,
      total
    });

    // Prepare order data
    const orderData = {
      items,
      deliveryAddress,
      contactPhone,
      paymentMethod: 'cash_on_delivery',
      customerNotes: 'Order placed from cart screen',
      subtotal,
      deliveryFee,
      total,
    };

    console.log('Sending order data:', JSON.stringify(orderData));

    // Use the new createDirectOrder method
    const orderResponse = await createDirectOrder(orderData);

    console.log('Order response:', orderResponse);

    if (orderResponse) {
      // Remove ordered items from cart
      for (const item of vendorData.items) {
        await removeFromCart(item.id);
      }

      // Show success message
      Alert.alert(
        'Order Placed Successfully',
        `Your order from ${vendorData.vendorName} has been placed successfully!`,
        [
          {
            text: 'View Order',
            onPress: () =>
              router.push({
                pathname: '/orders/[id]',
                params: { id: orderResponse.id || orderResponse._id },
              }),
          },
        ]
      );
    }
  } catch (error) {
    console.error('Error creating order:', error);

    // More detailed error message
    let errorMessage =
      'There was an error creating your order. Please try again.';
    if (
      error.response &&
      error.response.data &&
      error.response.data.message
    ) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    Alert.alert('Order Failed', errorMessage);
  } finally {
    setIsProcessing(false);
  }
};
  // Render cart empty state
  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <ShoppingBag size={80} color={theme.colors.text.secondary} />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>
        Browse our products and add something to your cart
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => router.push('/')}
      >
        <LinearGradient
          colors={[theme.colors.primary.main, theme.colors.primary.dark]}
          style={styles.shopButtonGradient}
        >
          <Text style={styles.shopButtonText}>Browse Products</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Render cart item
  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.image }}
        style={styles.itemImage}
        defaultSource={require('../../assets/images/no-shops.png')}
      />

      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
            <Trash2 size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        <Text style={styles.itemCategory}>
          {item.category ? `${item.category}` : ''}
          {item.subCategory ? ` › ${item.subCategory}` : ''}
        </Text>

        <View style={styles.itemFooter}>
  {item.discountType && item.discountValue ? (
    <View>
      <Text style={styles.itemOriginalPrice}>
        Rs. {(item.originalPrice || 0).toLocaleString()}
      </Text>
      <Text style={styles.itemPrice}>
        Rs. {(item.finalPrice || 0).toLocaleString()}
      </Text>
    </View>
  ) : (
    <Text style={styles.itemPrice}>
      Rs. {(item.price || 0).toLocaleString()}
    </Text>
  )}

          <View style={styles.quantityControl}>
            <TouchableOpacity
              onPress={() => handleDecrement(item.id)}
              style={styles.quantityButton}
            >
              <MinusCircle size={22} color={theme.colors.primary.main} />
            </TouchableOpacity>

            <Text style={styles.quantityText}>{item.quantity}</Text>

            <TouchableOpacity
              onPress={() => handleIncrement(item.id)}
              style={styles.quantityButton}
            >
              <PlusCircle size={22} color={theme.colors.primary.main} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  // Render vendor group
  const renderVendorGroup = ({ item: vendorGroup }) => (
    <View style={styles.vendorGroup}>
      <View style={styles.vendorHeader}>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{vendorGroup.vendorName}</Text>
          {vendorGroup.distance && (
            <View style={styles.distanceContainer}>
              <MapPin size={12} color={theme.colors.text.secondary} />
              <Text style={styles.distanceText}>{vendorGroup.distance}</Text>
            </View>
          )}
        </View>

        <View style={styles.deliveryInfo}>
          <Clock size={14} color={theme.colors.primary.light} />
          <Text style={styles.deliveryText}>{vendorGroup.deliveryTime}</Text>
        </View>
      </View>

      <FlatList
        data={vendorGroup.items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />

      <View style={styles.vendorFooter}>
        <View style={styles.vendorFooterLeft}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>
            Rs. {(vendorGroup.subtotal || 0).toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.orderNowButton}
          onPress={() => handleDirectOrder(vendorGroup.vendorId)}
          disabled={isProcessing}
        >
          {isProcessing && selectedVendorId === vendorGroup.vendorId ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.orderNowText}>Order Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render phone input modal
  const renderPhoneModal = () => (
    <Modal
      visible={phoneModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setPhoneModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            setPhoneModalVisible(false);
          }}
        />

        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Contact Phone</Text>
            <TouchableOpacity
              onPress={() => setPhoneModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <X size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Please enter your phone number for delivery
          </Text>

          <TextInput
            ref={phoneInputRef}
            style={[
              styles.phoneInput,
              phoneError ? styles.phoneInputError : null,
            ]}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            returnKeyType="done"
            autoCompleteType="tel"
            maxLength={15}
          />

          {phoneError ? (
            <Text style={styles.errorText}>{phoneError}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.modalButton}
            onPress={handlePhoneSubmit}
          >
            <Text style={styles.modalButtonText}>Continue to Order</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Loading state
  if (cartLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={styles.loadingText}>Loading your cart...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Cart</Text>

        {cartItems.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearCart}
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cart Content */}
      {cartItems.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          <FlatList
            data={Object.values(groupedItems)}
            renderItem={renderVendorGroup}
            keyExtractor={(item) => item.vendorId}
            contentContainerStyle={styles.cartList}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            showsVerticalScrollIndicator={false}
          />

          {/* Checkout Summary */}
          <View style={styles.checkoutContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
              style={styles.fadeGradient}
            />

            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Items</Text>
                <Text style={styles.summaryValue}>{getCartCount()}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>
                  {Object.keys(groupedItems).length > 0
                    ? `Rs. ${(
                        Object.keys(groupedItems).length * 40
                      ).toLocaleString()}`
                    : 'Rs. 0'}
                </Text>
              </View>

              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  Rs.{' '}
                  {(
                    (getCartTotal() || 0) +
                    Object.keys(groupedItems).length * 40
                  ).toLocaleString()}
                </Text>
              </View>

              {/* Recipe Generation Button */}
              <TouchableOpacity
                style={[
                  styles.recipeButton,
                  !canGenerateRecipe() && styles.recipeButtonDisabled
                ]}
                onPress={handleGenerateRecipe}
                disabled={!canGenerateRecipe() || recipeLoading}
              >
                <LinearGradient
                  colors={canGenerateRecipe() ? [
                    theme.colors.secondary.main,
                    theme.colors.secondary.dark,
                  ] : [
                    '#ccc',
                    '#aaa',
                  ]}
                  style={styles.recipeButtonGradient}
                >
                  {recipeLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <ChefHat size={18} color="#fff" />
                      <Text style={styles.recipeButtonText}>
                        Generate Recipe ({(() => {
                          const count = getRecipeEligibleItems().length;
                          console.log('=== RECIPE BUTTON DEBUG ===');
                          console.log('Recipe eligible count for button:', count);
                          return count;
                        })()}/5)
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>


            </View>
          </View>
        </>
      )}

      {/* Phone Input Modal */}
      {renderPhoneModal()}
      {renderRecipeModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
  },
  clearButton: {
    padding: 8,
  },
  clearText: {
    color: theme.colors.primary.main,
    ...theme.typography.button,
  },
  cartList: {
    padding: 16,
    paddingBottom: 200, // Extra space for the checkout container
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    ...theme.typography.h3,
    marginTop: 16,
    color: theme.colors.text.primary,
  },
  emptySubtitle: {
    ...theme.typography.body1,
    textAlign: 'center',
    marginTop: 8,
    color: theme.colors.text.secondary,
  },
  shopButton: {
    width: '80%',
    height: 50,
    borderRadius: 25,
    marginTop: 24,
    overflow: 'hidden',
  },
  itemOriginalPrice: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  itemPrice: {
    ...theme.typography.subtitle1, 
    color: theme.colors.primary.main,
  },
  shopButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopButtonText: {
    color: 'white',
    ...theme.typography.button,
  },
  vendorGroup: {
    marginBottom: 20,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 12,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    ...theme.typography.subtitle1,
    color: theme.colors.text.primary,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distanceText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0edf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deliveryText: {
    ...theme.typography.caption,
    color: theme.colors.primary.main,
    marginLeft: 4,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    ...theme.typography.subtitle1,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  itemCategory: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemPrice: {
    ...theme.typography.subtitle1,
    color: theme.colors.primary.main,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    padding: 4,
  },
  quantityText: {
    ...theme.typography.subtitle2,
    color: theme.colors.text.primary,
    minWidth: 30,
    textAlign: 'center',
  },
  vendorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f7fc',
  },
  vendorFooterLeft: {
    flex: 1,
  },
  subtotalLabel: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  subtotalValue: {
    ...theme.typography.subtitle1,
    color: theme.colors.primary.main,
  },
  orderNowButton: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  orderNowText: {
    ...theme.typography.button,
    color: '#fff',
    fontSize: 12,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background.default,
    paddingTop: 8,
  },
  fadeGradient: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 40,
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: theme.colors.background.default,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  summaryValue: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
  },
  totalRow: {
    marginTop: 4,
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
  },
  totalValue: {
    ...theme.typography.h4,
    color: theme.colors.primary.main,
  },
  checkoutButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    marginTop: 12,
    overflow: 'hidden',
  },
  checkoutGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutText: {
    color: 'white',
    ...theme.typography.button,
    marginRight: 8,
  },

  // Recipe generation button styles
  recipeButton: {
    width: '100%',
    height: 45,
    borderRadius: 22,
    marginTop: 12,
    overflow: 'hidden',
  },
  recipeButtonDisabled: {
    opacity: 0.6,
  },
  recipeButtonGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeButtonText: {
    color: 'white',
    ...theme.typography.button,
    marginLeft: 8,
    fontSize: 14,
  },

  // Phone modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: width - 40,
    backgroundColor: theme.colors.background.default,
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  phoneInputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: '#fff',
    ...theme.typography.button,
  },

  // Recipe modal styles
  recipeModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  recipeModalContent: {
    width: width * 0.9,
    backgroundColor: theme.colors.background.default,
    borderRadius: 15,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  recipeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recipeModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeModalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  recipeModalCloseButton: {
    padding: 8,
  },
  recipeModalBody: {
    padding: 16,
    maxHeight: height * 0.6, // Limit height to 60% of screen
  },
  recipeLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  recipeLoadingText: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginTop: 10,
  },
  recipeLoadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  recipeLoadingSubtext: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginLeft: 5,
  },
  recipeErrorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  recipeErrorText: {
    ...theme.typography.body1,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 15,
  },
  recipeRetryButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  recipeRetryButtonText: {
    color: '#fff',
    ...theme.typography.button,
  },
  recipeContainer: {
    backgroundColor: '#f9f7fc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  recipeContent: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginBottom: 15,
  },
  recipeFooter: {
    alignItems: 'center',
  },
  recipeFooterText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
});
