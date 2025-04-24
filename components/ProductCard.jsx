import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../app/context/CartContext';

const fallbackImage = 'https://images.pexels.com/photos/2286776/pexels-photo-2286776.jpeg';

export default function ProductCard({ product }) {
  const router = useRouter();
  const { addToCart } = useCart();

  const handlePress = () => {
    router.push(`/product/${product.id}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleImageError = (e) => {
    // If the image fails to load, it will use the fallback image
    e.target.src = fallbackImage;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: product.image || fallbackImage }} 
          style={styles.image} 
          resizeMode="cover"
          defaultSource={require('../assets/images/icon.png')}
        />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.store} numberOfLines={1}>{product.store}</Text>
        
        <View style={styles.priceContainer}>
          <View>
            <Text style={styles.price}>₹{product.price.toFixed(2)}</Text>
            {product.marketPrice && (
              <Text style={styles.marketPrice}>₹{product.marketPrice.toFixed(2)}</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddToCart}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    height: 140,
    width: '100%',
    backgroundColor: '#F9F9F9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  store: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5D3FD3',
  },
  marketPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  addButton: {
    width: 24,
    height: 24,
    backgroundColor: '#5D3FD3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
});