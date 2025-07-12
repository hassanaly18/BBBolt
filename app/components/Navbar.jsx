import { View, Image, StyleSheet, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../constants/theme';

export default function Navbar() {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable 
        onPress={() => router.push('/')}
        style={({ pressed }) => [
          styles.navButton,
          pressed && styles.pressedButton
        ]}
      >
        <FontAwesome name="bars" size={24} color={colors.primary} />
      </Pressable>
      <Image 
        source={require('../../assets/images/icon.png')}
        style={styles.logo}
      />
      <View style={styles.rightNav}>
        <Pressable 
          onPress={() => router.push('/search')}
          style={({ pressed }) => [
            styles.navButton,
            pressed && styles.pressedButton
          ]}
        >
          <FontAwesome name="search" size={24} color={colors.primary} />
        </Pressable>
        <Pressable 
          onPress={() => router.push('/(tabs)/cart')}
          style={({ pressed }) => [
            styles.navButton,
            pressed && styles.pressedButton
          ]}
        >
          <FontAwesome name="shopping-cart" size={24} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rightNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
    cursor: 'pointer',
  },
  pressedButton: {
    opacity: 0.7,
  },
  logo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
}); 