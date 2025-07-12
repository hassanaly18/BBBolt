import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default function PriceTag({ 
  price, 
  originalPrice, 
  currency = 'Rs', 
  size = 'medium',
  showDiscount = true 
}) {
  const discountPercentage = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const sizeStyles = {
    small: { fontSize: 14, originalFontSize: 12 },
    medium: { fontSize: 16, originalFontSize: 14 },
    large: { fontSize: 20, originalFontSize: 16 },
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.price, { fontSize: sizeStyles[size].fontSize }]}>
        {currency} {price}
      </Text>
      
      {originalPrice && originalPrice > price && (
        <View style={styles.originalPriceContainer}>
          <Text style={[
            styles.originalPrice, 
            { fontSize: sizeStyles[size].originalFontSize }
          ]}>
            {currency} {originalPrice}
          </Text>
          
          {showDiscount && discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {discountPercentage}% OFF
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontWeight: '700',
    color: colors.primary,
  },
  originalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  originalPrice: {
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
}); 