import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../app/constants/colors';

export default function CategoryGrid({ categories, onPress }) {
  return (
    <View style={styles.container}>
      {categories.map((category) => (
        <TouchableOpacity 
          key={category.id} 
          style={styles.categoryItem}
          onPress={() => onPress(category)}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={category.icon} size={32} color={colors.primary} />
          </View>
          <Text style={styles.name}>{category.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
  },
  categoryItem: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    textAlign: 'center',
    color: colors.text.primary,
  },
});