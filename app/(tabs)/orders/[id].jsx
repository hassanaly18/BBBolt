//C:\Users\faeiz\Desktop\BBBolt\app\(tabs)\orders\[id].jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  CreditCard,
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import colors from '../../constants/colors';
import { useOrder } from '../../context/OrderContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getOrderById, cancelOrder, loading } = useOrder();

  const [order, setOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [error, setError] = useState(null);

  // Format date to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';

    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time to a more readable format
  const formatTime = (dateString) => {
    if (!dateString) return '';

    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format status for display
  const formatStatus = (status) => {
    if (!status) return 'Processing';

    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Get status color based on status
  const getStatusColor = (status) => {
    if (!status) return '#FFA726';

    switch (status.toLowerCase()) {
      case 'pending':
        return '#FFA726';
      case 'processing':
        return '#2196F3';
      case 'out_for_delivery':
        return '#9C27B0';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#FF4D4F';
      default:
        return '#FFA726';
    }
  };

  // Get status icon based on status
  const getStatusIcon = (status) => {
    if (!status) return <Clock size={20} color="#FFA726" />;

    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock size={20} color="#FFA726" />;
      case 'processing':
        return <ShoppingBag size={20} color="#2196F3" />;
      case 'out_for_delivery':
        return <Truck size={20} color="#9C27B0" />;
      case 'delivered':
        return <CheckCircle size={20} color="#4CAF50" />;
      case 'cancelled':
        return <XCircle size={20} color="#FF4D4F" />;
      default:
        return <Clock size={20} color="#FFA726" />;
    }
  };

  // Format payment method
  const formatPaymentMethod = (method) => {
    if (!method) return 'Cash on Delivery';

    switch (method.toLowerCase()) {
      case 'cash_on_delivery':
        return 'Cash on Delivery';
      case 'online':
        return 'Online Payment';
      case 'wallet':
        return 'Wallet';
      default:
        return method;
    }
  };

  // Load order details
  const loadOrderDetails = async () => {
    setLoadingOrder(true);
    setError(null);

    try {
      const orderData = await getOrderById(id);
      if (orderData) {
        setOrder(orderData);
      } else {
        setError('Order not found or could not be loaded');
      }
    } catch (err) {
      console.error('Error loading order:', err);
      setError('Failed to load order details');
    } finally {
      setLoadingOrder(false);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrderDetails();
    setRefreshing(false);
  };

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!order) return;

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        {
          text: 'No, Keep Order',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await cancelOrder(
                order.id,
                'Cancelled by customer from app'
              );

              if (success) {
                Alert.alert(
                  'Success',
                  'Your order has been cancelled successfully.'
                );
                // Refresh order details
                loadOrderDetails();
              } else {
                Alert.alert(
                  'Error',
                  'Failed to cancel the order. Please try again.'
                );
              }
            } catch (error) {
              Alert.alert(
                'Error',
                'An unexpected error occurred. Please try again later.'
              );
              console.error('Error cancelling order:', error);
            }
          },
        },
      ]
    );
  };

  // Calculate subtotal
  const calculateSubtotal = (items) => {
    if (!items || !items.length) return 0;
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // Can this order be cancelled?
  const canCancel = (status) => {
    if (!status) return true;

    const lowerStatus = status.toLowerCase();
    return lowerStatus === 'pending' || lowerStatus === 'processing';
  };

  // Load order on mount
  useEffect(() => {
    loadOrderDetails();
  }, [id]);

  if (loadingOrder && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Not Found</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <XCircle size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Order Not Found</Text>
          <Text style={styles.errorMessage}>
            {error || 'The requested order could not be found.'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadOrderDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.section}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
              <Text style={styles.orderDate}>
                {formatDate(order.date)} at {formatTime(order.date)}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {formatStatus(order.status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Order Items</Text>
          </View>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <Image
                source={{ uri: item.image }}
                style={styles.itemImage}
                defaultSource={require('../../../assets/images/no-shops.png')}
                resizeMode="cover"
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>
                  Quantity: {item.quantity}
                </Text>
                <Text style={styles.itemPrice}>
                  Rs {(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Delivery Information</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Delivery Address:</Text>
            <Text style={styles.infoValue}>
              {order.deliveryAddress || 'Address not available'}
            </Text>

            <Text style={[styles.infoLabel, { marginTop: 12 }]}>
              Contact Phone:
            </Text>
            <Text style={styles.infoValue}>
              {order.contactPhone || 'Phone not available'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Store Information</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.storeName}>{order.store}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Payment Information</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.paymentMethod}>
              {formatPaymentMethod(order.paymentMethod)}
            </Text>
            {order.customerNotes && (
              <>
                <Text style={[styles.infoLabel, { marginTop: 12 }]}>
                  Order Notes:
                </Text>
                <Text style={styles.infoValue}>{order.customerNotes}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            {getStatusIcon(order.status)}
            <Text style={styles.sectionTitle}>Order Status</Text>
          </View>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <View style={styles.statusInfo}>
                <Text style={styles.statusTime}>
                  {formatDate(order.date)} - {formatTime(order.date)}
                </Text>
                <Text style={styles.statusEventTitle}>Order Placed</Text>
                <Text style={styles.statusDetail}>
                  Your order has been confirmed
                </Text>
              </View>
            </View>

            {order.status.toLowerCase() !== 'pending' && (
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(order.status) },
                  ]}
                />
                <View style={styles.statusInfo}>
                  <Text style={styles.statusTime}>
                    {formatDate(new Date())} - {formatTime(new Date())}
                  </Text>
                  <Text style={styles.statusEventTitle}>
                    {formatStatus(order.status)}
                  </Text>
                  <Text style={styles.statusDetail}>
                    {order.status.toLowerCase() === 'cancelled'
                      ? 'Your order has been cancelled'
                      : order.status.toLowerCase() === 'delivered'
                      ? 'Your order has been delivered'
                      : order.status.toLowerCase() === 'out_for_delivery'
                      ? 'Your order is on the way'
                      : 'Your order is being processed'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalAmount}>
              Rs {calculateSubtotal(order.items).toFixed(2)}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery Fee</Text>
            <Text style={styles.totalAmount}>
              Rs {(order.total - calculateSubtotal(order.items)).toFixed(2)}
            </Text>
          </View>

          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalAmount}>
              Rs {order.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {canCancel(order.status) && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.cancelOrderButton}
              onPress={handleCancelOrder}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.cancelOrderButtonText}>Cancel Order</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.background.white,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    gap: 4,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  orderDate: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.background.main,
    padding: 12,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text.primary,
    marginTop: 4,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statusCard: {
    backgroundColor: colors.background.main,
    padding: 12,
    borderRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 4,
    marginRight: 8,
  },
  statusInfo: {
    flex: 1,
  },
  statusTime: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  statusEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  statusDetail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  totalSection: {
    backgroundColor: colors.background.white,
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  totalAmount: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  grandTotalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  actionSection: {
    padding: 16,
    marginBottom: 24,
  },
  cancelOrderButton: {
    backgroundColor: '#FF4D4F',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelOrderButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
