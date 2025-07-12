import { useState, useEffect, useCallback } from 'react';

// Predefined radius options
export const radiusOptions = [
  { value: 1, label: '1 km' },
  { value: 3, label: '3 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 15, label: '15 km' },
  { value: 20, label: '20 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
];

// Sorting options
export const sortOptions = {
  nearest: 'Nearest First',
  farthest: 'Farthest First',
  nameAsc: 'Name: A → Z',
  nameDesc: 'Name: Z → A',
};

export const useShopFilters = (vendors) => {
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [sortBy, setSortBy] = useState('nearest');

  // Extract price from string or return number
  const extractPrice = useCallback((str) => {
    if (typeof str === 'number') return str;
    const m = String(str).match(/\d+/g);
    return m ? parseInt(m.join(''), 10) : 0;
  }, []);

  // Handle sorting
  const handleSort = useCallback((sortKey, vendorsToSort = vendors) => {
    if (!vendorsToSort || vendorsToSort.length === 0) return [];

    const sorted = [...vendorsToSort].sort((a, b) => {
      switch (sortKey) {
        case 'nearest':
          return (a.distance || 0) - (b.distance || 0);
        case 'farthest':
          return (b.distance || 0) - (a.distance || 0);
        case 'nameAsc':
          return a.name.localeCompare(b.name);
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return sorted;
  }, [vendors, extractPrice]);

  // Apply all filters
  const applyFilters = useCallback(() => {
    if (!vendors || vendors.length === 0) {
      setFilteredVendors([]);
      return;
    }

    let filtered = [...vendors];
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((vendor) =>
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.location?.formattedAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.categories?.some(cat => 
          cat.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    // Apply radius filter (filter by distance if available)
    if (selectedRadius && vendors[0]?.distance !== undefined) {
      filtered = filtered.filter((vendor) => 
        (vendor.distance || 0) <= selectedRadius
      );
    }
    
    // Apply sorting
    const sorted = handleSort(sortBy, filtered);
    setFilteredVendors(sorted);
  }, [vendors, searchQuery, selectedRadius, sortBy, handleSort]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedRadius(5);
    setSortBy('nearest');
  }, []);

  // Get filter summary
  const getFilterSummary = useCallback(() => {
    const activeFilters = [];
    
    if (searchQuery.trim()) {
      activeFilters.push(`Search: "${searchQuery}"`);
    }
    
    if (selectedRadius !== 5) {
      activeFilters.push(`${selectedRadius}km radius`);
    }

    if (sortBy !== 'nearest') {
      activeFilters.push(`Sort: ${sortOptions[sortBy]}`);
    }
    
    return activeFilters.length > 0 ? activeFilters.join(', ') : 'No filters applied';
  }, [searchQuery, selectedRadius, sortBy]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return {
    // Filtered data
    filteredVendors,
    
    // Filter state
    searchQuery,
    selectedRadius,
    sortBy,
    
    // Filter setters
    setSearchQuery,
    setSelectedRadius,
    setSortBy,
    
    // Filter functions
    applyFilters,
    resetFilters,
    getFilterSummary,
    handleSort,
    
    // Helper
    extractPrice,
  };
};

// Default export for Expo Router compatibility
export default function useShopFiltersRoute() {
  return null;
}