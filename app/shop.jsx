import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

// Mock data for products
const products = [
  { id: 1, name: 'Potatoes 1kg', price: '₹45.00', image: 'https://5.imimg.com/data5/SELLER/Default/2021/1/KK/UV/OZ/3922575/fresh-potato.jpg' },
  { id: 2, name: 'Amans Cheese', price: '₹90.00', image: 'https://5.imimg.com/data5/SELLER/Default/2021/1/KK/UV/OZ/3922575/fresh-potato.jpg' },
  { id: 3, name: 'Soft Cooking Oil', price: '₹120.00', image: 'https://5.imimg.com/data5/SELLER/Default/2021/1/KK/UV/OZ/3922575/fresh-potato.jpg' },
  { id: 4, name: 'Item 7', price: '₹45.00', image: 'https://5.imimg.com/data5/SELLER/Default/2021/1/KK/UV/OZ/3922575/fresh-potato.jpg' },
  { id: 5, name: 'Ration Pack 3', price: '₹75.00', image: 'https://5.imimg.com/data5/SELLER/Default/2021/1/KK/UV/OZ/3922575/fresh-potato.jpg' },
  { id: 6, name: 'Item 8', price: '₹60.00', image: 'https://5.imimg.com/data5/SELLER/Default/2021/1/KK/UV/OZ/3922575/fresh-potato.jpg' },
  { id: 7, name: 'Item 12', price: '₹85.00', image: 'https://5.imimg.com/data5/SELLER/Default/2021/1/KK/UV/OZ/3922575/fresh-potato.jpg' },
  { id: 8, name: 'Item 11', price: '₹95.00', image: 'https://5.imimg.com/data5/SELLER/Default/2021/1/KK/UV/OZ/3922575/fresh-potato.jpg' },
  { id: 9, name: 'Item 10', price: '₹70.00', image: 'https://5.imimg.com/data5/SELLER/Default/2021/1/KK/UV/OZ/3922575/fresh-potato.jpg' },
];

const ProductCard = ({ product, onPress }) => (
  <TouchableOpacity style={styles.productCard} onPress={onPress}>
    <Image 
      source={{ uri: product.image }} 
      style={styles.productImage}
      defaultSource={require('@assets/images/icon.png')}
    />
    <View style={styles.productInfo}>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.productPrice}>{product.price}</Text>
    </View>
  </TouchableOpacity>
);

export default function ShopScreen() {
  const router = useRouter();

  const handleProductPress = (product) => {
    router.push({
      pathname: '/product/[id]',
      params: { id: product.id }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Compare prices of grocery items now!</Text>
      </View>

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        <FontAwesome name="filter" size={20} color="#666" />
        <Text style={styles.sortText}>Sort by: Popularity</Text>
      </View>

      {/* Product Grid */}
      <FlatList
        data={products}
        renderItem={({ item }) => (
          <ProductCard 
            product={item} 
            onPress={() => handleProductPress(item)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.productGrid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 8,
  },
  sortText: {
    color: '#666',
    fontSize: 14,
  },
  productGrid: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
}); 