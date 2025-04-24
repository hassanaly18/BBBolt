import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ShoppingCart } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import colors from '../constants/colors';

export default function RationPackDetails() {
  const router = useRouter();
  const { selectedItems } = useLocalSearchParams();
  const { addToCart } = useCart();
  const selectedItemsArray = JSON.parse(selectedItems);

  // Define prices for items (you might want to move this to a central location)
  const itemPrices = {
    'Atta': 250,
    'Rice': 150,
    'Cooking Oil': 180,
    'Ghee': 500,
    'Tea': 120,
    'Haldi': 80,
    'Cornflour': 60,
    'Toothpaste': 90,
    'Tissue paper': 45,
    'Soap': 40,
  };

  const totalPrice = selectedItemsArray.reduce((total, item) => {
    return total + (itemPrices[item] || 0);
  }, 0);

  const handleAddToCart = () => {
    // Create a custom ration pack product
    const rationPackProduct = {
      id: `custom-pack-${Date.now()}`, // Generate unique ID
      name: 'Custom Ration Pack',
      price: totalPrice,
      items: selectedItemsArray.map(itemName => ({
        name: itemName,
        price: itemPrices[itemName]
      })),
      type: 'ration_pack', // Add type to distinguish from regular products
      image: 'https://img.icons8.com/color/96/grocery-bag.png', // You can change this to a custom image
    };

    // Add to cart
    addToCart(rationPackProduct);

    // Navigate to cart
    router.push('/cart');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Custom Ration Pack</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Items</Text>
          {selectedItemsArray.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item}</Text>
              <Text style={styles.itemPrice}>₹{itemPrices[item]}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalPrice}>₹{totalPrice}</Text>
        </View>

        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <ShoppingCart size={20} color="#FFFFFF" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.background.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemName: {
    fontSize: 16,
    color: colors.text.primary,
  },
  itemPrice: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  totalSection: {
    backgroundColor: colors.background.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 