import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { ArrowLeft } from 'lucide-react-native';

export default function CheckoutScreen() {
  const router = useRouter();
  const { getCartTotal, clearCart, cartItems } = useCart();
  const { createOrder } = useOrders();
  
  const subtotal = getCartTotal();
  const deliveryFee = 50;
  const discount = 25;
  const total = subtotal + deliveryFee - discount;

  const handlePlaceOrder = () => {
    // Create the order
    createOrder(cartItems, total);
    // Clear the cart
    clearCart();
    // Navigate to orders tab
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Let's Make Payment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>
          You can either pay by your banking card, or Pay via cash on picking up the order.
        </Text>

        <View style={styles.paymentSection}>
          <TouchableOpacity style={styles.paymentButton}>
            <Text style={styles.paymentButtonText}>Pay on Pickup</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>OR</Text>

          <View style={styles.cardForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cardholder's Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Expiry</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>CVC</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.deliverySection}>
          <View style={styles.storeInfo}>
            <Text style={styles.storeInfoTitle}>Store: Jalal Sons Model Town</Text>
            <Text style={styles.storeInfoDistance}>Distance: 2.1 km</Text>
          </View>

          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>Map loading...</Text>
          </View>
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>Rs {total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.placeOrderButton}
        onPress={handlePlaceOrder}
      >
        <Text style={styles.placeOrderButtonText}>Pay and Place Order</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
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
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    padding: 16,
    paddingBottom: 0,
  },
  paymentSection: {
    padding: 16,
  },
  paymentButton: {
    backgroundColor: '#5D3FD3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  paymentButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 16,
    fontSize: 14,
  },
  cardForm: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
  },
  deliverySection: {
    padding: 16,
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
  },
  storeInfo: {
    marginBottom: 16,
  },
  storeInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  storeInfoDistance: {
    fontSize: 14,
    color: '#666',
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    color: '#666',
    fontSize: 16,
  },
  totalSection: {
    padding: 16,
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: '#333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5D3FD3',
  },
  placeOrderButton: {
    backgroundColor: '#5D3FD3',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 