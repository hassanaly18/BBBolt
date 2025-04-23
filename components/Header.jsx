import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Menu, Search, ShoppingCart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../app/context/CartContext';
import { useState } from 'react';
import SideMenu from './SideMenu';

export default function Header() {
  const router = useRouter();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => setIsMenuOpen(true)}
        >
          <Menu size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: 'https://img.icons8.com/color/96/grocery-bag.png' }} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.rightIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/search')}
          >
            <Search size={24} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
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
      </View>
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
  rightIcons: {
    flexDirection: 'row',
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
});