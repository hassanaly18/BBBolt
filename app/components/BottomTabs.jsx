import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import theme from '../constants/theme';

const { width } = Dimensions.get('window');
const TAB_WIDTH = width / 4; // 4 tabs

export default function BottomTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const indicatorPosition = useSharedValue(0);

  const tabs = [
    {
      name: 'Home',
      icon: 'home',
      path: '/',
    },
    {
      name: 'Shop',
      icon: 'shopping-bag',
      path: '/shop',
    },
    {
      name: 'Chat',
      icon: 'comments',
      path: '/messages',
    },
    {
      name: 'Account',
      icon: 'user',
      path: '/account',
    },
  ];

  // Find the active tab index
  const activeIndex = tabs.findIndex((tab) => tab.path === pathname) || 0;

  // Update indicator position
  React.useEffect(() => {
    indicatorPosition.value = withSpring(activeIndex * TAB_WIDTH, {
      damping: 15,
      stiffness: 120,
      mass: 1,
    });
  }, [activeIndex, indicatorPosition]);

  // Animated style for the indicator
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value }],
    };
  });

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      {/* Animated indicator */}
      <Animated.View style={[styles.activeIndicator, indicatorStyle]} />

      {/* Tab items */}
      <View style={styles.bottomNav}>
        {tabs.map((tab, index) => {
          const isActive = pathname === tab.path;

          return (
            <Pressable
              key={tab.path}
              onPress={() => router.push(tab.path)}
              style={({ pressed }) => [
                styles.navItem,
                pressed && styles.pressedItem,
              ]}
              android_ripple={{
                color: theme.colors.primary.light,
                borderless: true,
                radius: 28,
              }}
            >
              <View style={styles.tabContent}>
                <View style={styles.iconContainer}>
                  <FontAwesome
                    name={tab.icon}
                    size={20}
                    color={
                      isActive
                        ? theme.colors.primary.main
                        : theme.colors.text.secondary
                    }
                  />
                </View>
                <Text
                  style={[styles.navText, isActive && styles.activeNavText]}
                >
                  {tab.name}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: theme.colors.background.default,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    paddingTop: 8,
    overflow: 'hidden',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 6,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TAB_WIDTH,
    height: 3,
    backgroundColor: theme.colors.primary.main,
    borderRadius: 3,
    zIndex: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    cursor: 'pointer',
    position: 'relative',
  },
  pressedItem: {
    opacity: 0.8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 48,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  navText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '400',
  },
  activeNavText: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
});
