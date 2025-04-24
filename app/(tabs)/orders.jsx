import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Package, ChevronRight } from 'lucide-react-native';
import colors from '../constants/colors';
import { useState } from 'react';
import { useOrder } from '../context/OrderContext';

const CancelOrderModal = ({ isVisible, onClose, onConfirm }) => {
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
            Are you sure you want to cancel this order? This action cannot be undone.
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>No, Keep Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>Yes, Cancel Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, updateOrderStatus } = useOrder();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);

  const handleCancelOrder = (order) => {
    setSelectedOrder(order);
    setIsCancelModalVisible(true);
  };

  const handleConfirmCancel = () => {
    updateOrderStatus(selectedOrder.id, 'Cancelled');
    setIsCancelModalVisible(false);
    setSelectedOrder(null);
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => router.push(`/orders/${item.id}`)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.orderDate}>{item.date}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { 
            backgroundColor: 
              item.status === 'Delivered' ? '#4CAF50' : 
              item.status === 'Cancelled' ? '#FF4D4F' : 
              '#FFA726' 
          }
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.storeInfo}>
        <Package size={16} color={colors.primary} />
        <Text style={styles.storeName}>{item.store}</Text>
      </View>

      <View style={styles.itemsContainer}>
        {item.items.map((product, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {product.quantity}x {product.name}
            </Text>
            <Text style={styles.itemPrice}>₹{(product.price * product.quantity).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalText}>Total: ₹{item.total.toFixed(2)}</Text>
        {item.status === 'Processing' && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={(e) => {
              e.stopPropagation();
              handleCancelOrder(item);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders yet</Text>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => router.push('/shop')}
          >
            <Text style={styles.continueButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <CancelOrderModal
        isVisible={isCancelModalVisible}
        onClose={() => {
          setIsCancelModalVisible(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleConfirmCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: colors.background.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    marginBottom: 12,
  },
  storeName: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  itemsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  itemPrice: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
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
    paddingVertical: 8,
    borderRadius: 8,
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
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 