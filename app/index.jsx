import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import Header from '@components/Header';
import Banner from '@components/Banner';
import ProductSection from '@components/ProductSection';
import CategoryGrid from '@components/CategoryGrid';
import { hotSaleProducts, rationPacks, categories } from '@data/mockData';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Banner />
        
        <ProductSection 
          title="Today's Hot Sale" 
          products={hotSaleProducts} 
          seeAllText="See all" 
        />
        
        <ProductSection 
          title="Ration Packs" 
          products={rationPacks} 
          seeAllText="See all" 
        />
        
        <Text style={styles.sectionTitle}>Categories</Text>
        <CategoryGrid categories={categories} />
        
        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  spacer: {
    height: 20,
  },
}); 