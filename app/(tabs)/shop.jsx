import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Modal,
  ScrollView,
  Text,
} from 'react-native';
import { 
  Check,
  X,
  ChevronDown,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import components
import ShopHeader from '../components/ShopHeader';
import VendorCard from '../components/VendorCard';

// Import hooks
import { useShopData } from '../hooks/useShopData';
import { useShopFilters, radiusOptions, sortOptions } from '../hooks/useShopFilters';

// Import theme
import theme from '../constants/theme';

export default function ShopScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Modal states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showRadiusOptions, setShowRadiusOptions] = useState(false);

  // Custom hooks
  const {
    vendors,
    loading,
    error,
    refreshing,
    initializeScreen,
    fetchVendors,
    onRefresh,
    retryWithLocation,
  } = useShopData();

  const {
    filteredVendors,
    searchQuery,
    selectedRadius,
    sortBy,
    setSearchQuery,
    setSelectedRadius,
    setSortBy,
    resetFilters,
    getFilterSummary,
  } = useShopFilters(vendors);

  // Initialize screen
  useEffect(() => {
    initializeScreen();
  }, [initializeScreen]);

  // Fetch vendors when radius changes
  useEffect(() => {
    if (vendors.length > 0) {
      fetchVendors(selectedRadius);
    }
  }, [selectedRadius]);

  // Handle refresh
  const handleRefresh = () => {
    onRefresh(selectedRadius);
  };

// Apply filters and close modal
const applyFilters = () => {
  setShowFilterModal(false);
  };

  // Handle sort selection
  const handleSortSelect = (sortKey) => {
    setSortBy(sortKey);
    setShowSortModal(false);
  };

  // Render vendor item
  const renderVendor = ({ item }) => (
    <VendorCard vendor={item} />
  );

  // Render filter modal
  const renderFilterModal = () => (
      <Modal
        visible={showFilterModal}
        animationType="slide"
      presentationStyle="pageSheet"
      >
      <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
          <Text style={styles.modalTitle}>Filters</Text>
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
            </View>

        <ScrollView style={styles.modalContent}>
          {/* Search Radius */}
              <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Search Radius</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowRadiusOptions(!showRadiusOptions)}
            >
              <Text style={styles.dropdownText}>
                {radiusOptions.find(r => r.value === selectedRadius)?.label || '5 km'}
              </Text>
              <ChevronDown size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
            
            {showRadiusOptions && (
              <View style={styles.optionsContainer}>
                {radiusOptions.map((option) => (
                    <TouchableOpacity
                    key={option.value}
                      style={[
                      styles.option,
                      selectedRadius === option.value && styles.selectedOption,
                      ]}
                      onPress={() => {
                      setSelectedRadius(option.value);
                      setShowRadiusOptions(false);
                      }}
                    >
                      <Text
                        style={[
                        styles.optionText,
                        selectedRadius === option.value && styles.selectedOptionText,
                        ]}
                      >
                      {option.label}
                      </Text>
                    {selectedRadius === option.value && (
                      <Check size={16} color={theme.colors.primary.main} />
                    )}
                    </TouchableOpacity>
                  ))}
              </View>
            )}
              </View>

        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
                </View>
      </SafeAreaView>
    </Modal>
  );

  // Render sort modal
  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowSortModal(false)}>
            <X size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
          <Text style={styles.modalTitle}>Sort by</Text>
          <View style={{ width: 60 }} />
        </View>
                  
        <ScrollView style={styles.modalContent}>
                      {Object.entries(sortOptions).map(([key, label]) => (
                        <TouchableOpacity
                          key={key}
                          style={[
                styles.sortOption,
                sortBy === key && styles.selectedSortOption,
                          ]}
              onPress={() => handleSortSelect(key)}
                        >
                          <Text 
                            style={[
                  styles.sortOptionText,
                  sortBy === key && styles.selectedSortOptionText,
                            ]}
                          >
                            {label}
                          </Text>
                          {sortBy === key && (
                <Check size={20} color={theme.colors.primary.main} />
                          )}
                        </TouchableOpacity>
                      ))}
            </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No vendors found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search filters or location
      </Text>
      {error && (
        <TouchableOpacity style={styles.retryButton} onPress={retryWithLocation}>
          <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
      )}
            </View>
  );

  // Render loading state
  if (loading && vendors.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={styles.loadingText}>Finding vendors near you...</Text>
          </View>
    );
  }

  return (
    <View style={styles.container}>
      <ShopHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterPress={() => setShowFilterModal(true)}
        onSortPress={() => setShowSortModal(true)}
        scrollY={scrollY}
        filterSummary={getFilterSummary()}
        vendorCount={filteredVendors.length}
      />

      <FlatList
        data={filteredVendors}
        renderItem={renderVendor}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary.main]}
            tintColor={theme.colors.primary.main}
          />
        }
        ListEmptyComponent={renderEmptyState}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      {renderFilterModal()}
      {renderSortModal()}
        </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.main,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  resetText: {
    fontSize: 16,
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterSection: {
    marginVertical: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.colors.background.main,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  optionsContainer: {
    marginTop: 8,
    backgroundColor: theme.colors.background.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedOption: {
    backgroundColor: theme.colors.primary.main + '10',
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  selectedOptionText: {
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  applyButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedSortOption: {
    backgroundColor: theme.colors.primary.main + '10',
  },
  sortOptionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  selectedSortOptionText: {
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
});