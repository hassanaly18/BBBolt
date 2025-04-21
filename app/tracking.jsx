import { View, Text, StyleSheet } from 'react-native';

export default function TrackingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Order Tracking</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
  },
}); 