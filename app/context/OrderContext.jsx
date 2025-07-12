//C:\Users\faeiz\Desktop\BBBolt\app\context\OrderContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { orderApi } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { useNotification } from './NotificationContext';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const { sendLocalNotification } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRefreshingFromNotification, setIsRefreshingFromNotification] = useState(false);
  const { isLoggedIn } = useAuth();

  const fetchOrders = useCallback(async () => {
    if (!isLoggedIn) {
      return;
    }
  
    try {
      setLoading(true);
      setError(null);

      const response = await orderApi.getOrders();
      const newOrders = response.data.orders || [];
      
      // Transform orders and recalculate prices
      const transformedOrders = response.data.orders?.map((order) => {
        // First, transform the items and calculate discounted prices
        const transformedItems = order.items.map(item => {
          const basePrice = item.price;
          let finalPrice = basePrice;

          if (item.discountType === 'percentage') {
            finalPrice = basePrice * (1 - item.discountValue / 100);
          } else if (item.discountType === 'amount') {
            finalPrice = Math.max(0, basePrice - item.discountValue);
          }

          return {
            id: item.product._id || item.product.id,
            name: item.product.title || item.product.name,
            originalPrice: parseFloat(basePrice.toFixed(2)),
            price: parseFloat(finalPrice.toFixed(2)),
            discountType: item.discountType || null,
            discountValue: item.discountValue || 0,
            quantity: item.quantity,
            image: item.product.imageUrl || item.product.image,
          };
        });

        // Calculate the correct subtotal based on discounted prices
        const correctSubtotal = transformedItems.reduce((sum, item) => {
          return sum + (item.price * item.quantity);
        }, 0);

        // Calculate the correct total (discounted subtotal + delivery fee - order discount)
        const deliveryFee = order.deliveryFee || 0;
        const orderDiscount = order.orderDiscount || 0;
        const correctTotal = correctSubtotal + deliveryFee - orderDiscount;

        return {
          id: order._id || order.id,
          orderNumber: order.orderNumber,
          date: new Date(order.createdAt || order.date)
            .toISOString()
            .split('T')[0],
          status: order.status,
          total: parseFloat(correctTotal.toFixed(2)),
          subtotal: parseFloat(correctSubtotal.toFixed(2)),
          deliveryFee: parseFloat(deliveryFee.toFixed(2)),
          orderDiscount: parseFloat(orderDiscount.toFixed(2)),
          items: transformedItems,
          store: order.items[0]?.vendor?.name || 'Unknown Store',
          storeLocation: order.items[0]?.vendor?.location?.formattedAddress || 
                        order.items[0]?.vendor?.location?.address || 
                        'Location not available',
          deliveryAddress: order.deliveryAddress?.formattedAddress || 
                          order.deliveryAddress?.address || 
                          order.deliveryAddress || '',
          contactPhone: order.contactPhone,
          paymentMethod: order.paymentMethod,
          customerNotes: order.customerNotes,
          estimatedDelivery: order.estimatedDelivery,
        };
      }) || [];
      setOrders(transformedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      // Only set error if it's not a 401 (unauthorized) error
      if (err.response?.status !== 401) {
        setError(err.response?.data?.message || 'Failed to load orders');
      } else {
        // For 401 errors, just log and clear orders
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, sendLocalNotification]);

  // Load orders when the user logs in
  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
    } else {
      // Clear orders when logged out
      setOrders([]);
    }
  }, [isLoggedIn, fetchOrders]);

  // Listen for push notification events to immediately refresh orders
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleOrderStatusChanged = async (eventData) => {
      console.log('Order status changed event received:', eventData);
      // Immediately fetch fresh orders when a push notification is received
      setIsRefreshingFromNotification(true);
      await fetchOrders();
      setIsRefreshingFromNotification(false);
    };

    // Add event listener for order status changes from push notifications using DeviceEventEmitter
    const subscription = DeviceEventEmitter.addListener('orderStatusChanged', handleOrderStatusChanged);

    return () => {
      // Remove the event listener
      subscription.remove();
    };
  }, [isLoggedIn, fetchOrders]);

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

  // Get a single order by ID
  const getOrderById = async (orderId) => {
    if (!isLoggedIn) return null;

    try {
      setLoading(true);
      setError(null);

      const response = await orderApi.getOrderById(orderId);

      // Transform the order to match the format expected by the frontend
      const order = response.data;
      
      // First, transform the items and calculate discounted prices
      const transformedItems = order.items.map(item => {
        const basePrice = item.price;
        let finalPrice = basePrice;

        if (item.discountType === 'percentage') {
          finalPrice = basePrice * (1 - item.discountValue / 100);
        } else if (item.discountType === 'amount') {
          finalPrice = Math.max(0, basePrice - item.discountValue);
        }

        return {
          id: item.product._id || item.product.id,
          name: item.product.title || item.product.name,
          originalPrice: parseFloat(basePrice.toFixed(2)),
          price: parseFloat(finalPrice.toFixed(2)),
          discountType: item.discountType || null,
          discountValue: item.discountValue || 0,
          quantity: item.quantity,
          image: item.product.imageUrl || item.product.image,
        };
      });

      // Calculate the correct subtotal based on discounted prices
      const correctSubtotal = transformedItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Calculate the correct total (discounted subtotal + delivery fee - order discount)
      const deliveryFee = order.deliveryFee || 0;
      const orderDiscount = order.orderDiscount || 0;
      const correctTotal = correctSubtotal + deliveryFee - orderDiscount;

      const transformedOrder = {
        id: order._id || order.id,
        orderNumber: order.orderNumber,
        date: new Date(order.createdAt || order.date)
          .toISOString()
          .split('T')[0],
        status: order.status,
        total: parseFloat(correctTotal.toFixed(2)),
        subtotal: parseFloat(correctSubtotal.toFixed(2)),
        deliveryFee: parseFloat(deliveryFee.toFixed(2)),
        orderDiscount: parseFloat(orderDiscount.toFixed(2)),
        items: transformedItems,
        store: order.items[0]?.vendor?.name || 'Unknown Store',
        storeLocation: order.items[0]?.vendor?.location?.formattedAddress || 
                      order.items[0]?.vendor?.location?.address || 
                      'Location not available',
        deliveryAddress: order.deliveryAddress?.formattedAddress || 
                        order.deliveryAddress?.address || 
                        order.deliveryAddress || '',
        contactPhone: order.contactPhone,
        paymentMethod: order.paymentMethod,
        customerNotes: order.customerNotes,
        estimatedDelivery: order.estimatedDelivery,
      };

      return transformedOrder;
    } catch (err) {
      console.error('Error fetching order:', err);
      // Only set error if it's not a 401 (unauthorized) error
      if (err.response?.status !== 401) {
        setError(err.response?.data?.message || 'Failed to get order details');
      } else {
        console.log('User not authenticated, cannot fetch order');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create a new order
  const createOrder = async (orderData) => {
    if (!isLoggedIn) return null;

    try {
      setLoading(true);
      setError(null);

      const response = await orderApi.createOrder(orderData);

      // Add the new order to the local state
      if (response.data && response.data.order) {
        const newOrder = response.data.order;
        setOrders(prevOrders => [newOrder, ...prevOrders]);
      }

      return response.data;
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.response?.data?.message || 'Failed to create order');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create a direct order
  const createDirectOrder = async (orderData) => {
    if (!isLoggedIn) return null;

    try {
      setLoading(true);
      setError(null);

      const response = await orderApi.createDirectOrder(orderData);

      // Add the new order to the local state
      if (response.data && response.data.order) {
        const newOrder = response.data.order;
        setOrders(prevOrders => [newOrder, ...prevOrders]);
      }

      return response.data;
    } catch (err) {
      console.error('Error creating direct order:', err);
      setError(err.response?.data?.message || 'Failed to create order');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Cancel an order
  const cancelOrder = async (orderId, reason) => {
    if (!isLoggedIn) return false;

    try {
      setLoading(true);
      setError(null);

      const response = await orderApi.cancelOrder(orderId, reason);

      if (response.data) {
        // Update the order status in local state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: 'cancelled' } : order
          )
        );
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err.response?.data?.message || 'Failed to cancel order');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get order tracking information
  const getOrderTracking = async (orderId) => {
    if (!isLoggedIn) return null;

    try {
      setLoading(true);
      setError(null);

      const response = await orderApi.getOrderTracking(orderId);
      return response.data;
    } catch (err) {
      console.error('Error fetching order tracking:', err);
      setError(err.response?.data?.message || 'Failed to get tracking info');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Add a new order to the state
  const addOrder = (order) => {
    setOrders(prevOrders => [order, ...prevOrders]);
  };

  // Update order status
  const updateOrderStatus = (orderId, status) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  const contextValue = {
    orders,
    loading,
    error,
    fetchOrders,
    getOrderById,
    createOrder,
    createDirectOrder,
    cancelOrder,
    getOrderTracking,
    addOrder,
    updateOrderStatus,
    isRefreshingFromNotification,
  };

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

// Default export for Expo Router compatibility
export default function OrderContextRoute() {
  return null;
}
