import { View, ScrollView, StyleSheet } from 'react-native';
import Banner from '../../components/Banner';
import ProductSection from '../../components/ProductSection';
import CategoryGrid from '../../components/CategoryGrid';
import { hotSaleProducts, rationPacks, categories } from '../../data/mockData';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
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
        
        <CategoryGrid categories={categories} />
        
        <View style={styles.spacer} />
      </ScrollView>
    </View>
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
  spacer: {
    height: 20,
  },
}); 