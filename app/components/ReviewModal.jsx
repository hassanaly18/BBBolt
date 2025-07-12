import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reviewApi } from '../services/api';

const ReviewModal = ({ visible, onClose, product, orderId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [productQuality, setProductQuality] = useState(0);
  const [deliveryExperience, setDeliveryExperience] = useState(0);
  const [valueForMoney, setValueForMoney] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarPress = (starRating, setter) => {
    setter(starRating);
  };

  const renderStars = (currentRating, onStarPress, label) => (
    <View style={styles.starContainer}>
      <Text style={styles.starLabel}>{label}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onStarPress(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={24}
              color={star <= currentRating ? '#FFD700' : '#D3D3D3'}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.ratingText}>{currentRating}/5</Text>
    </View>
  );

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please provide an overall rating');
      return;
    }

    if (review.trim().length < 10) {
      Alert.alert('Error', 'Please write a review with at least 10 characters');
      return;
    }

    // Check if vendorProductId is available (it can be null for older orders)
    // The backend will handle finding the vendorProduct for older orders

    setIsSubmitting(true);

    try {
      const reviewData = {
        orderId: orderId,
        rating: rating,
        review: review.trim(),
        productQuality: productQuality > 0 ? productQuality : undefined,
        deliveryExperience: deliveryExperience > 0 ? deliveryExperience : undefined,
        valueForMoney: valueForMoney > 0 ? valueForMoney : undefined,
      };

      // Only include vendorProductId if it exists
      if (product.vendorProduct) {
        reviewData.vendorProductId = product.vendorProduct;
      }

      console.log('Submitting review data:', reviewData); // Debug log

      await reviewApi.submitReview(reviewData);

      Alert.alert(
        'Success',
        'Thank you for your review!',
        [
          {
            text: 'OK',
            onPress: () => {
              onReviewSubmitted();
              handleClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit review. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setRating(0);
    setProductQuality(0);
    setDeliveryExperience(0);
    setValueForMoney(0);
    setReview('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Write a Review</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Product Info */}
            <View style={styles.productInfo}>
              <Text style={styles.productTitle}>{product?.title}</Text>
              <Text style={styles.productVendor}>from {product?.vendor?.name}</Text>
            </View>

            {/* Overall Rating */}
            {renderStars(rating, setRating, 'Overall Rating *')}

            {/* Optional Detailed Ratings */}
            {renderStars(productQuality, setProductQuality, 'Product Quality')}
            {renderStars(deliveryExperience, setDeliveryExperience, 'Delivery Experience')}
            {renderStars(valueForMoney, setValueForMoney, 'Value for Money')}

            {/* Review Text */}
            <View style={styles.reviewContainer}>
              <Text style={styles.reviewLabel}>Your Review *</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience with this product..."
                value={review}
                onChangeText={setReview}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.charCount}>{review.length}/1000</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (rating === 0 || review.trim().length < 10) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={rating === 0 || review.trim().length < 10 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
  },
  productInfo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  productVendor: {
    fontSize: 14,
    color: '#666',
  },
  starContainer: {
    marginBottom: 20,
  },
  starLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    marginRight: 5,
  },
  ratingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  reviewContainer: {
    marginBottom: 20,
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#f8f9fa',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReviewModal; 