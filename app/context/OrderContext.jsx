//C:\Users\faeiz\Desktop\BBBolt\app\context\OrderContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { orderApi } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { useNotification } from './NotificationContext';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const { sendLocalNotification } = useNotification();
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
// Add this to your OrderContext.jsx
useEffect(() => {
  // Only poll when logged in
  if (!isLoggedIn) return;
  
  console.log('Setting up order polling interval');
  
  // Set up interval to check for order updates every 15 seconds
  const intervalId = setInterval(() => {
    console.log('Polling for order updates...');
    fetchOrders();
  }, 15000); // 15 seconds
  
  // Clear interval on unmount or login state change
  return () => {
    console.log('Clearing order polling interval');
    clearInterval(intervalId);
  };
}, [isLoggedIn]);

  const fetchOrders = async () => {
    if (!isLoggedIn) return;
  
    try {
      setLoading(true);
      setError(null);
  
      // Store old order statuses before fetching new data
      const oldOrderStatuses = {};
      orders.forEach(order => {
        oldOrderStatuses[order.id] = order.status;
      });
      
      console.log('Old order statuses:', oldOrderStatuses);
      
      const response = await orderApi.getOrders();
      const newOrders = response.data.orders || [];
      
      console.log('Fetched new orders:', newOrders.length);
      
      // Check each new order for status changes
      for (const newOrder of newOrders) {
        const newOrderId = newOrder._id || newOrder.id;
        
        // Try to find the old order by ID or order number
        let matched = false;
        for (const oldOrderId in oldOrderStatuses) {
          if (
            oldOrderId === newOrderId || 
            orders.find(o => o.id === oldOrderId)?.orderNumber === newOrder.orderNumber
          ) {
            matched = true;
            const oldStatus = oldOrderStatuses[oldOrderId];
            
            // If status has changed
            if (oldStatus && oldStatus !== newOrder.status) {
              console.log(`Status changed for order #${newOrder.orderNumber}: ${oldStatus} -> ${newOrder.status}`);
              
              // Send a notification for the status change
              try {
                await sendLocalNotification(
                  'Order Status Updated',
                  `Order #${newOrder.orderNumber} is now ${formatStatus(newOrder.status)}`,
                  { type: 'order', orderId: newOrderId, status: newOrder.status }
                );
                console.log('Notification sent for status change');
              } catch (notifErr) {
                console.error('Failed to send notification for status change:', notifErr);
              }
            }
            break;
          }
        }
        
        if (!matched && orders.length > 0) {
          console.log(`New order discovered: #${newOrder.orderNumber}`);
        }
      }
  
      // Continue with your existing transformation code
      const transformedOrders = response.data.orders?.map((order) => ({
        id: order._id || order.id,
        orderNumber: order.orderNumber,
        date: new Date(order.createdAt || order.date)
          .toISOString()
          .split('T')[0],
        status: order.status,
        total: order.total,
// after
items: order.items.map(item => {
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
})
,
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
      const transformedOrder = {
        id: order._id || order.id,
        orderNumber: order.orderNumber,
        date: new Date(order.createdAt || order.date)
          .toISOString()
          .split('T')[0],
        status: order.status,
        total: order.total,
// after
items: order.items.map(item => {
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
}),
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
// Create a new order
// Updated createDirectOrder function in OrderContext.jsx
const createOrder = async (orderData) => {
  if (!isLoggedIn) return null;

  try {
    setLoading(true);
    setError(null);

    // Debug log incoming data
    console.log('Creating direct order with data:', JSON.stringify({
      items: orderData.items.map(i => ({
        price: i.price,
        quantity: i.quantity,
        totalPrice: i.totalPrice
      })),
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      total: orderData.total
    }));

    // Ensure all item properties are correctly set
    if (orderData.items) {
      orderData.items = orderData.items.map(item => ({
        ...item,
        // Ensure discount information is included
        discountType: item.discountType || null,
        discountValue: item.discountValue || 0,
        // Make sure price is the discounted price
        price: item.price,
        // Make sure totalPrice is calculated using the discounted price
        totalPrice: item.price * item.quantity
      }));
    }

    // Recalculate subtotal to ensure it's based on the discounted prices
    const calculatedSubtotal = orderData.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    
    // Recalculate total
    const calculatedTotal = calculatedSubtotal + orderData.deliveryFee;
    
    // Override the values to ensure they're correct
    orderData.subtotal = calculatedSubtotal;
    orderData.total = calculatedTotal;

    console.log('Verified order data:', {
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      total: orderData.total
    });

    // Use the direct order endpoint
    const response = await orderApi.createDirectOrder(orderData);
    sendLocalNotification(
      'Order Placed Successfully',
      `Your order #${response.data.orderNumber} has been placed.`,
      { type: 'order', orderId: response.data._id }
    );
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
// Modified createDirectOrder function for OrderContext.jsx
// Updated createDirectOrder function in OrderContext.jsx
const createDirectOrder = async (orderData) => {
  if (!isLoggedIn) return null;

  try {
    setLoading(true);
    setError(null);

    // Debug log incoming data
    console.log('Creating direct order with data:', JSON.stringify({
      items: orderData.items.map(i => ({
        price: i.price,
        quantity: i.quantity,
        totalPrice: i.totalPrice
      })),
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      total: orderData.total
    }));

    // Ensure all item properties are correctly set
    if (orderData.items) {
      orderData.items = orderData.items.map(item => ({
        ...item,
        // Ensure discount information is included
        discountType: item.discountType || null,
        discountValue: item.discountValue || 0,
        // Make sure price is the discounted price
        price: item.price,
        // Make sure totalPrice is calculated using the discounted price
        totalPrice: item.price * item.quantity
      }));
    }

    // Recalculate subtotal to ensure it's based on the discounted prices
    const calculatedSubtotal = orderData.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    
    // Recalculate total
    const calculatedTotal = calculatedSubtotal + orderData.deliveryFee;
    
    // Override the values to ensure they're correct
    orderData.subtotal = calculatedSubtotal;
    orderData.total = calculatedTotal;

    console.log('Verified order data:', {
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      total: orderData.total
    });

    // Use the direct order endpoint
    const response = await orderApi.createDirectOrder(orderData);
    console.log('Direct order created, response:', response.data);
    
    // Explicitly send local notification here
    try {
      await sendLocalNotification(
        'Order Placed Successfully',
        `Your order #${response.data.orderNumber || 'new'} has been placed.`,
        { type: 'order', orderId: response.data._id || response.data.id }
      );
      console.log('Local notification sent for direct order');
    } catch (notifErr) {
      console.error('Failed to send notification for direct order:', notifErr);
    }
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
      
      // Send a local notification for cancelled orders
      try {
        await sendLocalNotification(
          'Order Cancelled',
          'Your order has been cancelled successfully.',
          { type: 'order', orderId: orderId, status: 'cancelled' }
        );
        console.log('Local notification sent for order cancellation');
      } catch (notifErr) {
        console.error('Failed to send notification for order cancellation:', notifErr);
      }
  
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
