import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../context/CartContext';
import theme from '../constants/theme';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 88 : 56;

export default function Header({ onMenuPress }) {
  const { user } = useAuth();
  const { getCartCount } = useCart();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSearch = () => {
    router.push('/search');
  };

  const handleCart = () => {
    router.push('/(tabs)/cart');
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary.main} />
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onMenuPress}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="white" />
            <Text style={styles.locationText}>
              {user?.location?.formattedAddress || 'Select Location'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.cartButton}
            onPress={handleCart}
            activeOpacity={0.7}
          >
            <Ionicons name="bag-outline" size={24} color="white" />
            {getCartCount() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {getCartCount() > 99 ? '99+' : getCartCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.searchContainer}
          onPress={handleSearch}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
          <Text style={styles.searchPlaceholder}>
            Search for products, stores...
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.primary.main,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
    paddingBottom: 12,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  menuButton: {
    padding: 4,
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  locationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  cartButton: {
    padding: 4,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: theme.colors.secondary.main, // yellow from theme
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: theme.colors.secondary.contrastText,
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginLeft: 12,
  },
}); 