import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShoppingCart, Search, Menu } from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import theme from '../constants/theme';

export default function SharedHeader({ 
  title, 
  showBack = false, 
  showCart = false, 
  showSearch = false,
  showMenu = false,
  onMenuPress,
  backgroundColor = theme.colors.primary.main 
}) {
  const router = useRouter();
  const { cartItemsCount } = useCart();

  const handleBack = () => {
    router.back();
  };

  const handleCart = () => {
    router.push('/(tabs)/cart');
  };

  const handleSearch = () => {
    router.push('/search');
  };

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={backgroundColor} 
        translucent={false}
      />
      <View style={[styles.header, { backgroundColor }]}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
          )}
          
          {showMenu && (
            <TouchableOpacity style={styles.iconButton} onPress={onMenuPress}>
              <Menu size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerSection}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.rightSection}>
          {showSearch && (
            <TouchableOpacity style={styles.iconButton} onPress={handleSearch}>
              <Search size={22} color="white" />
            </TouchableOpacity>
          )}
          
          {showCart && (
            <TouchableOpacity style={styles.iconButton} onPress={handleCart}>
              <ShoppingCart size={22} color="white" />
              {cartItemsCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    paddingBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  cartBadge: {
    position: 'absolute',
    right: 2,
    top: 2,
    backgroundColor: theme.colors.secondary.main,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: theme.colors.secondary.contrastText,
    fontSize: 10,
    fontWeight: 'bold',
  },
}); 