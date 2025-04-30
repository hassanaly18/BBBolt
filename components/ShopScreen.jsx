import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { Filter, Search, MapPin, ArrowDown } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Banner from '../../../components/Banner';
import VendorCard from '../../../components/VendorCard';
import SortModal from '../../../components/SortModal';
import { vendorApi } from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import theme from '../../theme';

const { width } = Dimensions.get('window');

const HEADER_HEIGHT = 150;
const HEADER_SCROLL_DISTANCE = 100;

const sortOptions = {
  distance: 'Nearest First',
  nameAsc: 'Name: A → Z',
  nameDesc: 'Name: Z → A',
};

export default function ShopScreen({ navigation }) {
  const [sortBy, setSortBy] = useState('distance');
  const [showSortModal, setShowSortModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const { location, getCurrentLocation } = useLocation();

  const scrollY = new Animated.Value(0);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_HEIGHT, 60],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    initializeScreen();

    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

  useEffect(() => {
    if (location) {
      fetchVendors();
    }
  }, [location]);

  useEffect(() => {
    if (vendors.length > 0) {
      const filtered = vendors.filter((vendor) =>
        vendor.name.toLowerCase().includes(searchQuery?.toLowerCase() || '')
      );
      setFilteredVendors(filtered);
    }
  }, [searchQuery, vendors]);

  const [searchQuery, setSearchQuery] = useState('');

  const initializeScreen = async () => {
    try {
      await getCurrentLocation();
    } catch (err) {
      console.error('Error initializing the screen:', err);
      setError('Unable to get your location. Please enable location services.');
      setLoading(false);
      // Still try to fetch all vendors
      fetchAllVendors();
    }
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!location) {
        throw new Error('Location not available');
      }

      const response = await vendorApi.getNearbyVendors({
        lng: location.longitude,
        lat: location.latitude,
      });

      setVendors(response.data);
      setFilteredVendors(response.data);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError(
        err.message === 'Location not available'
          ? 'Unable to get your location. Please enable location services.'
          : 'Failed to load vendors. Pull down to refresh.'
      );

      // Fall back to getting all vendors if location-based search fails
      fetchAllVendors();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAllVendors = async () => {
    try {
      const allVendorsResponse = await vendorApi.getAllVendors();
      setVendors(allVendorsResponse.data);
      setFilteredVendors(allVendorsResponse.data);
    } catch (fallbackErr) {
      console.error('Error fetching all vendors:', fallbackErr);
    }
  };

  const handleSort = (sortKey) => {
    setSortBy(sortKey);
    setShowSortModal(false);

    let sorted = [...filteredVendors];

    switch (sortKey) {
      case 'nameAsc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      // 'distance' should use the order returned from API
      default:
        break;
    }

    setFilteredVendors(sorted);
  };

  const retryWithLocation = async () => {
    try {
      setError(null);
      setLoading(true);
      await getCurrentLocation();
      fetchVendors();
    } catch (err) {
      console.error('Error getting location on retry:', err);
      setError('Unable to get your location. Please enable location services.');
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (location) {
      fetchVendors();
    } else {
      retryWithLocation();
    }
  }, [location]);

  const renderHeader = () => {
    return (
      <Animated.View
        style={[
          styles.header,
          { height: headerHeight, opacity: headerOpacity },
        ]}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Discover Shops</Text>
          <Text style={styles.headerSubtitle}>Find great vendors near you</Text>

          <View style={styles.locationBar}>
            {location ? (
              <View style={styles.locationInfo}>
                <MapPin size={16} color={theme.colors.secondary.main} />
                <Text style={styles.locationText}>Near your location</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={retryWithLocation}
                style={styles.locationButton}
              >
                <MapPin size={16} color={theme.colors.primary.contrastText} />
                <Text style={styles.locationButtonText}>
                  Find nearby vendors
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderSearchAndFilter = () => (
    <View style={styles.searchAndFilterContainer}>
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => {
          // Placeholder for future search functionality
          // You could navigate to a search screen or open a modal
          console.log('Search pressed');
        }}
      >
        <Search size={20} color={theme.colors.text.secondary} />
        <Text style={styles.searchText}>Search vendors...</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowSortModal(true)}
      >
        <Filter size={20} color={theme.colors.primary.main} />
      </TouchableOpacity>
    </View>
  );

  const renderSortIndicator = () => (
    <View style={styles.sortIndicator}>
      <Text style={styles.sortText}>Sorted by: </Text>
      <Text style={styles.sortValue}>{sortOptions[sortBy]}</Text>
      <ArrowDown size={14} color={theme.colors.primary.main} />
    </View>
  );

  const renderItem = ({ item, index }) => (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: 1,
          transform: [
            {
              translateY: scrollY.interpolate({
                inputRange: [-50, 0, index * 10 + 100],
                outputRange: [0, 0, 20],
                extrapolate: 'clamp',
              }),
            },
          ],
        },
      ]}
    >
      <VendorCard vendor={item} />
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {/* Empty state with no image dependency */}
      <View style={styles.emptyIconPlaceholder}>
        <MapPin size={48} color={theme.colors.text.disabled} />
      </View>
      <Text style={styles.emptyTitle}>No vendors found</Text>
      <Text style={styles.emptyText}>
        We couldn't find any vendors in your area. Try changing your location or
        check back later.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={retryWithLocation}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && vendors.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
          <Text style={styles.loadingText}>Discovering local vendors...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && vendors.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          {/* Error state with no image dependency */}
          <View style={styles.errorIconPlaceholder}>
            <MapPin size={48} color={theme.colors.error} />
          </View>
          <Text style={styles.errorTitle}>Location Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={retryWithLocation}
          >
            <Text style={styles.retryButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar barStyle="dark-content" />

      {renderHeader()}

      <Animated.FlatList
        data={filteredVendors}
        renderItem={renderItem}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Banner />
            {renderSearchAndFilter()}
            {filteredVendors.length > 0 && renderSortIndicator()}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.main]}
            tintColor={theme.colors.primary.main}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />

      <SortModal
        isVisible={showSortModal}
        onClose={() => setShowSortModal(false)}
        selectedSort={sortBy}
        onSelect={handleSort}
        options={sortOptions}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 0 : theme.spacing.md,
    paddingBottom: theme.spacing.md,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.colors.primary.contrastText,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.subtitle1.fontSize,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.md,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  locationText: {
    color: theme.colors.primary.contrastText,
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.body2.fontSize,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary.main,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  locationButtonText: {
    color: theme.colors.primary.main,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
  },
  searchAndFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginTop: HEADER_HEIGHT - 20,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.body2.fontSize,
  },
  filterButton: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sortIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sortText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text.secondary,
  },
  sortValue: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary.main,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  cardContainer: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl * 2,
  },
  emptyIconPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: theme.colors.primary.contrastText,
    fontSize: theme.typography.button.fontSize,
    fontWeight: theme.typography.button.fontWeight,
  },
});
