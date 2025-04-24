import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../constants/colors';

const predefinedPacks = [
  {
    id: 1,
    name: 'Essential Pack',
    items: ['Atta', 'Rice', 'Dal', 'Oil'],
    price: 999,
    rating: 4.5,
  },
  {
    id: 2,
    name: 'Family Pack',
    items: ['Atta', 'Rice', 'Dal', 'Oil', 'Tea', 'Sugar'],
    price: 1499,
    rating: 4.8,
  },
  // Add more predefined packs as needed
];

const availableItems = [
  { id: 1, name: 'Atta', icon: '🌾', price: 250 },
  { id: 2, name: 'Rice', icon: '🍚', price: 150 },
  { id: 3, name: 'Cooking Oil', icon: '🫗', price: 180 },
  { id: 4, name: 'Ghee', icon: '🥄', price: 500 },
  { id: 5, name: 'Tea', icon: '🫖', price: 120 },
  { id: 6, name: 'Haldi', icon: '🟡', price: 80 },
  { id: 7, name: 'Cornflour', icon: '🌽', price: 60 },
  { id: 8, name: 'Toothpaste', icon: '🦷', price: 90 },
  { id: 9, name: 'Tissue paper', icon: '🧻', price: 45 },
  { id: 10, name: 'Soap', icon: '🧼', price: 40 },
];

export default function RationPacks() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const getTotalPrice = () => {
    return selectedItems.reduce((total, id) => {
      const item = availableItems.find(item => item.id === id);
      return total + (item ? item.price : 0);
    }, 0);
  };

  const handleCreateCustomPack = () => {
    if (selectedItems.length === 0) return;
    
    const selectedItemNames = selectedItems.map(id => 
      availableItems.find(item => item.id === id).name
    );
    
    router.push({
      pathname: '/ration-pack-details',
      params: { selectedItems: JSON.stringify(selectedItemNames) }
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.main,
    },
    header: {
      padding: 16,
      backgroundColor: colors.background.white,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    section: {
      padding: 16,
      backgroundColor: colors.background.white,
      marginVertical: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: colors.text.primary,
    },
    packsList: {
      gap: 12,
    },
    packCard: {
      backgroundColor: colors.background.white,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    packName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    packItems: {
      color: colors.text.secondary,
      marginTop: 4,
    },
    packPrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
      marginTop: 8,
    },
    rating: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    customizeSection: {
      padding: 16,
      backgroundColor: colors.background.white,
      marginTop: 8,
    },
    itemsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
    },
    itemButton: {
      width: '30%',
      aspectRatio: 1,
      backgroundColor: colors.background.white,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedItem: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
      borderWidth: 2,
    },
    itemIcon: {
      fontSize: 24,
      marginBottom: 4,
    },
    itemName: {
      fontSize: 12,
      textAlign: 'center',
      color: colors.text.primary,
    },
    itemPrice: {
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 2,
    },
    createButtonContainer: {
      padding: 16,
      backgroundColor: colors.background.white,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    totalLabel: {
      fontSize: 16,
      color: colors.text.primary,
    },
    totalPrice: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
    },
    createButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    createButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    addToCartButton: {
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
    },
    addToCartText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerText}>Ration Packs</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Selling Ration Packs</Text>
          <View style={styles.packsList}>
            {predefinedPacks.map(pack => (
              <View key={pack.id} style={styles.packCard}>
                <Text style={styles.packName}>{pack.name}</Text>
                <Text style={styles.packItems}>{pack.items.join(', ')}</Text>
                <Text style={styles.packPrice}>₹{pack.price}</Text>
                <View style={styles.rating}>
                  <MaterialIcons name="star" size={16} color="#FFD700" />
                  <Text style={{ marginLeft: 4, color: colors.text.secondary }}>{pack.rating}</Text>
                </View>
                <TouchableOpacity style={styles.addToCartButton}>
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.customizeSection}>
          <Text style={styles.sectionTitle}>Customize your Ration Pack</Text>
          <View style={styles.itemsGrid}>
            {availableItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemButton,
                  selectedItems.includes(item.id) && styles.selectedItem,
                ]}
                onPress={() => toggleItem(item.id)}
              >
                <Text style={styles.itemIcon}>{item.icon}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.createButtonContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalPrice}>₹{getTotalPrice()}</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.createButton,
            selectedItems.length === 0 && { opacity: 0.5 }
          ]}
          onPress={handleCreateCustomPack}
          disabled={selectedItems.length === 0}
        >
          <Text style={styles.createButtonText}>Create Custom Pack</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 