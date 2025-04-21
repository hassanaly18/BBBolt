import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import colors from '../constants/colors';

export default function BottomTabs() {
  const router = useRouter();
  const pathname = usePathname();

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

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.path}
          onPress={() => router.push(tab.path)}
          style={({ pressed }) => [
            styles.navItem,
            pathname === tab.path && styles.activeNavItem,
            pressed && styles.pressedItem
          ]}
        >
          <FontAwesome
            name={tab.icon}
            size={24}
            color={pathname === tab.path ? colors.primary : colors.text.secondary}
          />
          <Text style={[
            styles.navText,
            pathname === tab.path && styles.activeNavText
          ]}>
            {tab.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    minWidth: 80,
    cursor: 'pointer',
  },
  activeNavItem: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  pressedItem: {
    opacity: 0.7,
  },
  navText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  activeNavText: {
    color: colors.primary,
    fontWeight: '500',
  },
}); 