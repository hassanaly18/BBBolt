import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../components/ProductCard';
import { products, categories } from '../data/mockData';
import { colors } from '../constants/theme';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [sortedProducts, setSortedProducts] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const scrollY = new Animated.Value(0);

  // Get category details
  const category = categories.find(cat => cat.id === id);

  // Filter products based on category
  useEffect(() => {
    const categoryProducts = products.filter(product => 
      product.category.toLowerCase() === id.toLowerCase()
    );
    setSortedProducts(categoryProducts);
  }, [id]);

  const filters = ['all', 'popular', 'new', 'price'];

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const handleBack = () => {
    router.back();
  };

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
      <Text style={styles.categoryTitle}>{category?.name || id}</Text>
      <Text style={styles.productCount}>{sortedProducts.length} Products</Text>
      
      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter && styles.filterTextActive
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: colors.background.main },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.container}>
        <Animated.FlatList
          data={sortedProducts}
          renderItem={({ item }) => (
            <View style={styles.productWrapper}>
              <ProductCard product={item} />
            </View>
          )}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.productList}
          ListHeaderComponent={renderHeader}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products found in this category</Text>
            </View>
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  header: {
    padding: 16,
    backgroundColor: colors.background.main,
  },
  categoryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  productCount: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  filterTextActive: {
    color: colors.background.main,
  },
  productList: {
    padding: 8,
  },
  productWrapper: {
    flex: 1,
    padding: 8,
    maxWidth: '50%',
  },
  backButton: {
    marginLeft: 16,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
}); 