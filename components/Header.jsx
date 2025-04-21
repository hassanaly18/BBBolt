import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Menu, Search, ShoppingCart } from 'lucide-react-native';

export default function Header() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconButton}>
        <Menu size={24} color="#333" />
      </TouchableOpacity>
      
      <View style={styles.logoContainer}>
        <Image 
          source={{ uri: 'https://img.icons8.com/color/96/grocery-bag.png' }} 
          style={styles.logo} 
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.rightIcons}>
        <TouchableOpacity style={styles.iconButton}>
          <Search size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconButton}>
          <ShoppingCart size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
  rightIcons: {
    flexDirection: 'row',
  },
});