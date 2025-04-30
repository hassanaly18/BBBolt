import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Menu,
  ShoppingCart,
  Bell,
  ChevronLeft,
} from 'lucide-react-native';
import { useAuth } from '../app/auth/AuthContext';
import { useCart } from '../app/context/CartContext';
import theme from '../app/theme';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const Header = ({ onMenuPress, showBackButton, title, showSearch = false }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const { cartItems } = useCart();
  const cartItemCount = cartItems.length;

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlideY = useRef(new Animated.Value(-20)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;

  // Determine if we're on a detail page that needs a back button
  const isDetailPage =
    showBackButton ||
    pathname.includes('/product/') ||
    pathname.includes('/category/');

  // Determine title text
  const titleText = title || getTitleFromPath(pathname);

  // Back button handler
  const handleBack = () => {
    router.back();
  };

  // Badge animation when cart changes
  useEffect(() => {
    if (cartItemCount > 0) {
      Animated.sequence([
        Animated.timing(badgeScale, {
          toValue: 1.2,
          duration: 150,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(badgeScale, {
          toValue: 1,
          duration: 150,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      badgeScale.setValue(0);
    }
  }, [cartItemCount]);

  // Header entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlideY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerSlideY }],
          },
        ]}
      >
        <View style={styles.leftSection}>
          {isDetailPage ? (
            <AnimatedButton onPress={handleBack} animation={iconScale}>
              <ChevronLeft size={24} color={theme.colors.text.primary} />
            </AnimatedButton>
          ) : (
            <AnimatedButton onPress={onMenuPress} animation={iconScale}>
              <Menu size={24} color={theme.colors.text.primary} />
            </AnimatedButton>
          )}
        </View>

        <View style={styles.centerSection}>
          {showSearch ? (
            <Animated.View
              style={[
                styles.searchContainer,
                {
                  opacity: headerOpacity,
                  transform: [{ translateY: headerSlideY }],
                },
              ]}
            >
              <Search size={20} color={theme.colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor={theme.colors.text.secondary}
              />
            </Animated.View>
          ) : (
            <Animated.Text
              style={[
                styles.title,
                {
                  opacity: headerOpacity,
                  transform: [{ translateY: headerSlideY }],
                },
              ]}
            >
              {titleText}
            </Animated.Text>
          )}
        </View>

        <View style={styles.rightSection}>
          <AnimatedButton
            onPress={() => router.push('/cart')}
            animation={iconScale}
          >
            <ShoppingCart size={24} color={theme.colors.text.primary} />
            {cartItemCount > 0 && (
              <Animated.View
                style={[styles.badge, { transform: [{ scale: badgeScale }] }]}
              >
                <Text style={styles.badgeText}>
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </Text>
              </Animated.View>
            )}
          </AnimatedButton>

          {isLoggedIn && (
            <AnimatedButton
              onPress={() => router.push('/notifications')}
              animation={iconScale}
            >
              <Bell size={24} color={theme.colors.text.primary} />
            </AnimatedButton>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

// Reusable animated button component
const AnimatedButton = ({ children, onPress, animation }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.iconButton}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ scale: animation }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Helper function to determine title based on path
const getTitleFromPath = (pathname) => {
  if (pathname === '/') return 'Home';
  if (pathname === '/shop') return 'Shop';
  if (pathname === '/cart') return 'Shopping Cart';
  if (pathname === '/account') return 'Account';
  if (pathname === '/orders') return 'My Orders';
  if (pathname === '/ration-packs') return 'Ration Packs';
  if (pathname.includes('/auth/login')) return 'Login';
  if (pathname.includes('/auth/register')) return 'Register';

  // Default title
  return 'BuyBye';
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background.default,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 6,
    width: '100%',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 80,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  logo: {
    width: 100,
    height: 30,
    resizeMode: 'contain',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 2,
    position: 'relative',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.text.primary,
    paddingVertical: 0,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: theme.colors.primary.contrastText,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default Header;
