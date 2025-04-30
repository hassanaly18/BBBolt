import { Platform } from 'react-native';

let BACKEND_HOST;
if (Platform.OS === 'android') {
  BACKEND_HOST = '192.168.100.82';
} else if (Platform.OS === 'ios') {
  BACKEND_HOST = 'localhost';
} else if (Platform.OS === 'web') {
  BACKEND_HOST = 'localhost';
} else {
  BACKEND_HOST = '192.168.100.82'; // only works if your phone is on the same router
}

export const API_URL = `http://${BACKEND_HOST}:5000/api`;
