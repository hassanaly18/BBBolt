import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

export default function CategoryGrid({ categories }) {
  return (
    <View style={styles.container}>
      {categories.map((category) => (
        <TouchableOpacity key={category.id} style={styles.categoryItem}>
          <View style={styles.iconContainer}>
            <Image source={{ uri: category.icon }} style={styles.icon} resizeMode="contain" />
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
  icon: {
    width: 36,
    height: 36,
  },
  name: {
    fontSize: 14,
    textAlign: 'center',
  },
});