import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import ProductCard from './ProductCard';

export default function ProductSection({ title, products, seeAllText, onSeeAllPress }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        
        {seeAllText && (
          <TouchableOpacity onPress={onSeeAllPress}>
            <Text style={styles.seeAll}>{seeAllText}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    color: '#5D3FD3',
  },
  scrollContent: {
    paddingLeft: 16,
    paddingRight: 4,
  },
});