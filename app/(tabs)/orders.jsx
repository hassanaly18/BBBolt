//C:\Users\faeiz\Desktop\BBBolt\app\(tabs)\orders.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOrder } from '../context/OrderContext';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../constants/theme';
import { ShoppingBag, Clock, Package, MapPin, X } from 'lucide-react-native';

// Cancel Order Modal Component
const CancelOrderModal = ({ isVisible, onClose, onConfirm, isLoading }) => {
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cancel Order</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalMessage}>
            Are you sure you want to cancel this order? This action cannot be undone.
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelModalButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelModalButtonText}>Keep Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              <Text style={styles.confirmButtonText}>
                {isLoading ? 'Cancelling...' : 'Cancel Order'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, loading, error, fetchOrders, cancelOrder } = useOrder();
  const { sendLocalNotification } = useNotification();
  const { isLoggedIn } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
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

  // Get status color
  const getStatusColor = (status) => {
    if (!status) return colors.warning;

    switch (status.toLowerCase()) {
      case 'pending':
        return colors.warning;
      case 'processing':
        return colors.primary;
      case 'out_for_delivery':
        return colors.info;
      case 'delivered':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.text.secondary;
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    if (!isLoggedIn) {
      setRefreshing(false);
      return;
    }
    
    setRefreshing(true);
    if (fetchOrders) {
      await fetchOrders();
    }
    setRefreshing(false);
  };

  // Handle cancel order
  const handleCancelOrder = (order) => {
    setSelectedOrder(order);
    setIsCancelModalVisible(true);
  };

  // Confirm order cancellation
  const handleConfirmCancel = async () => {
    if (!selectedOrder) return;

    setIsCancelling(true);
    try {
      const success = await cancelOrder(
        selectedOrder.id,
        'Cancelled by customer from app'
      );

      if (success) {
        Alert.alert('Success', 'Your order has been cancelled successfully.');
      } else {
        Alert.alert('Error', 'Failed to cancel the order. Please try again.');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again later.'
      );
    } finally {
      setIsCancelling(false);
      setIsCancelModalVisible(false);
      setSelectedOrder(null);
    }
  };

  // Can this order be cancelled?
  const canCancel = (status) => {
    if (!status) return true;

    const lowerStatus = status.toLowerCase();
    return lowerStatus === 'pending' || lowerStatus === 'processing';
  };

  // Render each order item
  const renderOrderItem = ({ item }) => {
    if (!item) return null;
    
    return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push(`/orders/${item.id || ''}`)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{item.orderNumber || 'N/A'}</Text>
          <Text style={styles.orderDate}>{formatDate(item.date)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
        </View>
      </View>

      <View style={styles.vendorSection}>
        <View style={styles.storeInfo}>
          <Package size={16} color={colors.primary} />
          <View style={styles.storeDetails}>
            <Text style={styles.storeName}>{item.store || 'Unknown Store'}</Text>
            {item.storeLocation && (
              <Text style={styles.storeLocation} numberOfLines={1}>
                📍 {item.storeLocation}
              </Text>
            )}
          </View>
        </View>

        {item.deliveryAddress && (
          <View style={styles.addressInfo}>
            <MapPin size={14} color={colors.text.secondary} />
            <Text style={styles.addressText} numberOfLines={1}>
              Delivery to: {item.deliveryAddress}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.itemsContainer}>
        {item.items && item.items.length > 0 && item.items.slice(0, 3).map((product, index) => {
          if (!product) return null;
          return (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemLeftSection}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {(product.quantity || 0)}x {product.name || 'Unknown Item'}
                </Text>
                {product.discountType && product.discountValue > 0 && (
                  <View style={styles.discountInfo}>
                    <Text style={styles.discountBadge}>
                      {product.discountType === 'percentage' 
                        ? `${product.discountValue || 0}% OFF` 
                        : `Rs ${product.discountValue || 0} OFF`}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.itemPriceSection}>
                {product.discountType && product.discountValue > 0 ? (
                  <View style={styles.priceWithDiscount}>
                    <Text style={styles.itemOriginalPrice}>
                      Rs {((product.originalPrice || 0) * (product.quantity || 1)).toFixed(2)}
                    </Text>
                    <Text style={styles.itemPrice}>
                      Rs {((product.price || 0) * (product.quantity || 1)).toFixed(2)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.itemPrice}>
                    Rs {((product.price || 0) * (product.quantity || 1)).toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
          );
        })}

        {item.items && item.items.length > 3 && (
          <Text style={styles.moreItemsText}>
            +{item.items.length - 3} more items
          </Text>
        )}
      </View>

      <View style={styles.priceBreakdown}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Subtotal:</Text>
          <Text style={styles.priceValue}>Rs {(item.subtotal || 0).toFixed(2)}</Text>
        </View>
        
        {item.deliveryFee && item.deliveryFee > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee:</Text>
            <Text style={styles.priceValue}>Rs {(item.deliveryFee || 0).toFixed(2)}</Text>
          </View>
        )}
        
        {item.orderDiscount && item.orderDiscount > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Order Discount:</Text>
            <Text style={styles.discountValue}>- Rs {(item.orderDiscount || 0).toFixed(2)}</Text>
          </View>
        )}
        
        <View style={styles.divider} />
        
        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>Rs {(item.total || 0).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.timeInfo}>
            <Clock size={12} color={colors.text.secondary} />
            <Text style={styles.timeText}>
              Est. delivery: {formatDate(new Date(Date.now() + 2 * 86400000))}
            </Text>
          </View>
        </View>

        {canCancel(item.status) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={(e) => {
              e.stopPropagation();
              handleCancelOrder(item);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              if (isLoggedIn && fetchOrders) {
                fetchOrders();
              }
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingBag size={64} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>
            Your order history will appear here
          </Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.continueButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <CancelOrderModal
        isVisible={isCancelModalVisible}
        onClose={() => {
          setIsCancelModalVisible(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background.white,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  testOrderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
  },
  testOrderButtonText: {
    color: colors.background.white,
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: colors.background.white,
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  listContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: colors.background.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  storeName: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  vendorSection: {
    marginBottom: 12,
  },
  storeDetails: {
    flex: 1,
  },
  storeLocation: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  addressText: {
    fontSize: 13,
    color: colors.text.secondary,
    flex: 1,
  },
  itemsContainer: {
    gap: 8,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemLeftSection: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  discountInfo: {
    marginTop: 2,
  },
  discountBadge: {
    fontSize: 11,
    color: colors.primary,
    backgroundColor: colors.background.main,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  itemPriceSection: {
    alignItems: 'flex-end',
  },
  priceWithDiscount: {
    alignItems: 'flex-end',
  },
  itemOriginalPrice: {
    fontSize: 12,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
    textAlign: 'right',
  },
  itemPrice: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  moreItemsText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
    marginTop: 5,
  },
  priceBreakdown: {
    backgroundColor: colors.background.main,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  priceValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  debugInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF3CD',
    borderRadius: 4,
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    fontFamily: 'monospace',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  footerLeft: {
    flex: 1,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF4D4F',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#FF4D4F',
    fontSize: 14,
    fontWeight: '500',
  },
  testButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.white,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
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
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    padding: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#FF4D4F',
  },
  confirmButtonText: {
    color: colors.background.white,
    fontSize: 14,
    fontWeight: '500',
  },
  cancelModalButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelModalButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
