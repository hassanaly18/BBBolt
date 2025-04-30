//C:\Users\faeiz\Desktop\BBBolt\app\context\OrderContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { orderApi } from '../services/api';
import { useAuth } from '../auth/AuthContext';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isLoggedIn } = useAuth();

  // Load orders when the user logs in
  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
    } else {
      // Clear orders when logged out
      setOrders([]);
    }
  }, [isLoggedIn]);

  // Fetch all orders for the current customer
  const fetchOrders = async () => {
    if (!isLoggedIn) return;

    try {
      setLoading(true);
      setError(null);

      const response = await orderApi.getOrders();

      // Transform orders to match the format expected by the frontend
      const transformedOrders =
        response.data.orders?.map((order) => ({
          id: order._id || order.id,
          orderNumber: order.orderNumber,
          date: new Date(order.createdAt || order.date)
            .toISOString()
            .split('T')[0],
          status: order.status,
          total: order.total,
          items: order.items.map((item) => ({
            id: item.product._id || item.product.id,
            name: item.product.title || item.product.name,
            price: item.price,
            quantity: item.quantity,
            image: item.product.imageUrl || item.product.image,
          })),
          store: order.items[0]?.vendor?.name || 'Unknown Store',
          deliveryAddress: order.deliveryAddress?.formattedAddress || '',
          contactPhone: order.contactPhone,
          paymentMethod: order.paymentMethod,
          customerNotes: order.customerNotes,
        })) || [];

      setOrders(transformedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
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
      const transformedOrder = {
        id: order._id || order.id,
        orderNumber: order.orderNumber,
        date: new Date(order.createdAt || order.date)
          .toISOString()
          .split('T')[0],
        status: order.status,
        total: order.total,
        items: order.items.map((item) => ({
          id: item.product._id || item.product.id,
          name: item.product.title || item.product.name,
          price: item.price,
          quantity: item.quantity,
          image: item.product.imageUrl || item.product.image,
        })),
        store: order.items[0]?.vendor?.name || 'Unknown Store',
        deliveryAddress: order.deliveryAddress?.formattedAddress || '',
        contactPhone: order.contactPhone,
        paymentMethod: order.paymentMethod,
        customerNotes: order.customerNotes,
      };

      return transformedOrder;
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.response?.data?.message || 'Failed to get order details');
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

      // Refresh orders after creating a new one
      await fetchOrders();

      return response.data;
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.response?.data?.message || 'Failed to create order');
      return null;
    } finally {
      setLoading(false);
    }
  };
  const createDirectOrder = async (orderData) => {
    if (!isLoggedIn) return null;

    try {
      setLoading(true);
      setError(null);

      // Use the direct order endpoint instead
      const response = await orderApi.createDirectOrder(orderData);

      // Refresh orders after creating a new one
      await fetchOrders();

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

      await orderApi.cancelOrder(orderId, { reason });

      // Update the local state to reflect the cancelled order
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: 'cancelled' } : order
        )
      );

      return true;
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err.response?.data?.message || 'Failed to cancel order');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get order tracking details
  const getOrderTracking = async (orderId) => {
    if (!isLoggedIn) return null;

    try {
      setLoading(true);
      setError(null);

      const response = await orderApi.getOrderTracking(orderId);
      return response.data;
    } catch (err) {
      console.error('Error getting tracking information:', err);
      setError(
        err.response?.data?.message || 'Failed to get tracking information'
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Legacy method for compatibility with the existing frontend
  const addOrder = (order) => {
    setOrders((prevOrders) => [...prevOrders, order]);
  };

  // Legacy method for compatibility with the existing frontend
  const updateOrderStatus = (orderId, status) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        loading,
        error,
        fetchOrders,
        getOrderById,
        createOrder,
        cancelOrder,
        getOrderTracking,
        createDirectOrder,
        // Legacy methods
        addOrder,
        updateOrderStatus,
      }}
    >
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

export default OrderProvider;
