import { Tabs, Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';

function Header() {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.navButton}>
        <FontAwesome name="bars" size={24} color="#333" />
      </TouchableOpacity>
      <Image 
        source={require('../../assets/images/icon.png')}
        style={styles.logo}
      />
      <View style={styles.rightNav}>
        <TouchableOpacity style={styles.navButton}>
          <FontAwesome name="search" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <FontAwesome name="shopping-cart" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="product/[id]"
        options={{
          headerShown: true,
          headerTitle: 'Product Details',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  rightNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
  },
  logo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
}); 