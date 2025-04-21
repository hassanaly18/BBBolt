import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';

export default function Banner() {
  const router = useRouter();

  const handleShopPress = () => {
    router.replace('shop');
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg' }}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Compare prices of grocery items now!</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleShopPress}
          >
            <Text style={styles.buttonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  background: {
    width: '100%',
    aspectRatio: 2,
  },
  backgroundImage: {
    borderRadius: 12,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});