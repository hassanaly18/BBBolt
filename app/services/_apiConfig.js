import { Platform } from 'react-native';

let BACKEND_HOST;
if (Platform.OS === 'android') {
  BACKEND_HOST = 'https://buy-bye-backend.vercel.app';
} else if (Platform.OS === 'ios') {
  BACKEND_HOST = 'https://buy-bye-backend.vercel.app';
} else if (Platform.OS === 'web') {
  BACKEND_HOST = 'https://buy-bye-backend.vercel.app';
} else {
  BACKEND_HOST = 'https://buy-bye-backend.vercel.app';
}

export const API_URL = `${BACKEND_HOST}/api`;

// Default export for Expo Router compatibility
export default function ApiConfigRoute() {
  return null;
}