import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartApi } from '../services/api';
import { useAuth } from '../auth/AuthContext';
import { Alert } from 'react-native';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cart from server
  const fetchCart = async () => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await cartApi.getCart();

      // Transform server response to match local cart structure
      const formattedItems = response.data.items.map((item) => {
        const vendorProduct = item.vendorProduct;
        return {
          id: vendorProduct._id,
          productId: vendorProduct.product._id,
          name: vendorProduct.product.title,
          price: extractPrice(vendorProduct.product.price),
          image: vendorProduct.product.imageUrl,
          quantity: item.quantity,
          vendor: {
            id: vendorProduct.vendor._id,
            name: vendorProduct.vendor.name,
            distance: calculateDistance(vendorProduct.vendor.location),
          },
          category: vendorProduct.product.category?.name || '',
          subCategory: vendorProduct.product.subCategory?.name || '',
        };
      });

      setCartItems(formattedItems);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to fetch cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Extract numeric price from string (e.g., "Rs. 825" -> 825)
  const extractPrice = (priceStr) => {
    if (!priceStr) return 0;
    if (typeof priceStr === 'number') return priceStr;

    const match = priceStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Placeholder for distance calculation - would use actual coordinates
  const calculateDistance = (location) => {
    return location?.formattedAddress ? '~1.2 km away' : 'Unknown distance';
  };

  // Add item to cart
  const addToCart = async (vendorProduct) => {
    if (!isLoggedIn) {
      throw new Error('Please login to add items to cart');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Add to server
      await cartApi.addToCart(vendorProduct._id, 1);

      // Update local state
      const existingItemIndex = cartItems.findIndex(
        (item) => item.id === vendorProduct.id
      );

      if (existingItemIndex !== -1) {
        // Item exists, update quantity
        const updatedItems = [...cartItems];
        updatedItems[existingItemIndex].quantity += 1;
        setCartItems(updatedItems);
      } else {
        // New item
        const newItem = {
          id: vendorProduct.id,
          productId: vendorProduct.productId || vendorProduct.id,
          name: vendorProduct.name || vendorProduct.title,
          price: extractPrice(vendorProduct.price),
          image: vendorProduct.image || vendorProduct.imageUrl,
          quantity: 1,
          vendor: vendorProduct.vendor || { name: 'Unknown Vendor' },
          category: vendorProduct.category || '',
          subCategory: vendorProduct.subCategory || '',
        };

        setCartItems([...cartItems, newItem]);
      }

      return true;
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Failed to add item to cart. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      return removeFromCart(itemId);
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update on server
      await cartApi.updateCartItem(itemId, quantity);

      // Update local state
      const updatedItems = cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );

      setCartItems(updatedItems);
    } catch (err) {
      console.error('Error updating cart:', err);
      setError('Failed to update cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    setIsLoading(true);
    setError(null);

    try {
      // Remove from server
      await cartApi.removeCartItem(itemId);

      // Update local state
      setCartItems(cartItems.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError('Failed to remove item from cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Clear on server
      await cartApi.clearCart();

      // Update local state
      setCartItems([]);
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Failed to clear cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate cart total
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  // Get cart item count
  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Fetch cart when auth state changes
  useEffect(() => {
    if (isLoggedIn) {
      fetchCart();
    } else {
      setCartItems([]);
    }
  }, [isLoggedIn]);

  const value = {
    cartItems,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
