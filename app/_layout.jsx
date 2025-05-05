//C:\Users\faeiz\Desktop\BBBolt\app\_layout.jsx
import { Stack } from 'expo-router';
import { useCallback, useState, useRef, useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotificationProvider } from './context/NotificationContext';
import {
  View,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Import all context providers
import { AuthProvider } from './auth/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';

// Import components
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import theme from './theme';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');
const MAX_WIDTH = 1200;

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    // Add your fonts here if needed
  });

  // Animation references
  const contentFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const splashVisible = useRef(true);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      // Start entrance animations
      Animated.parallel([
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(headerSlide, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
      ]).start(async () => {
        if (splashVisible.current) {
          await SplashScreen.hideAsync();
          splashVisible.current = false;
        }
      });
    }
  }, [fontsLoaded, fontError]);

  // Menu animation value
  const menuAnimValue = useRef(new Animated.Value(0)).current;

  // Toggle side menu with animation
  const toggleSideMenu = () => {
    setIsSideMenuOpen(!isSideMenuOpen);
    Animated.timing(menuAnimValue, {
      toValue: !isSideMenuOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  };

  // Close side menu with animation
  const closeSideMenu = () => {
    Animated.timing(menuAnimValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start(() => {
      setIsSideMenuOpen(false);
    });
  };

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
        <NotificationProvider>
          <OrderProvider>
    
            <SafeAreaProvider>
              <GestureHandlerRootView
                style={styles.rootContainer}
                onLayout={onLayoutRootView}
              >
                <Animated.View
                  style={[styles.mainContainer, { opacity: contentFade }]}
                >
                  <Animated.View
                    style={[
                      styles.headerContainer,
                      { transform: [{ translateY: headerSlide }] },
                    ]}
                  >
                    <Header onMenuPress={toggleSideMenu} />
                  </Animated.View>

                  <View style={styles.content}>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        animation:
                          Platform.OS === 'android' ? 'fade' : 'default',
                        contentStyle: {
                          backgroundColor: theme.colors.background.main,
                        },
                      }}
                    >
                      {/* Define the main stack screens */}
                      <Stack.Screen
                        name="(tabs)"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="auth"
                        options={{ headerShown: false }}
                      />
                      {/* Add cart and account as standalone screens */}
                      <Stack.Screen
                        name="cart"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="account"
                        options={{ headerShown: false }}
                      />
                    </Stack>
                  </View>
                </Animated.View>

                {/* Side Menu with animation */}
                <SideMenu
                  isOpen={isSideMenuOpen}
                  onClose={closeSideMenu}
                  animatedValue={menuAnimValue}
                />
              </GestureHandlerRootView>
            </SafeAreaProvider>
       
          </OrderProvider>
          </NotificationProvider>
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  mainContainer: {
    flex: 1,
    ...(Platform.OS === 'web'
      ? {
          maxWidth: MAX_WIDTH,
          marginHorizontal: 'auto',
          height: '100vh',
        }
      : {}),
  },
  headerContainer: {
    ...(Platform.OS === 'web'
      ? {
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }
      : {}),
    backgroundColor: theme.colors.background.default,
    shadowColor: theme.colors.primary.dark,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  content: {
    flex: 1,
  },
});
