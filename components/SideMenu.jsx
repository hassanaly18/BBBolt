import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Home, ShoppingBag, ShoppingCart, User, X } from 'lucide-react-native';
import colors from '../app/constants/colors';

export default function SideMenu({ isOpen, onClose }) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const menuItems = [
    { icon: Home, label: 'Home', route: '/' },
    { icon: ShoppingBag, label: 'Shop', route: '/shop' },
    { icon: ShoppingCart, label: 'Cart', route: '/cart' },
    { icon: User, label: 'Account', route: '/account' },
  ];

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#5D3FD3" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.menuItems}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                router.push(item.route);
                onClose();
              }}
            >
              <Icon size={24} color="#5D3FD3" />
              <Text style={styles.menuItemText}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 300,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
    zIndex: 1000,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItems: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#5D3FD3',
    fontWeight: '500',
  },
}); 