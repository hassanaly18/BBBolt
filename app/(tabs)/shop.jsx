import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Filter } from 'lucide-react-native';
import Banner from '../../components/Banner';
import ProductCard from '../../components/ProductCard';
import SortModal from '../../components/SortModal';
import colors from '../constants/colors';
import { products } from '../data/mockData';

const sortOptions = {
  popularity: 'Popularity',
  priceLowToHigh: 'Price: Low to High',
  priceHighToLow: 'Price: High to Low',
  newest: 'Newest First',
};

export default function ShopScreen() {
  const [sortBy, setSortBy] = useState('popularity');
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortedProducts, setSortedProducts] = useState(products);

  const handleSort = (sortType) => {
    setSortBy(sortType);
    let sorted = [...products];
    
    switch (sortType) {
      case 'priceLowToHigh':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'priceHighToLow':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        // Assuming newer items are at the end of the array
        sorted.reverse();
        break;
      default:
        // Default to original order (popularity)
        sorted = [...products];
    }
    
    setSortedProducts(sorted);
  };

  const renderHeader = () => (
    <>
      <Banner />
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowSortModal(true)}
        >
          <Filter size={20} color={colors.text.primary} />
          <Text style={styles.filterText}>Sort by: {sortOptions[sortBy]}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderItem = ({ item }) => (
    <View style={styles.productContainer}>
      <ProductCard product={item} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedProducts}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
      />

      <SortModal
        isVisible={showSortModal}
        onClose={() => setShowSortModal(false)}
        selectedSort={sortBy}
        onSelect={handleSort}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  listContent: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productContainer: {
    width: '48%', // Slightly less than 50% to account for spacing
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  filterText: {
    fontSize: 14,
    color: colors.text.primary,
  },
}); 