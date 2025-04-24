import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Banner from '../../components/Banner';
import CategoryGrid from '../../components/CategoryGrid';
import ProductSection from '../../components/ProductSection';
import { hotSaleProducts, rationPacks, categories } from '../data/mockData';
import colors from '../constants/colors';

export default function HomeScreen() {
  const router = useRouter();

  const handleSeeAll = (section) => {
    router.push('/shop');
  };

  const handleCategoryPress = (category) => {
    router.push(`/(tabs)/category/${category.id}`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Banner />

      <ProductSection
        title="Today's Hot Sale"
        products={hotSaleProducts}
        seeAllText="See All"
        onSeeAllPress={() => handleSeeAll('hotSale')}
      />

      <ProductSection
        title="Ration Packs"
        products={rationPacks}
        seeAllText="See All"
        onSeeAllPress={() => handleSeeAll('rationPacks')}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <TouchableOpacity onPress={() => router.push('/categories')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      <CategoryGrid categories={categories} onPress={handleCategoryPress} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
  },
}); 