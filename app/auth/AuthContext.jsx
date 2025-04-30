import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { customerApi } from '../services/api';
import { useRouter, useSegments } from 'expo-router';

// Create context
const AuthContext = createContext({});

// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const segments = useSegments();

  // Check if we have a stored token on startup
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          await loadUserProfile();
        }
      } catch (e) {
        console.error('Failed to load auth state:', e);
      } finally {
        setLoading(false);
      }
    };

    loadToken();
  }, []);

  // Watch for route changes to handle protected routes
  useEffect(() => {
    if (!loading) {
      const inAuthGroup = segments[0] === 'auth';

      if (!user && !inAuthGroup) {
        // If not logged in and not on an auth screen, redirect to login
        router.replace('/auth/login');
      } else if (user && inAuthGroup) {
        // If logged in and on an auth screen, redirect to home
        router.replace('/');
      }
    }
  }, [user, loading, segments]);

  // Load user profile from API
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await customerApi.getProfile();
      setUser(response.data);
      return response.data;
    } catch (e) {
      console.error('Failed to load user profile:', e);
      await logout();
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await customerApi.register(userData);

      // Store auth token
      await AsyncStorage.setItem('userToken', response.data.token);

      // Set user data
      setUser(response.data);

      return response.data;
    } catch (e) {
      console.error('Registration error:', e);
      setError(e.response?.data?.message || 'Registration failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await customerApi.login(credentials);

      // Store auth token
      await AsyncStorage.setItem('userToken', response.data.token);

      // Set user data
      setUser(response.data);

      return response.data;
    } catch (e) {
      console.error('Login error:', e);
      setError(e.response?.data?.message || 'Login failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setLoading(true);

      // Remove auth token
      await AsyncStorage.removeItem('userToken');

      // Clear user data
      setUser(null);

      // Redirect to login
      router.replace('/auth/login');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Verify email
  const verifyEmail = async (token) => {
    try {
      setLoading(true);
      const response = await customerApi.verifyEmail(token);
      await loadUserProfile(); // Refresh user data after verification
      return response.data;
    } catch (e) {
      setError(e.response?.data?.message || 'Email verification failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await customerApi.updateProfile(profileData);
      setUser(response.data);
      return response.data;
    } catch (e) {
      setError(e.response?.data?.message || 'Profile update failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Update location
  const updateLocation = async (locationData) => {
    try {
      setLoading(true);
      const response = await customerApi.updateLocation(locationData);

      // Update user with new location
      if (user) {
        setUser({ ...user, location: response.data.location });
      }

      return response.data;
    } catch (e) {
      setError(e.response?.data?.message || 'Location update failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Provide auth context value
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    verifyEmail,
    updateProfile,
    updateLocation,
    isLoggedIn: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
