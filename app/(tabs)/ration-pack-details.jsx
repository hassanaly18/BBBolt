import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  FlatList
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  ShoppingCart,
  AlertTriangle,
  Check,
  ChevronDown,
  ArrowUpDown,
  MapPin,
  Trash
} from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import { customerApi } from '../services/api';
import colors from '../constants/colors';

export default function RationPackDetails() {
  const router = useRouter();
  const { selectedItems, productIds, radius: initialRadius, sortBy: initialSortBy } = useLocalSearchParams();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [vendorRationPacks, setVendorRationPacks] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showRadiusOptions, setShowRadiusOptions] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [radius, setRadius] = useState(parseInt(initialRadius) || 5);
  const [sortBy, setSortBy] = useState(initialSortBy || 'nearest');
  // Keep track of the original selected items
  const [selectedItemsArray, setSelectedItemsArray] = useState(JSON.parse(selectedItems));
  const productIdsArray = JSON.parse(productIds);

  // Predefined radius options
  const radiusOptions = [
    { value: 1, label: '1 km' },
    { value: 3, label: '3 km' },
    { value: 5, label: '5 km' },
    { value: 10, label: '10 km' },
    { value: 15, label: '15 km' },
    { value: 20, label: '20 km' },
    { value: 25, label: '25 km' },
    { value: 50, label: '50 km' },
  ];
  
  // Sorting options
  const sortOptions = {
    nearest: 'Nearest First',
    farthest: 'Farthest First',
    cheapest: 'Price: Low to High',
    expensive: 'Price: High to Low',
  };

  useEffect(() => {
    fetchRationPacks();
  }, [radius, sortBy, selectedItemsArray]);

  const fetchRationPacks = async () => {
    setLoading(true);
    try {
      // Call the API to fetch ration packs from nearby vendors with radius and sort
      const response = await customerApi.createRationPack({
        products: selectedItemsArray,
        radius: radius,
        sortBy: sortBy
      });
      
      let packs = response.data.rationPacks;
      
      // Sort the ration packs based on selected sort option
      if (sortBy === 'nearest') {
        // Already sorted by the API
      } else if (sortBy === 'farthest') {
        // Reverse the order since the API returns nearest first
        packs = packs.reverse();
      } else if (sortBy === 'cheapest') {
        packs.sort((a, b) => a.totalDiscountedPrice - b.totalDiscountedPrice);
      } else if (sortBy === 'expensive') {
        packs.sort((a, b) => b.totalDiscountedPrice - a.totalDiscountedPrice);
      }
      
      // Check if vendors have all selected products
      // If not, mark unavailable items
      packs = packs.map(pack => {
        // Check which items are available in this vendor
        const packWithAvailability = {...pack};
        const vendorItemTitles = pack.items.map(item => item.title.toLowerCase());
        
        // Go through all requested items and check which ones are missing
        const allRequested = [...selectedItemsArray];
        packWithAvailability.items = allRequested.map(requestedItem => {
          // Find matching item in vendor's inventory (case insensitive)
          const matchIndex = vendorItemTitles.findIndex(
            title => title.toLowerCase() === requestedItem.toLowerCase()
          );
          
          if (matchIndex >= 0) {
            // Item found in this vendor - mark as available and use the data
            return {
              ...pack.items[matchIndex],
              isAvailable: true
            };
          } else {
            // Item not found in this vendor - mark as unavailable
            return {
              title: requestedItem,
              isAvailable: false,
              originalPrice: 0,
              discountedPrice: 0,
              // Use placeholder image
              imageUrl: 'https://via.placeholder.com/60?text=N/A'
            };
          }
        });
        
        // Recalculate totals based on available items only
        const availableItems = packWithAvailability.items.filter(item => item.isAvailable);
        packWithAvailability.totalOriginalPrice = availableItems.reduce(
          (sum, item) => sum + item.originalPrice, 0
        );
        packWithAvailability.totalDiscountedPrice = availableItems.reduce(
          (sum, item) => sum + item.discountedPrice, 0
        );
        packWithAvailability.savings = packWithAvailability.totalOriginalPrice - packWithAvailability.totalDiscountedPrice;
        packWithAvailability.savingsPercentage = packWithAvailability.totalOriginalPrice > 0 
          ? (packWithAvailability.savings / packWithAvailability.totalOriginalPrice * 100).toFixed(2)
          : 0;
        
        return packWithAvailability;
      });
      
      setVendorRationPacks(packs);
      
      // Select the first vendor by default (based on the sort order)
      if (packs.length > 0) {
        setSelectedVendor(packs[0]);
      } else {
        setSelectedVendor(null);
      }
    } catch (error) {
      console.error('Error fetching ration packs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to remove unavailable item
  const removeUnavailableItem = (itemTitle) => {
    Alert.alert(
      'Remove Item',
      `Remove "${itemTitle}" from your ration pack?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          onPress: () => {
            // Remove from selected items array
            const updatedItems = selectedItemsArray.filter(
              title => title.toLowerCase() !== itemTitle.toLowerCase()
            );
            setSelectedItemsArray(updatedItems);
            
            // If no items left, go back
            if (updatedItems.length === 0) {
              Alert.alert(
                'No Items Left',
                'All items have been removed from your ration pack.',
                [
                  { text: 'OK', onPress: () => router.back() }
                ]
              );
            }
          }
        }
      ]
    );
  };

  const handleSelectVendor = (vendor) => {
    setSelectedVendor(vendor);
  };
  
  const handleAddToCart = async () => {
    if (!selectedVendor) return;
    
    setLoading(true);
    try {
      // Only include items that are explicitly marked as available and have valid IDs
      const availableItems = selectedVendor.items.filter(item => 
        item.isAvailable === true && 
        item.vendorProductId && 
        item.productId
      );
      
      if (availableItems.length === 0) {
        Alert.alert('No Available Items', 'There are no available items to add to cart from this vendor.');
        setLoading(false);
        return;
      }
      
      for (const item of availableItems) {
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
        `${availableItems.length} items from ${selectedVendor.vendor.name} added to your cart successfully!`,
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
  
  // Function to apply filters and sort
  const applyFilters = () => {
    fetchRationPacks();
  };
  
  // Renders filters header
  const renderFiltersHeader = () => (
    <View style={styles.filtersHeader}>
      <View style={styles.filterOption}>
        <Text style={styles.filterLabel}>Radius:</Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => {
            setShowRadiusOptions(!showRadiusOptions);
            setShowSortOptions(false);
          }}
        >
          <Text style={styles.dropdownButtonText}>
            {radiusOptions.find(opt => opt.value === radius)?.label || '5 km'}
          </Text>
          <ChevronDown size={16} color={colors.text.secondary} />
        </TouchableOpacity>
        
        {showRadiusOptions && (
          <View style={styles.dropdownOptions}>
            {radiusOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dropdownOption,
                  radius === option.value && styles.dropdownOptionSelected
                ]}
                onPress={() => {
                  setRadius(option.value);
                  setShowRadiusOptions(false);
                }}
              >
                <Text 
                  style={[
                    styles.dropdownOptionText,
                    radius === option.value && styles.dropdownOptionTextSelected
                  ]}
                >
                  {option.label}
                </Text>
                {radius === option.value && (
                  <Check size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      <View style={styles.filterOption}>
        <Text style={styles.filterLabel}>Sort by:</Text>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => {
            setShowSortOptions(!showSortOptions);
            setShowRadiusOptions(false);
          }}
        >
          <Text style={styles.dropdownButtonText}>
            {sortOptions[sortBy] || 'Nearest First'}
          </Text>
          <ArrowUpDown size={16} color={colors.text.secondary} />
        </TouchableOpacity>
        
        {showSortOptions && (
          <View style={styles.dropdownOptions}>
            {Object.entries(sortOptions).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.dropdownOption,
                  sortBy === key && styles.dropdownOptionSelected
                ]}
                onPress={() => {
                  setSortBy(key);
                  setShowSortOptions(false);
                }}
              >
                <Text 
                  style={[
                    styles.dropdownOptionText,
                    sortBy === key && styles.dropdownOptionTextSelected
                  ]}
                >
                  {label}
                </Text>
                {sortBy === key && (
                  <Check size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
  
  // Render the ration pack items section
  const renderRationPackItems = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Ration Pack</Text>
      <FlatList 
        data={selectedItemsArray}
        renderItem={({ item }) => (
          <View style={styles.selectedItemCard}>
            <View style={styles.selectedItemInfo}>
              <Text style={styles.selectedItemTitle}>{item}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item, index) => `selected-item-${index}`}
        scrollEnabled={false}
      />
    </View>
  );
  
  // Render the details for a specific vendor's ration pack
  const renderVendorDetails = () => {
    if (!selectedVendor) return null;
    
    // Check if there are any unavailable items
    const unavailableItems = selectedVendor.items.filter(item => item.isAvailable === false);
    const availableItems = selectedVendor.items.filter(item => item.isAvailable !== false);
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pack Details from {selectedVendor.vendor.name}</Text>
        
        {/* Available Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.itemSectionTitle}>Available Items</Text>
          {availableItems.length > 0 ? (
            availableItems.map((item, index) => (
              <View key={`available-${index}`} style={styles.detailRow}>
                <View style={styles.itemRowLeft}>
                  <Image 
                    source={{ uri: item.imageUrl || 'https://via.placeholder.com/40' }} 
                    style={styles.itemImage}
                  />
                  <Text style={styles.detailName}>{item.title}</Text>
                </View>
                <View style={styles.priceContainer}>
                  {item.discountedPrice < item.originalPrice ? (
                    <>
                      <Text style={styles.detailOrigPrice}>Rs {item.originalPrice}</Text>
                      <Text style={styles.detailDiscPrice}>Rs {item.discountedPrice}</Text>
                    </>
                  ) : (
                    <Text style={styles.detailPrice}>Rs {item.originalPrice}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>No available items found</Text>
          )}
        </View>
        
        {/* Unavailable Items - only show if there are any */}
        {unavailableItems.length > 0 && (
          <View style={styles.itemsSection}>
            <Text style={styles.itemSectionTitle}>Unavailable Items</Text>
            {unavailableItems.map((item, index) => (
              <View key={`unavailable-${index}`} style={styles.unavailableRow}>
                <View style={styles.itemRowLeft}>
                  <AlertTriangle size={20} color={colors.error} />
                  <Text style={styles.unavailableText}>{item.title}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeItemButton}
                  onPress={() => removeUnavailableItem(item.title)}
                >
                  <Trash size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <Text style={styles.unavailableNote}>
              These items are not available from this vendor
            </Text>
          </View>
        )}
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>
            Rs {selectedVendor.totalDiscountedPrice}
          </Text>
        </View>
        
        {unavailableItems.length > 0 && (
          <View style={styles.warningBox}>
            <AlertTriangle size={20} color={colors.warning} />
            <Text style={styles.warningText}>
              {unavailableItems.length} item(s) not available from this vendor. 
              Only available items will be added to your cart.
            </Text>
          </View>
        )}
      </View>
    );
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
            {renderFiltersHeader()}
            {renderRationPackItems()}

            {vendorRationPacks.length > 0 ? (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Available Vendors</Text>
                  <Text style={styles.vendorSubtitle}>
                    Found {vendorRationPacks.length} vendors in {radius}km radius
                  </Text>
                  
                  {vendorRationPacks.map((vendorPack, index) => {
                    // Count available and unavailable items
                    const availableItems = vendorPack.items.filter(item => item.isAvailable !== false);
                    const unavailableItems = vendorPack.items.filter(item => item.isAvailable === false);
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.vendorCard,
                          selectedVendor?.vendor._id === vendorPack.vendor._id && styles.selectedVendorCard,
                        ]}
                        onPress={() => handleSelectVendor(vendorPack)}
                      >
                        <Text style={styles.vendorName}>{vendorPack.vendor.name}</Text>
                        
                        <View style={styles.locationRow}>
                          <MapPin size={14} color={colors.text.secondary} />
                          <Text style={styles.locationText}>
                            {vendorPack.vendor.location.formattedAddress || 'Location not available'}
                          </Text>
                        </View>
                        
                        <View style={styles.availabilityRow}>
                          <Text style={styles.availabilityText}>
                            {availableItems.length}/{vendorPack.items.length} items available
                          </Text>
                          {unavailableItems.length > 0 && (
                            <View style={styles.warningTag}>
                              <AlertTriangle size={14} color={colors.warning} />
                              <Text style={styles.warningTagText}>
                                {unavailableItems.length} unavailable
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.priceRow}>
                          {vendorPack.totalOriginalPrice !== vendorPack.totalDiscountedPrice && (
                            <Text style={styles.originalPrice}>Rs {vendorPack.totalOriginalPrice}</Text>
                          )}
                          <Text style={styles.discountedPrice}>Rs {vendorPack.totalDiscountedPrice}</Text>
                        </View>
                        
                        {vendorPack.savings > 0 && (
                          <Text style={styles.savingsText}>
                            Save Rs {vendorPack.savings.toFixed(2)} ({vendorPack.savingsPercentage}%)
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedVendor && renderVendorDetails()}
              </>
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>
                  No vendors found with the requested items in {radius}km radius.
                </Text>
                <Text style={styles.noResultsSubtext}>
                  Try increasing the search radius or modifying your ration pack.
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
    disabled={!selectedVendor.items.some(i => i.isAvailable === true && i.vendorProductId && i.productId)}
  >
    <ShoppingCart size={20} color="#FFFFFF" />
    <Text style={styles.addToCartText}>
      Add {selectedVendor.items.filter(i => i.isAvailable === true && i.vendorProductId && i.productId).length} Available Items to Cart
    </Text>
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
  vendorSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  itemsSection: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
  },
  itemSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  detailName: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  detailOrigPrice: {
    fontSize: 12,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  detailDiscPrice: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  detailPrice: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  unavailableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unavailableText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 10,
  },
  unavailableNote: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 8,
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  warningText: {
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: 8,
    flex: 1,
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
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
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
  vendorCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.background.white,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginLeft: 4,
    flex: 1,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  availabilityText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  warningTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  warningTagText: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.background.white,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    zIndex: 10,
  },
  filterOption: {
    flex: 1,
    marginHorizontal: 4,
    position: 'relative',
  },
  filterLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  dropdownOptions: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionSelected: {
    backgroundColor: '#f6f0ff',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  dropdownOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  selectedItemCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  removeItemButton: {
    padding: 8,
  },
  noItemsText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12,
  }
});