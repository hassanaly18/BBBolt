import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  User,
  ChevronRight,
  Package,
  Box,
  LogOut,
  LogIn,
  X,
  Settings,
  HelpCircle,
} from 'lucide-react-native';
import { useAuth } from '../app/auth/AuthContext';
import theme from '../app/theme';

const { width, height } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75; // 75% of screen width
const ANIMATION_DURATION = 250;

export default function SideMenu({ isOpen, onClose }) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { user, isLoggedIn, logout } = useAuth();

  useEffect(() => {
    if (isOpen) {
      // Animate the menu in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.5,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate the menu out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -MENU_WIDTH,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, slideAnim, opacityAnim]);

  const handleLogout = () => {
    onClose();
    logout();
  };

  // Common menu items for both authenticated and unauthenticated users
  const commonMenuItems = [
    { icon: Home, label: 'Home', route: '/' },
    { icon: ShoppingBag, label: 'Shop', route: '/shop' },
    { icon: Box, label: 'Ration Packs', route: '/ration-packs' },
    { icon: ShoppingCart, label: 'Cart', route: '/cart' },
  ];

  // Menu items for authenticated users
  const authMenuItems = [
    { icon: Package, label: 'My Orders', route: '/orders' },
    { icon: User, label: 'Profile', route: '/account' },
    { icon: Settings, label: 'Settings', route: '/settings' },
  ];

  const helpItems = [{ icon: HelpCircle, label: 'Support', route: '/support' }];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <Animated.View
          style={[styles.backdrop, { opacity: opacityAnim }]}
          pointerEvents={isOpen ? 'auto' : 'none'}
          onTouchStart={onClose}
        />
      )}

      {/* Menu */}
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateX: slideAnim }],
            width: MENU_WIDTH,
          },
        ]}
      >
        <View style={styles.menuContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>BBBolt</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Profile Section - Only visible when logged in */}
          {isLoggedIn && user && (
            <TouchableOpacity
              style={styles.profileSection}
              onPress={() => {
                router.push('/account');
                onClose();
              }}
            >
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitial}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
              <ChevronRight size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}

          {/* Menu Items */}
          <View style={styles.menuItemsContainer}>
            {/* Section Title */}
            <Text style={styles.sectionTitle}>MENU</Text>

            {/* Common menu items */}
            <View style={styles.menuItems}>
              {commonMenuItems.map((item, index) => {
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
                    <View style={styles.menuItemIcon}>
                      <Icon size={22} color={theme.colors.primary.main} />
                    </View>
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Auth-specific menu items */}
            {isLoggedIn && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                  ACCOUNT
                </Text>
                <View style={styles.menuItems}>
                  {authMenuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <TouchableOpacity
                        key={`auth-${index}`}
                        style={styles.menuItem}
                        onPress={() => {
                          router.push(item.route);
                          onClose();
                        }}
                      >
                        <View style={styles.menuItemIcon}>
                          <Icon size={22} color={theme.colors.primary.main} />
                        </View>
                        <Text style={styles.menuItemText}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Help section */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>HELP</Text>
            <View style={styles.menuItems}>
              {helpItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={`help-${index}`}
                    style={styles.menuItem}
                    onPress={() => {
                      router.push(item.route);
                      onClose();
                    }}
                  >
                    <View style={styles.menuItemIcon}>
                      <Icon size={22} color={theme.colors.primary.main} />
                    </View>
                    <Text style={styles.menuItemText}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Login/Logout button */}
          <View style={styles.footer}>
            {isLoggedIn ? (
              <TouchableOpacity
                style={styles.authButton}
                onPress={handleLogout}
              >
                <View style={[styles.authButtonIcon, styles.logoutIcon]}>
                  <LogOut size={20} color="#FFF" />
                </View>
                <Text style={styles.authButtonText}>Logout</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.authButton}
                onPress={() => {
                  router.push('/auth/login');
                  onClose();
                }}
              >
                <View style={[styles.authButtonIcon, styles.loginIcon]}>
                  <LogIn size={20} color="#FFF" />
                </View>
                <Text style={styles.authButtonText}>Login</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.appVersion}>BBBolt v1.0.0</Text>
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 999,
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: theme.colors.background.default,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  menuContent: {
    flex: 1,
    flexDirection: 'column',
    paddingTop: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  profileSection: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: theme.borderRadius.md,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.primary.contrastText,
  },
  profileInfo: {
    flex: 1,
    marginRight: 8,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  menuItemsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  menuItems: {
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.paper,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.paper,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    marginBottom: 16,
  },
  authButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  loginIcon: {
    backgroundColor: theme.colors.primary.main,
  },
  logoutIcon: {
    backgroundColor: '#FF4D4F',
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  appVersion: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 8,
  },
});
