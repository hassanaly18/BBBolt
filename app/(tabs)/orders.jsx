//C:\Users\faeiz\Desktop\BBBolt\app\(tabs)\orders.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Package,
  ChevronRight,
  ShoppingBag,
  Clock,
  MapPin,
} from 'lucide-react-native';
import colors from '../constants/colors';
import { useOrder } from '../context/OrderContext';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotification } from '../context/NotificationContext';

const CancelOrderModal = ({ isVisible, onClose, onConfirm, isLoading }) => {

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Cancel Order</Text>
          <Text style={styles.modalText}>
            Are you sure you want to cancel this order? This action cannot be
            undone.
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>No, Keep Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.confirmButtonText}>Yes, Cancel Order</Text>
              )}
            </TouchableOpacity>
          
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function OrdersScreen() {
  const { sendLocalNotification } = useNotification();
  const router = useRouter();
  const { orders, cancelOrder, loading, error, fetchOrders } = useOrder();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Format date to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';

    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format status for display
  const formatStatus = (status) => {
    if (!status) return 'Processing';

    // Convert from backend status format to display format
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

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // Handle order cancellation
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
      console.error('Error cancelling order:', error);
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
  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push(`/orders/${item.id}`)}
      activeOpacity={0.7}
    >

<TouchableOpacity 
  style={styles.testButton}
  onPress={() => {
    console.log('Test notification button pressed');
    sendLocalNotification(
      'Test Notification',
      'This is a test notification',
      { test: true }
    );
  }}
>
  <Text style={styles.testButtonText}>Test Notification</Text>
</TouchableOpacity>


      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
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

      <View style={styles.storeInfo}>
        <Package size={16} color={colors.primary} />
        <Text style={styles.storeName}>{item.store}</Text>
      </View>

      {item.deliveryAddress && (
        <View style={styles.addressInfo}>
          <MapPin size={14} color={colors.text.secondary} />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.deliveryAddress}
          </Text>
        </View>
      )}

      <View style={styles.itemsContainer}>
        {item.items.slice(0, 3).map((product, index) => (
          // <View key={index} style={styles.itemRow}>
          //   <Text style={styles.itemName} numberOfLines={1}>
          //     {product.quantity}x {product.name}
          //   </Text>
          //   <Text style={styles.itemPrice}>
          //     Rs {(product.price * product.quantity).toFixed(2)}
          //   </Text>
          // </View>
          // Update the item rendering in orders.jsx
<View key={index} style={styles.itemRow}>
  <Text style={styles.itemName} numberOfLines={1}>
    {product.quantity}x {product.name}
  </Text>
  
  {product.discountType && product.discountValue ? (
    <View>
      <Text style={styles.itemOriginalPrice}>
        Rs {(product.originalPrice * product.quantity).toFixed(2)}
      </Text>
      <Text style={styles.itemPrice}>
        Rs {(product.price * product.quantity).toFixed(2)}
      </Text>
    </View>
  ) : (
    <Text style={styles.itemPrice}>
      Rs {(product.price * product.quantity).toFixed(2)}
    </Text>
  )}
</View>
        ))}

        {item.items.length > 3 && (
          <Text style={styles.moreItemsText}>
            +{item.items.length - 3} more items
          </Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.footerLeft}>
          <Text style={styles.totalText}>
            Total: Rs {item.total.toFixed(2)}
          </Text>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

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
  // Add these styles to your StyleSheet in orders.jsx
itemOriginalPrice: {
  fontSize: 12,
  color: colors.text.secondary,
  textDecorationLine: 'line-through',
  textAlign: 'right',
},
itemPrice: {
  fontSize: 14,
  color: colors.primary,
  fontWeight: '500',
  textAlign: 'right',
},
  storeName: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
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
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
    marginRight: 8,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 20,
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
