import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import colors from '../constants/colors';

export default function TabsLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView 
        style={{ 
          flex: 1,
          backgroundColor: colors.background.main,
          paddingTop: Platform.OS === 'web' ? 64 : 0,
          ...(Platform.OS === 'web' ? {
            maxWidth: 800,
            marginHorizontal: 'auto',
            height: '100vh',
          } : {}),
        }}
      >
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary.main,
            tabBarInactiveTintColor: colors.text.secondary,
            tabBarStyle: {
              borderTopWidth: 1,
              borderTopColor: colors.border.main,
              height: Platform.OS === 'web' ? 70 : 60,
              paddingBottom: Platform.OS === 'web' ? 12 : 8,
              paddingTop: Platform.OS === 'web' ? 12 : 8,
              ...(Platform.OS === 'web' ? {
                position: 'sticky',
                bottom: 0,
                maxWidth: 800,
                marginHorizontal: 'auto',
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
              } : {}),
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color }) => (
                <FontAwesome name="home" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="shop"
            options={{
              title: 'Shop',
              tabBarIcon: ({ color }) => (
                <FontAwesome name="shopping-bag" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="cart"
            options={{
              title: 'Cart',
              tabBarIcon: ({ color }) => (
                <FontAwesome name="shopping-cart" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="account"
            options={{
              title: 'Account',
              tabBarIcon: ({ color }) => (
                <FontAwesome name="user" size={24} color={color} />
              ),
            }}
          />
        </Tabs>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
} 