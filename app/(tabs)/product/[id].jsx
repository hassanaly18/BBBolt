import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ShoppingCart } from 'lucide-react-native';
import { hotSaleProducts, rationPacks } from '@/data/mockData';
import PriceTag from '@/components/PriceTag';
import { useCart } from '../../context/CartContext';

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, getCartCount } = useCart();
  const cartCount = getCartCount();
  
  // Combine all products to find the one we're looking for
  const allProducts = [...hotSaleProducts, ...rationPacks];
  const product = allProducts.find(p => p.id === id);

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Product not found</Text>
      </SafeAreaView>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => router.push('/cart')}
        >
          <ShoppingCart size={24} color="#333" />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.image }} 
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.description}>{product.description}</Text>
          
          <View style={styles.priceSection}>
            <PriceTag 
              price={product.price}
              discount={product.discount}
              originalPrice={product.originalPrice}
            />
            <Text style={styles.stock}>In Stock: At 3 Stores</Text>
          </View>

          <View style={styles.compareSection}>
            <Text style={styles.compareTitle}>Price Comparison</Text>
            <View style={styles.storeList}>
              <StorePrice 
                storeName="Store A" 
                price={product.price} 
                distance="2.5 km"
              />
              <StorePrice 
                storeName="Store B" 
                price={product.price + 0.50} 
                distance="3.2 km"
              />
              <StorePrice 
                storeName="Store C" 
                price={product.price + 1.00} 
                distance="4.1 km"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.compareButton}>
          <Text style={styles.compareButtonText}>+ Compare</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StorePrice({ storeName, price, distance }) {
  return (
    <View style={styles.storePriceContainer}>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{storeName}</Text>
        <Text style={styles.storeDistance}>{distance}</Text>
      </View>
      <Text style={styles.storePrice}>${price.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cartButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#5D3FD3',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  priceSection: {
    marginBottom: 24,
  },
  stock: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 8,
  },
  compareSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
  },
  compareTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  storeList: {
    gap: 12,
  },
  storePriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '500',
  },
  storeDistance: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  storePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3FD3',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  compareButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#F0E6FF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compareButtonText: {
    color: '#5D3FD3',
    fontSize: 16,
    fontWeight: '600',
  },
  addToCartButton: {
    flex: 2,
    height: 48,
    backgroundColor: '#5D3FD3',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});