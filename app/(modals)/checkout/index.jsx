import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { useOrder } from '../../context/OrderContext';
import { useAuth } from '../../auth/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import * as Location from 'expo-location';

export default function CheckoutScreen() {
  const router = useRouter();
  const {
    cartItems,
    getCartTotal,
    clearCart,
    loading: cartLoading,
  } = useCart();
  const { createOrder, loading: orderLoading } = useOrder();
  const { user, isLoggedIn } = useAuth();
  const {
    location: userLocation,
    address: userAddress,
    getCurrentLocation,
  } = useLocation();

  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState(userAddress || '');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Calculate order totals
  const subtotal = getCartTotal();
  const deliveryFee = 50;
  const discount = 25;
  const total = subtotal + deliveryFee - discount;

  // Pre-fill user data if available
  useEffect(() => {
    if (user) {
      setContactPhone(user.phone || '');

      if (user.location?.formattedAddress) {
        setDeliveryAddress(user.location.formattedAddress);
      }
    }
  }, [user]);

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLoggedIn && !cartLoading) {
      Alert.alert('Login Required', 'You need to login to checkout', [
        {
          text: 'Login',
          onPress: () => router.push('/auth/login'),
        },
        {
          text: 'Cancel',
          onPress: () => router.back(),
          style: 'cancel',
        },
      ]);
    }
  }, [isLoggedIn, cartLoading]);

  // Redirect to cart if empty
  useEffect(() => {
    if (cartItems.length === 0 && !cartLoading) {
      Alert.alert('Empty Cart', 'Your cart is empty', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    }
  }, [cartItems, cartLoading]);

  const detectCurrentLocation = async () => {
    setIsDetectingLocation(true);

    try {
      const locationData = await getCurrentLocation();

      if (locationData && locationData.address) {
        setDeliveryAddress(locationData.address);
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      Alert.alert('Error', 'Failed to detect your location');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const validateForm = () => {
    if (!contactPhone.trim()) {
      Alert.alert('Error', 'Please provide a contact phone number');
      return false;
    }

    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please provide a delivery address');
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    try {
      // Get delivery coordinates from address if not already set
      let deliveryCoordinates = userLocation;

      if (!deliveryCoordinates) {
        try {
          const geocodeResult = await Location.geocodeAsync(deliveryAddress);

          if (geocodeResult && geocodeResult.length > 0) {
            deliveryCoordinates = {
              latitude: geocodeResult[0].latitude,
              longitude: geocodeResult[0].longitude,
            };
          }
        } catch (error) {
          console.error('Error geocoding address:', error);
        }
      }

      // Prepare order data
      const orderData = {
        items: cartItems.map((item) => ({
          vendorProductId: item.vendorProductId || item.id,
          quantity: item.quantity,
        })),
        deliveryAddress: {
          formattedAddress: deliveryAddress,
          coordinates: deliveryCoordinates
            ? [deliveryCoordinates.longitude, deliveryCoordinates.latitude]
            : undefined,
        },
        contactPhone,
        customerNotes,
        paymentMethod,
      };

      // Create the order
      const response = await createOrder(orderData);

      if (response) {
        // Clear the cart
        await clearCart();

        // Show success message
        Alert.alert(
          'Order Placed Successfully',
          `Your order #${response.orderNumber} has been placed successfully!`,
          [
            {
              text: 'View Order',
              onPress: () => {
                router.push(`/orders/${response.id || response._id}`);
              },
            },
            {
              text: 'Continue Shopping',
              onPress: () => {
                router.push('/');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      Alert.alert(
        'Order Failed',
        error.response?.data?.message ||
          'Failed to place your order. Please try again.'
      );
    }
  };

  if (!isLoggedIn || cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>

          <View style={styles.addressContainer}>
            <View style={styles.addressInputContainer}>
              <MapPin
                size={20}
                color={colors.primary}
                style={styles.addressIcon}
              />
              <TextInput
                style={styles.addressInput}
                placeholder="Enter your delivery address"
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.detectButton}
              onPress={detectCurrentLocation}
              disabled={isDetectingLocation}
            >
              {isDetectingLocation ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.detectButtonText}>Detect Location</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number for delivery"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Order Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any special instructions"
              value={customerNotes}
              onChangeText={setCustomerNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cash_on_delivery' &&
                styles.selectedPaymentOption,
            ]}
            onPress={() => setPaymentMethod('cash_on_delivery')}
          >
            <Text style={styles.paymentOptionText}>Cash on Delivery</Text>
            {paymentMethod === 'cash_on_delivery' && (
              <View style={styles.selectedPaymentIndicator} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'online' && styles.selectedPaymentOption,
            ]}
            onPress={() => setPaymentMethod('online')}
          >
            <Text style={styles.paymentOptionText}>Pay Online</Text>
            {paymentMethod === 'online' && (
              <View style={styles.selectedPaymentIndicator} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          <View style={styles.orderItems}>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <Text style={styles.orderItemName}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.orderItemPrice}>
                  Rs {(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.orderSummaryRow}>
            <Text style={styles.orderSummaryLabel}>Subtotal</Text>
            <Text style={styles.orderSummaryValue}>
              Rs {subtotal.toFixed(2)}
            </Text>
          </View>

          <View style={styles.orderSummaryRow}>
            <Text style={styles.orderSummaryLabel}>Delivery Fee</Text>
            <Text style={styles.orderSummaryValue}>
              Rs {deliveryFee.toFixed(2)}
            </Text>
          </View>

          <View style={styles.orderSummaryRow}>
            <Text style={styles.orderSummaryLabel}>Discount</Text>
            <Text style={[styles.orderSummaryValue, styles.discountText]}>
              -Rs {discount.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.orderSummaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>Rs {total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={handlePlaceOrder}
          disabled={orderLoading || cartLoading}
        >
          {orderLoading || cartLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.placeOrderButtonText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.background.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
  },
  addressContainer: {
    marginBottom: 16,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.main,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  addressIcon: {
    marginTop: 4,
    marginRight: 8,
  },
  addressInput: {
    flex: 1,
    minHeight: 40,
    color: colors.text.primary,
  },
  detectButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  detectButtonText: {
    color: '#FFF',
    fontWeight: '500',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.main,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.main,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  selectedPaymentOption: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  paymentOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  selectedPaymentIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  orderItems: {
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 14,
    color: colors.text.primary,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderSummaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  orderSummaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  discountText: {
    color: '#4CAF50',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.background.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
