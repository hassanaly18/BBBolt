// Replace app/(tabs)/_layout.jsx with this:
import { Stack } from 'expo-router';
import { View, Platform } from 'react-native';
import theme from '../theme';

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background.main,
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="shop" />
      <Stack.Screen name="orders" />
    </Stack>
  );
}
