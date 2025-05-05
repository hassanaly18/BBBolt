// app/context/NotificationContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import api from '../services/api';

// Configure notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const { isLoggedIn, user } = useAuth();

  // Register for push notifications
  async function registerForPushNotificationsAsync() {
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
        projectId: Constants.expoConfig.extra.eas.projectId,
      })).data;
    } else {
      console.log('Must use physical device for push notifications');
    }

    return token;
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

    // This listener is fired whenever a notification is received while the app is foregrounded
// Update the notificationListener in NotificationContext.jsx
notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received in foreground:', notification);
    const { request: { content } } = notification;
    console.log('Notification content:', content.title, content.body, content.data);
    
    // Always set the notification state
    setNotification(notification);
    
    // If you want to explicitly show an alert for better visibility
    if (Platform.OS === 'android') {
      Alert.alert(content.title, content.body);
    }
  });

    // This listener is fired whenever a user taps on or interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const { notification: { request: { content: { data } } } } = response;
      
      // Handle notification tap - e.g., navigate to order details if it's an order notification
      if (data.type === 'order' && data.orderId) {
        // Navigate to order details - you'll need to implement this navigation logic
        // You could use a global event emitter or store the navigation data to be used by components
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
  useEffect(() => {
    // Configure foreground notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        console.log('Handling notification in foreground:', notification);
        // Always show the notification even when app is in foreground
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldAnnounce: true,
        };
      },
    });
  
    // Rest of your existing code for listeners
  }, []);
  // Send local notification
  const sendLocalNotification = async (title, body, data = {}) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // null means it will show immediately
    });
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


// // app/context/NotificationContext.jsx
// import { createContext, useContext, useState, useRef } from 'react';
// import * as Notifications from 'expo-notifications';
// import { Platform } from 'react-native';

// // Configure notifications behavior
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// const NotificationContext = createContext();

// export function NotificationProvider({ children }) {
//   const [notification, setNotification] = useState(null);
//   const notificationListener = useRef();
//   const responseListener = useRef();

//   // Initialize notification listeners
//   useEffect(() => {
//     // This listener is fired whenever a notification is received while the app is foregrounded
//     notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
//       console.log('Notification received:', notification);
//       setNotification(notification);
//     });

//     // This listener is fired whenever a user taps on or interacts with a notification
//     responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
//       console.log('Notification response received:', response);
//     });

//     // Request permissions - simplified approach
//     const requestPermissions = async () => {
//       if (Platform.OS === 'android') {
//         await Notifications.setNotificationChannelAsync('default', {
//           name: 'default',
//           importance: Notifications.AndroidImportance.MAX,
//           vibrationPattern: [0, 250, 250, 250],
//           lightColor: '#FF231F7C',
//         });
//       }
      
//       const { status } = await Notifications.requestPermissionsAsync();
//       console.log('Notification permission status:', status);
//     };
    
//     requestPermissions();

//     return () => {
//       Notifications.removeNotificationSubscription(notificationListener.current);
//       Notifications.removeNotificationSubscription(responseListener.current);
//     };
//   }, []);

//   // Send local notification
//   const sendLocalNotification = async (title, body, data = {}) => {
//     console.log('Sending local notification:', { title, body, data });
//     try {
//       await Notifications.scheduleNotificationAsync({
//         content: {
//           title,
//           body,
//           data,
//         },
//         trigger: null, // null means it will show immediately
//       });
//       console.log('Local notification sent successfully');
//     } catch (error) {
//       console.error('Error sending local notification:', error);
//     }
//   };

//   return (
//     <NotificationContext.Provider
//       value={{
//         notification,
//         sendLocalNotification,
//       }}
//     >
//       {children}
//     </NotificationContext.Provider>
//   );
// }

// export const useNotification = () => {
//   const context = useContext(NotificationContext);
//   if (!context) {
//     throw new Error('useNotification must be used within a NotificationProvider');
//   }
//   return context;
// };

// export default NotificationProvider;