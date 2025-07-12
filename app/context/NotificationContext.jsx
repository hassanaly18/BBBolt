// app/context/NotificationContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert, DeviceEventEmitter } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { router } from 'expo-router';
import api from '../services/api';

// Configure notifications behavior - with error handling for Expo Go
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  console.warn('Notifications not available in Expo Go:', error);
}

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const { isLoggedIn, user } = useAuth();

  // Register for push notifications
  async function registerForPushNotificationsAsync() {
    try {
      let token;
      
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return;
        }
        
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })).data;
      } else {
        console.log('Must use physical device for push notifications');
      }

      return token;
    } catch (error) {
      console.warn('Push notifications not available in Expo Go:', error);
      return null;
    }
  }

  // Send token to server when user logs in
  useEffect(() => {
    if (isLoggedIn && expoPushToken) {
      // Send token to your server
      api.post('/customers/push-token', { token: expoPushToken })
        .catch(err => console.error('Error saving push token:', err));
    }
  }, [isLoggedIn, expoPushToken]);

  // Initialize notification listeners
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token);
    });

    try {
      // This listener is fired whenever a notification is received while the app is foregrounded
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received in foreground:', notification);
        const { request: { content } } = notification;
        console.log('Notification content:', content.title, content.body, content.data);
        
        // Always set the notification state
        setNotification(notification);
        
        // Trigger order refresh for order notifications using DeviceEventEmitter
        if (content.data?.type === 'order') {
          // Emit custom event for order status changes
          DeviceEventEmitter.emit('orderStatusChanged', {
            orderId: content.data.orderId, 
            status: content.data.status
          });
        }
        
        // If you want to explicitly show an alert for better visibility
        if (Platform.OS === 'android') {
          Alert.alert(content.title, content.body);
        }
      });

      // This listener is fired whenever a user taps on or interacts with a notification
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const { notification: { request: { content: { data } } } } = response;
        
        console.log('Notification tapped:', data);
        
        // Handle notification tap - navigate to order details if it's an order notification
        if (data.type === 'order' && data.orderId) {
          try {
            // Navigate directly to the specific order details screen
            router.push(`/orders/${data.orderId}`);
            
            console.log('Navigated to order details for order:', data.orderId);
          } catch (error) {
            console.error('Error navigating to order:', error);
            // Fallback to orders tab if specific order navigation fails
            try {
              router.push('/(tabs)/orders');
              console.log('Fallback navigation to orders tab');
            } catch (fallbackError) {
              console.error('Fallback navigation also failed:', fallbackError);
            }
          }
        }
      });
    } catch (error) {
      console.warn('Notification listeners not available in Expo Go:', error);
    }

    return () => {
      try {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      } catch (error) {
        console.warn('Error removing notification listeners:', error);
      }
    };
  }, []);

  useEffect(() => {
    // Configure foreground notification behavior
    try {
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          console.log('Handling notification in foreground:', notification);
          // Always show the notification even when app is in foreground
          return {
            shouldShowBanner: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          };
        },
      });
    } catch (error) {
      console.warn('Error setting notification handler:', error);
    }
  }, []);

  // Send local notification
  const sendLocalNotification = async (title, body, data = {}) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // null means it will show immediately
      });
    } catch (error) {
      console.warn('Local notifications not available in Expo Go:', error);
      // Fallback: log to console
      console.log(`Notification: ${title} - ${body}`);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        sendLocalNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;