import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ShoppingCart } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { customerApi ,cartApi} from '../services/api';
import colors from '../constants/colors';

export default function RationPackDetails() {
  const router = useRouter();
  const { selectedItems, productIds } = useLocalSearchParams();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [vendorRationPacks, setVendorRationPacks] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  
  const selectedItemsArray = JSON.parse(selectedItems);
  const productIdsArray = JSON.parse(productIds);

  useEffect(() => {
    fetchRationPacks();
  }, []);

  const fetchRationPacks = async () => {
    setLoading(true);
    try {
      // Call the API to fetch ration packs from nearby vendors
      const response = await customerApi.createRationPack({
        products: selectedItemsArray, // Pass the product titles
        // You can also pass location if needed
        // lat: latitude,
        // lng: longitude,
      });
      
      setVendorRationPacks(response.data.rationPacks);
      
      // Select the first vendor by default (usually the cheapest)
      if (response.data.rationPacks.length > 0) {
        setSelectedVendor(response.data.rationPacks[0]);
      }
    } catch (error) {
      console.error('Error fetching ration packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVendor = (vendor) => {
    setSelectedVendor(vendor);
  };
  const handleAddToCart = async () => {
    if (!selectedVendor) return;
    
    setLoading(true);
    try {
      // Add each item from the ration pack to cart
      for (const item of selectedVendor.items) {
        const vendorProductData = {
          _id: item.vendorProductId,
          discountType: item.discountType,
          discountValue: item.discountValue,
          product: {
            _id: item.productId,
            title: item.title,
            price: item.originalPrice,
            imageUrl: item.imageUrl
          },
          vendor: selectedVendor.vendor
        };
        
        // Add to cart with discount information preserved
        await addToCart(vendorProductData);
      }
      
      // Success message
      Alert.alert(
        'Added to Cart',
        `${selectedVendor.items.length} items from ${selectedVendor.vendor.name} added to your cart successfully!`,
        [
          { text: 'Continue Shopping', onPress: () => router.back() },
          { text: 'View Cart', onPress: () => router.push('/cart') }
        ]
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add items to cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Custom Ration Pack</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Finding the best deals from nearby vendors...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Selected Items</Text>
              {selectedItemsArray.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item}</Text>
                </View>
              ))}
            </View>

            {vendorRationPacks.length > 0 ? (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Available Vendors</Text>
                  {vendorRationPacks.map((vendorPack, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.vendorCard,
                        selectedVendor?.vendor._id === vendorPack.vendor._id && styles.selectedVendorCard,
                      ]}
                      onPress={() => handleSelectVendor(vendorPack)}
                    >
                      <Text style={styles.vendorName}>{vendorPack.vendor.name}</Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.originalPrice}>Rs {vendorPack.totalOriginalPrice}</Text>
                        <Text style={styles.discountedPrice}>Rs {vendorPack.totalDiscountedPrice}</Text>
                      </View>
                      <Text style={styles.savingsText}>
                        Save Rs {vendorPack.savings} ({vendorPack.savingsPercentage}%)
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {selectedVendor && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pack Details</Text>
                    {selectedVendor.items.map((item, index) => (
                      <View key={index} style={styles.detailRow}>
                        <Text style={styles.detailName}>{item.title}</Text>
                        <View>
                          <Text style={styles.detailOrigPrice}>Rs {item.originalPrice}</Text>
                          <Text style={styles.detailDiscPrice}>Rs {item.discountedPrice}</Text>
                        </View>
                      </View>
                    ))}
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={styles.totalPrice}>
                        Rs {selectedVendor.totalDiscountedPrice}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>
                  No vendors found with all the requested items.
                </Text>
                <TouchableOpacity
                  style={styles.backToSelectionButton}
                  onPress={() => router.back()}
                >
                  <Text style={styles.backToSelectionText}>
                    Back to Selection
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {!loading && selectedVendor && (
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <ShoppingCart size={20} color="#FFFFFF" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      )}
    </View>
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
    padding: 16,
    backgroundColor: colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
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
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemName: {
    fontSize: 16,
    color: colors.text.primary,
  },
  vendorCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedVendorCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  savingsText: {
    fontSize: 14,
    color: colors.success,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailName: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  detailOrigPrice: {
    fontSize: 12,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
    textAlign: 'right',
  },
  detailDiscPrice: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noResultsContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.background.white,
    margin: 16,
    borderRadius: 12,
  },
  noResultsText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  backToSelectionButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
  },
  backToSelectionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});