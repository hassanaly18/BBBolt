import { Stack } from 'expo-router';
import { useCallback } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import colors from './constants/colors';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import Header from '../components/Header';

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
    <CartProvider>
      <OrderProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
            <View style={styles.headerContainer}>
              <Header />
            </View>
            <View style={styles.content}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'none',
                }}
              >
                <Stack.Screen
                  name="(tabs)/product/[id]"
                  options={{
                    headerShown: false,
                  }}
                />
              </Stack>
            </View>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </OrderProvider>
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
    ...(Platform.OS === 'web' ? {
      maxWidth: 800,
      marginHorizontal: 'auto',
      height: '100vh',
    } : {}),
  },
  headerContainer: {
    ...(Platform.OS === 'web' ? {
      position: 'sticky',
      top: 0,
      zIndex: 100,
    } : {}),
  },
  content: {
    flex: 1,
  },
});