import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reviewApi } from '../services/api';

const ReviewButton = ({ 
  vendorProductId, 
  orderId, 
  product, 
  onReviewSubmitted,
  style 
}) => {
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkReviewStatus();
  }, [vendorProductId, orderId]);

  const checkReviewStatus = async () => {
    try {
      // Check if customer has already reviewed this product for this order
      const response = await reviewApi.getCustomerReviews();
      const customerReviews = response.data.data.reviews;
      
      const hasReviewedThisProduct = customerReviews.some(
        review => 
          review.vendorProduct === vendorProductId && 
          review.order === orderId
      );
      
      setHasReviewed(hasReviewedThisProduct);
    } catch (error) {
      console.error('Error checking review status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewPress = () => {
    if (hasReviewed) {
      Alert.alert(
        'Already Reviewed',
        'You have already reviewed this product for this order.',
        [{ text: 'OK' }]
      );
      return;
    }

    // This will be handled by the parent component
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.loadingText}>Checking review status...</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        hasReviewed && styles.reviewedContainer,
        style
      ]}
      onPress={handleReviewPress}
      disabled={hasReviewed}
    >
      <Ionicons
        name={hasReviewed ? 'checkmark-circle' : 'chatbubble-outline'}
        size={20}
        color={hasReviewed ? '#4CAF50' : '#007AFF'}
      />
      <Text style={[
        styles.buttonText,
        hasReviewed && styles.reviewedText
      ]}>
        {hasReviewed ? 'Reviewed' : 'Write Review'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  reviewedContainer: {
    backgroundColor: '#f0f0f0',
    borderColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  reviewedText: {
    color: '#4CAF50',
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default ReviewButton; 