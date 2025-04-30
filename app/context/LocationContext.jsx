import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Location from 'expo-location';
import { customerApi } from '../services/api';
import { Alert } from 'react-native';
import { useAuth } from '../auth/AuthContext';

const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Request permission and get location
  const requestLocationPermission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status === 'granted') {
        await getCurrentLocation();
      } else {
        setError('Location permission denied');
      }
    } catch (err) {
      setError('Error requesting location permission');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = coords;
      setLocation({ latitude, longitude });

      // Get address from coordinates
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResult) {
        const formattedAddress = formatAddress(addressResult);
        setAddress(formattedAddress);

        // Update server if user is logged in
        if (isLoggedIn) {
          await updateServerLocation({ lat: latitude, lng: longitude });
        }
      }
    } catch (err) {
      setError('Error getting current location');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update location on server
  const updateServerLocation = async (coordinates) => {
    try {
      await customerApi.updateLocation(coordinates);
    } catch (err) {
      console.error('Error updating server location:', err);
      // Don't set error state here to avoid bothering the user
    }
  };

  // Format address for display
  const formatAddress = (addressObj) => {
    const { city, district, street, region, country, postalCode } = addressObj;
    let parts = [];

    if (street) parts.push(street);
    if (district) parts.push(district);
    if (city) parts.push(city);
    if (region && region !== city) parts.push(region);
    if (postalCode) parts.push(postalCode);
    if (country) parts.push(country);

    return parts.join(', ');
  };

  // Set manual address
  const setManualAddress = async (addressString) => {
    setIsLoading(true);
    setError(null);

    try {
      const geocodeResult = await Location.geocodeAsync(addressString);

      if (geocodeResult && geocodeResult.length > 0) {
        const { latitude, longitude } = geocodeResult[0];
        setLocation({ latitude, longitude });
        setAddress(addressString);

        // Update server if user is logged in
        if (isLoggedIn) {
          await updateServerLocation({
            lat: latitude,
            lng: longitude,
            address: addressString,
          });
        }
      } else {
        setError('Could not find coordinates for this address');
      }
    } catch (err) {
      setError('Error geocoding address');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize on mount - check for permission and get location
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status === 'granted') {
        getCurrentLocation();
      }
    })();
  }, []);

  // Update server location when auth status changes
  useEffect(() => {
    if (isLoggedIn && location) {
      updateServerLocation({
        lat: location.latitude,
        lng: location.longitude,
      });
    }
  }, [isLoggedIn]);

  const value = {
    location,
    address,
    locationPermission,
    isLoading,
    error,
    requestLocationPermission,
    getCurrentLocation,
    setManualAddress,
    // Helper for API calls that need location params
    getLocationParams: () =>
      location
        ? {
            lat: location.latitude,
            lng: location.longitude,
          }
        : null,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;
