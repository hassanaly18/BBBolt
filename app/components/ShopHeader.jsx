import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { 
  Filter, 
  Search, 
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../constants/theme';

const HEADER_HEIGHT = 150;
const HEADER_SCROLL_DISTANCE = 100;

export default function ShopHeader({
  searchQuery,
  onSearchChange,
  onFilterPress,
  onSortPress,
  scrollY,
  filterSummary,
  vendorCount = 0,
}) {
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

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary.main} />
      
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={[theme.colors.primary.main, theme.colors.primary.dark]}
          style={styles.gradient}
        >
          <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
            <Text style={styles.headerTitle}>Shop</Text>
            <Text style={styles.headerSubtitle}>
              Find the best vendors near you
            </Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      <View style={styles.searchAndFilterContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color={theme.colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vendors, categories..."
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>

        <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
          <SlidersHorizontal size={20} color={theme.colors.primary.main} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sortButton} onPress={onSortPress}>
          <ArrowUpDown size={20} color={theme.colors.primary.main} />
        </TouchableOpacity>
      </View>

      {/* Filter Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {vendorCount} vendor{vendorCount !== 1 ? 's' : ''} found
        </Text>
        {filterSummary !== 'No filters applied' && (
          <Text style={styles.filterSummaryText} numberOfLines={1}>
            Filters: {filterSummary}
          </Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  gradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  searchAndFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.background.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginTop: HEADER_HEIGHT,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.main,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  filterButton: {
    padding: 12,
    backgroundColor: theme.colors.background.main,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sortButton: {
    padding: 12,
    backgroundColor: theme.colors.background.main,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  filterSummaryText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
}); 