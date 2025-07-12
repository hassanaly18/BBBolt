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
  FlatList,
  Platform,
  Dimensions,
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
  Trash,
  Package,
  Star,
  Tag,
  Store,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../context/CartContext';
import { customerApi } from '../services/api';
import { colors } from '../constants/theme';
import theme from '../constants/theme';

const { width } = Dimensions.get('window');

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
  const [productIdsArray, setProductIdsArray] = useState(JSON.parse(productIds));

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

  // Update state when URL parameters change (when user goes back and selects new items)
  useEffect(() => {
    const newSelectedItems = JSON.parse(selectedItems);
    const newProductIds = JSON.parse(productIds);
    
    setSelectedItemsArray(newSelectedItems);
    setProductIdsArray(newProductIds);
    setSelectedVendor(null); // Clear vendor selection since items changed
  }, [selectedItems, productIds]);

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
      
      // Use the backend's availability data directly - it's already correct
      // The backend provides isAvailable flags and proper item matching
      packs = packs.map(pack => {
        // Ensure all requested items are present in the response
        const packWithCompleteItems = {...pack};
        const vendorItemTitles = pack.items.map(item => item.title);
        
        // Add any missing requested items as unavailable
        const missingItems = selectedItemsArray.filter(requestedItem => 
          !vendorItemTitles.some(vendorItem => 
            vendorItem.toLowerCase() === requestedItem.toLowerCase()
          )
        );
        
        if (missingItems.length > 0) {
          const missingItemsData = missingItems.map(item => ({
            title: item,
            isAvailable: false,
            originalPrice: 0,
            discountedPrice: 0,
            imageUrl: 'https://via.placeholder.com/60?text=N/A',
            productId: null,
            vendorProductId: null,
            discountType: null,
            discountValue: null
          }));
          
          packWithCompleteItems.items = [...pack.items, ...missingItemsData];
        }
        
        return packWithCompleteItems;
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
      Alert.alert('Error', 'Failed to fetch ration pack details');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVendor = (vendorPack) => {
    setSelectedVendor(vendorPack);
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
            imageUrl: item.imageUrl,
            price: item.originalPrice
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
          { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') }
        ]
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add items to cart. Please try again.');
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
            
            // Clear selected vendor since items changed
            setSelectedVendor(null);
            
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

  const renderFiltersHeader = () => (
    <View style={styles.filtersHeader}>
      <LinearGradient
        colors={theme.colors.gradients.card}
        style={styles.filtersHeaderGradient}
      >
        <View style={styles.filterOption}>
          <Text style={styles.filterLabel}>Search Radius</Text>
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
            <ChevronDown size={16} color={theme.colors.text.secondary} />
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
                    <Check size={16} color={theme.colors.primary.main} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.filterOption}>
          <Text style={styles.filterLabel}>Sort By</Text>
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
            <ArrowUpDown size={16} color={theme.colors.text.secondary} />
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
                    <Check size={16} color={theme.colors.primary.main} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
  
  // Render the ration pack items section
  const renderRationPackItems = () => (
    <View style={styles.section}>
      <LinearGradient
        colors={theme.colors.gradients.card}
        style={styles.sectionGradient}
      >
        <View style={styles.sectionHeader}>
          <Package size={20} color={theme.colors.primary.main} />
          <Text style={styles.sectionTitle}>Your Ration Pack</Text>
          <View style={styles.itemsCountBadge}>
            <Text style={styles.itemsCountText}>{selectedItemsArray.length}</Text>
          </View>
        </View>
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
      </LinearGradient>
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
        <LinearGradient
          colors={theme.colors.gradients.card}
          style={styles.sectionGradient}
        >
          <View style={styles.sectionHeader}>
            <Store size={20} color={theme.colors.primary.main} />
            <Text style={styles.sectionTitle}>Pack Details from {selectedVendor.vendor.name}</Text>
          </View>
          
          {/* Available Items */}
          <View style={styles.itemsSection}>
            <View style={styles.itemSectionHeader}>
              <Check size={16} color={theme.colors.success} />
              <Text style={styles.itemSectionTitle}>Available Items</Text>
              <View style={styles.availableCountBadge}>
                <Text style={styles.availableCountText}>{availableItems.length}</Text>
              </View>
            </View>
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
              <View style={styles.itemSectionHeader}>
                <AlertTriangle size={16} color={theme.colors.warning} />
                <Text style={styles.itemSectionTitle}>Unavailable Items</Text>
                <View style={styles.unavailableCountBadge}>
                  <Text style={styles.unavailableCountText}>{unavailableItems.length}</Text>
                </View>
              </View>
              {unavailableItems.map((item, index) => (
                <View key={`unavailable-${index}`} style={styles.unavailableRow}>
                  <View style={styles.itemRowLeft}>
                    <AlertTriangle size={20} color={theme.colors.error} />
                    <Text style={styles.unavailableText}>{item.title}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeItemButton}
                    onPress={() => removeUnavailableItem(item.title)}
                  >
                    <Trash size={18} color={theme.colors.error} />
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
              <AlertTriangle size={20} color={theme.colors.warning} />
              <Text style={styles.warningText}>
                {unavailableItems.length} item(s) not available from this vendor. 
                Only available items will be added to your cart.
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.colors.gradients.primary}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={theme.colors.primary.contrastText} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Package size={24} color={theme.colors.primary.contrastText} />
          <Text style={styles.headerText}>Custom Ration Pack</Text>
        </View>
      </LinearGradient>

      {!loading && renderFiltersHeader()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text style={styles.loadingText}>
              Finding the best deals from nearby vendors...
            </Text>
          </View>
        ) : (
          <>
            {renderRationPackItems()}

            {vendorRationPacks.length > 0 ? (
              <>
                <View style={styles.section}>
                  <LinearGradient
                    colors={theme.colors.gradients.card}
                    style={styles.sectionGradient}
                  >
                    <View style={styles.sectionHeader}>
                      <Store size={20} color={theme.colors.primary.main} />
                      <Text style={styles.sectionTitle}>Available Vendors</Text>
                      <View style={styles.vendorsCountBadge}>
                        <Text style={styles.vendorsCountText}>{vendorRationPacks.length}</Text>
                      </View>
                    </View>
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
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={selectedVendor?.vendor._id === vendorPack.vendor._id 
                              ? theme.colors.gradients.primary 
                              : theme.colors.gradients.card
                            }
                            style={styles.vendorCardGradient}
                          >
                            <View style={styles.vendorHeader}>
                              <View style={styles.vendorInfo}>
                                <Text style={[
                                  styles.vendorName,
                                  selectedVendor?.vendor._id === vendorPack.vendor._id && styles.selectedVendorText
                                ]}>{vendorPack.vendor.name}</Text>
                                <View style={styles.locationRow}>
                                  <MapPin size={14} color={theme.colors.text.secondary} />
                                  <Text style={[
                                    styles.locationText,
                                    selectedVendor?.vendor._id === vendorPack.vendor._id && styles.selectedVendorText
                                  ]}>
                                    {vendorPack.vendor.location?.formattedAddress || 'Location not available'}
                                  </Text>
                                </View>
                              </View>
                              {selectedVendor?.vendor._id === vendorPack.vendor._id && (
                                <View style={styles.selectedVendorBadge}>
                                  <Check size={16} color={theme.colors.primary.contrastText} />
                                </View>
                              )}
                            </View>
                            
                            <View style={styles.availabilityRow}>
                              <Text style={[
                                styles.availabilityText,
                                selectedVendor?.vendor._id === vendorPack.vendor._id && styles.selectedVendorText
                              ]}>
                                {availableItems.length} of {vendorPack.items.length} items available
                              </Text>
                              {unavailableItems.length > 0 && (
                                <View style={styles.warningTag}>
                                  <AlertTriangle size={12} color={theme.colors.warning} />
                                  <Text style={styles.warningTagText}>
                                    {unavailableItems.length} unavailable
                                  </Text>
                                </View>
                              )}
                            </View>
                            
                            <View style={styles.priceRow}>
                              {vendorPack.totalOriginalPrice > vendorPack.totalDiscountedPrice ? (
                                <>
                                  <Text style={[
                                    styles.originalPrice,
                                    selectedVendor?.vendor._id === vendorPack.vendor._id && styles.selectedVendorText
                                  ]}>
                                    Rs {vendorPack.totalOriginalPrice}
                                  </Text>
                                  <Text style={[
                                    styles.discountedPrice,
                                    selectedVendor?.vendor._id === vendorPack.vendor._id && styles.selectedVendorText
                                  ]}>
                                    Rs {vendorPack.totalDiscountedPrice}
                                  </Text>
                                </>
                              ) : (
                                <Text style={[
                                  styles.discountedPrice,
                                  selectedVendor?.vendor._id === vendorPack.vendor._id && styles.selectedVendorText
                                ]}>
                                  Rs {vendorPack.totalDiscountedPrice}
                                </Text>
                              )}
                            </View>
                            
                            {vendorPack.totalOriginalPrice > vendorPack.totalDiscountedPrice && (
                              <Text style={[
                                styles.savingsText,
                                selectedVendor?.vendor._id === vendorPack.vendor._id && styles.selectedSavingsText
                              ]}>
                                Save Rs {(vendorPack.totalOriginalPrice - vendorPack.totalDiscountedPrice).toFixed(2)}
                              </Text>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </LinearGradient>
                </View>

                {selectedVendor && renderVendorDetails()}
              </>
            ) : (
              <View style={styles.noResultsContainer}>
                <LinearGradient
                  colors={theme.colors.gradients.card}
                  style={styles.noResultsGradient}
                >
                  <Package size={64} color={theme.colors.primary.main} />
                  <Text style={styles.noResultsText}>
                    No vendors found with the requested items in {radius}km radius.
                  </Text>
                  <Text style={styles.noResultsSubtext}>
                    Try increasing the search radius or modifying your ration pack.
                  </Text>
                  <TouchableOpacity
                    style={styles.backToSelectionButton}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={theme.colors.gradients.primary}
                      style={styles.backToSelectionGradient}
                    >
                      <Text style={styles.backToSelectionText}>
                        Back to Selection
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {!loading && selectedVendor && (
        <View style={styles.addToCartContainer}>
          <LinearGradient
            colors={theme.colors.gradients.card}
            style={styles.addToCartGradient}
          >
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={handleAddToCart}
              disabled={!selectedVendor.items.some(i => i.isAvailable === true && i.vendorProductId && i.productId)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.colors.gradients.primary}
                style={styles.addToCartButtonGradient}
              >
                <ShoppingCart size={20} color={theme.colors.primary.contrastText} />
                <Text style={styles.addToCartText}>
                  Add {selectedVendor.items.filter(i => i.isAvailable === true && i.vendorProductId && i.productId).length} Available Items to Cart
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    ...theme.typography.h3,
    color: theme.colors.primary.contrastText,
    marginLeft: theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  section: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  sectionGradient: {
    padding: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  itemsCountBadge: {
    backgroundColor: theme.colors.secondary.main,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  itemsCountText: {
    ...theme.typography.caption,
    color: theme.colors.secondary.contrastText,
    fontWeight: '600',
  },
  vendorsCountBadge: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  vendorsCountText: {
    ...theme.typography.caption,
    color: theme.colors.primary.contrastText,
    fontWeight: '600',
  },
  vendorSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  itemsSection: {
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.white,
  },
  itemSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  itemSectionTitle: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  availableCountBadge: {
    backgroundColor: theme.colors.success + '20',
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  availableCountText: {
    ...theme.typography.caption,
    color: theme.colors.success,
    fontWeight: '600',
  },
  unavailableCountBadge: {
    backgroundColor: theme.colors.warning + '20',
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  unavailableCountText: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  itemRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
  },
  detailName: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
    flex: 1,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  detailPrice: {
    ...theme.typography.h5,
    color: theme.colors.primary.main,
  },
  detailOrigPrice: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  detailDiscPrice: {
    ...theme.typography.h5,
    color: theme.colors.primary.main,
  },
  unavailableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  unavailableText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  removeItemButton: {
    padding: theme.spacing.sm,
  },
  unavailableNote: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
  },
  noItemsText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.md,
  },
  totalLabel: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
  },
  totalPrice: {
    ...theme.typography.h3,
    color: theme.colors.primary.main,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.warning + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.md,
    alignItems: 'flex-start',
  },
  warningText: {
    ...theme.typography.body2,
    color: theme.colors.warning,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  noResultsContainer: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  noResultsGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  noResultsSubtext: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  backToSelectionButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  backToSelectionGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  backToSelectionText: {
    ...theme.typography.button,
    color: theme.colors.primary.contrastText,
  },
  vendorCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  selectedVendorCard: {
    ...theme.shadows.lg,
  },
  vendorCardGradient: {
    padding: theme.spacing.md,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  selectedVendorText: {
    color: theme.colors.primary.contrastText,
  },
  selectedVendorBadge: {
    backgroundColor: theme.colors.secondary.main,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  availabilityText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  warningTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '20',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  warningTagText: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  originalPrice: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textDecorationLine: 'line-through',
    marginRight: theme.spacing.sm,
  },
  discountedPrice: {
    ...theme.typography.h4,
    color: theme.colors.primary.main,
  },
  savingsText: {
    ...theme.typography.body2,
    color: theme.colors.success,
  },
  selectedSavingsText: {
    color: theme.colors.primary.contrastText,
  },
  filtersHeader: {
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'visible',
    ...theme.shadows.md,
    zIndex: 1000,
  },
  filtersHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  filterOption: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    position: 'relative',
    zIndex: 1002,
  },
  filterLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background.white,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    ...theme.shadows.xs,
  },
  dropdownButtonText: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
  },
  dropdownOptions: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background.white,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.lg,
    zIndex: 1001,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownOptionSelected: {
    backgroundColor: theme.colors.primary.main + '10',
  },
  dropdownOptionText: {
    ...theme.typography.body2,
    color: theme.colors.text.primary,
  },
  dropdownOptionTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  selectedItemCard: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedItemTitle: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
  },
  addToCartContainer: {
    padding: theme.spacing.md,
    ...theme.shadows.lg,
  },
  addToCartGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  addToCartButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  addToCartButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  addToCartText: {
    ...theme.typography.button,
    color: theme.colors.primary.contrastText,
    marginLeft: theme.spacing.sm,
  },
});