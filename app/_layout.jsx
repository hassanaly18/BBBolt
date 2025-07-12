//C:\Users\faeiz\Desktop\BBBolt\app\_layout.jsx
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { useCallback } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Suppress specific warnings
LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
  'useInsertionEffect must not schedule updates',
  'Error fetching orders: [AxiosError: Request failed with status code 401]',
  'VirtualizedLists should never be nested inside plain ScrollViews with the same orientation'
]);

// Import all context providers
import { AuthProvider } from './auth/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { NotificationProvider } from './context/NotificationContext';

import theme from './constants/theme';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Add your fonts here if needed
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

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
                <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
                  <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
                    <StatusBar style="light" backgroundColor={theme.colors.primary.main} />
                    
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        animation: Platform.OS === 'android' ? 'fade' : 'default',
                        contentStyle: {
                          backgroundColor: theme.colors.background.main,
                        },
                      }}
                    >
                      {/* Main tab navigation */}
                      <Stack.Screen
                        name="(tabs)"
                        options={{ headerShown: false }}
                      />
                      
                      {/* Authentication screens */}
                      <Stack.Screen
                        name="auth"
                        options={{ headerShown: false }}
                      />
                      
                      {/* Modal screens */}
                      <Stack.Screen
                        name="(modals)"
                        options={{ 
                          headerShown: false,
                          presentation: 'modal' 
                        }}
                      />
                      
                      {/* Individual screens */}
                      <Stack.Screen name="category/[id]" options={{ headerShown: false }} />
                      <Stack.Screen name="messages" options={{ headerShown: false }} />
                      <Stack.Screen name="orders" options={{ headerShown: false }} />
                      <Stack.Screen name="settings" options={{ headerShown: false }} />
                      <Stack.Screen name="tracking" options={{ headerShown: false }} />
                    </Stack>
                  </SafeAreaView>
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.main,
  },
});
