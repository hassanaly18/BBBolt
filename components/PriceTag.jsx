import { View, Text, StyleSheet } from 'react-native';

export default function PriceTag({ price, discount, originalPrice }) {
  const hasDiscount = discount && discount > 0;
  
  return (
    <View style={styles.container}>
      <Text style={styles.price}>${price.toFixed(2)}</Text>
      
      {hasDiscount && originalPrice && (
        <View style={styles.discountContainer}>
          <Text style={styles.originalPrice}>${originalPrice.toFixed(2)}</Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}%</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5D3FD3',
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 4,
  },
  discountBadge: {
    backgroundColor: '#FF4D4F',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
});