import { useState, useEffect, useCallback } from 'react';
import { vendorApi, categoryApi, customerApi } from '../services/api';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../auth/AuthContext';

export const useShopData = () => {
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const { location, getCurrentLocation, getLocationParams } = useLocation();
  const { isLoggedIn } = useAuth();

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((vendorLocation) => {
    try {
      if (!location || !vendorLocation) {
        return 9999; // Return large value for unknown distances
      }

      // LocationContext provides {latitude, longitude}
      const userLat = location.latitude;
      const userLon = location.longitude;
      
      // API provides {coordinates: [longitude, latitude]}
      const vendorCoordinates = vendorLocation.coordinates;
      
      if (!userLat || !userLon || !vendorCoordinates || !Array.isArray(vendorCoordinates)) {
        return 9999;
      }

      const [vendorLon, vendorLat] = vendorCoordinates;
      
      if (typeof vendorLat !== 'number' || typeof vendorLon !== 'number') {
        return 9999;
      }
      
      const R = 6371; // Radius of the Earth in kilometers
      const dLat = (vendorLat - userLat) * Math.PI / 180;
      const dLon = (vendorLon - userLon) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(userLat * Math.PI / 180) * Math.cos(vendorLat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c; // Distance in kilometers
      
      return distance;
    } catch (error) {
      console.error('Error calculating distance:', error);
      return 9999;
    }
  }, [location]);

  // Format distance for display
  const formatDistance = useCallback((distance) => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  }, []);

  // Load categories on initial load
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getAllCategories();
        setCategories(response.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Clear data when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      setVendors([]);
      setSubCategories([]);
      setLoading(false);
      setError(null);
    }
  }, [isLoggedIn]);

  // Load subcategories when category changes
  const fetchSubCategories = useCallback(async (categoryId) => {
    if (!categoryId) {
      setSubCategories([]);
      return;
    }
    
    try {
      const response = await categoryApi.getSubCategoriesByCategory(categoryId);
      setSubCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubCategories([]);
    }
  }, []);

  // Fetch vendors based on location and radius
  const fetchVendors = useCallback(async (radius = 5) => {
    if (!location || !isLoggedIn) {
      console.log('Location not available or user not logged in for vendor search');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = getLocationParams();
      params.radius = radius;
      
      // Use the same API that works in search screen
      const response = await customerApi.searchNearbyVendorsAndProducts(params);
      
      // Get vendors from the search response
      let vendorData = response.data?.vendors || [];
      console.log(`Found ${vendorData.length} vendors within ${radius}km`);
      
      // Calculate distances and add to vendor data
      vendorData = vendorData.map(vendor => ({
        ...vendor,
        distance: calculateDistance(vendor.location),
        distanceText: formatDistance(calculateDistance(vendor.location))
      }));

      // Sort by distance (nearest first) by default
      vendorData.sort((a, b) => a.distance - b.distance);

      setVendors(vendorData);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setError(error.response?.data?.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [location, getLocationParams, calculateDistance, formatDistance]);

  // Fetch all vendors (fallback when location is not available)
  const fetchAllVendors = useCallback(async () => {
    if (!isLoggedIn) {
      console.log('User not logged in, skipping vendor fetch');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Use search API with a large radius to get all vendors
      const params = { radius: 1000 }; // 1000km radius to get all vendors
      const response = await customerApi.searchNearbyVendorsAndProducts(params);
      
      // Get vendors from the search response
      let vendorData = response.data?.vendors || [];
      console.log(`Found ${vendorData.length} vendors (fallback mode)`);
      
      // Add placeholder distance for vendors when location is not available
      vendorData = vendorData.map(vendor => ({
        ...vendor,
        distance: 0,
        distanceText: 'Location unavailable'
      }));

      setVendors(vendorData);
    } catch (error) {
      console.error('Error fetching all vendors:', error);
      setError(error.response?.data?.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize screen data
  const initializeScreen = useCallback(async () => {
    if (!isLoggedIn) {
      setVendors([]);
      setLoading(false);
      return;
    }
    
    try {
      if (location) {
        await fetchVendors();
      } else {
        const currentLocation = await getCurrentLocation();
        if (currentLocation) {
          await fetchVendors();
        } else {
          await fetchAllVendors();
        }
      }
    } catch (error) {
      console.error('Error initializing screen:', error);
      await fetchAllVendors();
    }
  }, [isLoggedIn, location, getCurrentLocation, fetchVendors, fetchAllVendors]);

  // Refresh data
  const onRefresh = useCallback(async (radius = 5) => {
    if (!isLoggedIn) {
      setRefreshing(false);
      return;
    }
    
    setRefreshing(true);
    try {
      if (location) {
        await fetchVendors(radius);
      } else {
        await fetchAllVendors();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [isLoggedIn, location, fetchVendors, fetchAllVendors]);

  // Retry with location
  const retryWithLocation = useCallback(async () => {
    try {
      setLoading(true);
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        await fetchVendors();
      } else {
        setError('Unable to get location. Please enable location services.');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get location');
    }
  }, [getCurrentLocation, fetchVendors]);

  return {
    // Data
    vendors,
    categories,
    subCategories,
    loading,
    error,
    refreshing,
    
    // Functions
    fetchSubCategories,
    initializeScreen,
    fetchVendors,
    onRefresh,
    retryWithLocation,
    calculateDistance,
    formatDistance,
  };
};

// Default export for Expo Router compatibility
export default function useShopDataRoute() {
  return null;
}