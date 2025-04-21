import { Stack } from 'expo-router';
import { useCallback } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Navbar from './components/Navbar';
import BottomTabs from './components/BottomTabs';
import { Slot } from 'expo-router';
import colors from './constants/colors';

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
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <Navbar />
        </SafeAreaView>
        <View style={styles.content}>
          <Slot />
        </View>
        <SafeAreaView edges={['bottom']} style={styles.safeBottom}>
          <BottomTabs />
        </SafeAreaView>
      </GestureHandlerRootView>
    </SafeAreaProvider>
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
  safeTop: {
    backgroundColor: colors.background.white,
    ...(Platform.OS === 'web' ? {
      position: 'sticky',
      top: 0,
      zIndex: 100,
    } : {}),
  },
  safeBottom: {
    backgroundColor: colors.background.white,
    ...(Platform.OS === 'web' ? {
      position: 'sticky',
      bottom: 0,
      zIndex: 100,
    } : {}),
  },
  content: {
    flex: 1,
  },
});