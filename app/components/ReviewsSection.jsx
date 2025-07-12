import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reviewApi } from '../services/api';
import ReviewsDisplay from './ReviewsDisplay';

const ReviewsSection = ({ vendorProductId, productTitle }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  useEffect(() => {
    loadReviewStats();
  }, [vendorProductId]);

  const loadReviewStats = async () => {
    try {
      const response = await reviewApi.getProductReviews(vendorProductId, { limit: 1 });
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Error loading review stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={16}
          color={star <= rating ? '#FFD700' : '#D3D3D3'}
        />
      ))}
    </View>
  );

  const handleViewAllReviews = () => {
    setShowReviewsModal(true);
  };

  const handleCloseReviews = () => {
    setShowReviewsModal(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.noReviewsContainer}>
          <Ionicons name="chatbubble-outline" size={24} color="#ccc" />
          <Text style={styles.noReviewsText}>No reviews yet</Text>
          <Text style={styles.noReviewsSubtext}>Be the first to review this product!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customer Reviews</Text>
        <TouchableOpacity onPress={handleViewAllReviews} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.ratingSummary}>
          <Text style={styles.averageRating}>{stats.averageRating}</Text>
          <Text style={styles.ratingLabel}>out of 5</Text>
          {renderStars(Math.round(stats.averageRating))}
        </View>

        <View style={styles.reviewCount}>
          <Text style={styles.totalReviews}>
            {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Quick rating distribution */}
      <View style={styles.quickDistribution}>
        {[5, 4, 3, 2, 1].slice(0, 3).map((rating) => {
          const count = stats.ratingDistribution[rating] || 0;
          const percentage = stats.totalReviews > 0 
            ? Math.round((count / stats.totalReviews) * 100) 
            : 0;
          
          return (
            <View key={rating} style={styles.quickRatingBar}>
              <Text style={styles.quickRatingLabel}>{rating}★</Text>
              <View style={styles.quickBarContainer}>
                <View 
                  style={[
                    styles.quickBar, 
                    { width: `${percentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.quickRatingCount}>{count}</Text>
            </View>
          );
        })}
      </View>

      {/* Reviews Modal */}
      <Modal
        visible={showReviewsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reviews for {productTitle}</Text>
            <TouchableOpacity onPress={handleCloseReviews} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ReviewsDisplay 
            vendorProductId={vendorProductId}
            onReviewCountChange={(newCount) => {
              // Update stats when review count changes
              if (stats) {
                setStats(prev => ({ ...prev, totalReviews: newCount }));
              }
            }}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  noReviewsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingSummary: {
    alignItems: 'center',
    marginRight: 20,
  },
  averageRating: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  stars: {
    flexDirection: 'row',
  },
  reviewCount: {
    flex: 1,
  },
  totalReviews: {
    fontSize: 14,
    color: '#666',
  },
  quickDistribution: {
    marginTop: 10,
  },
  quickRatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickRatingLabel: {
    width: 25,
    fontSize: 12,
    color: '#666',
  },
  quickBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginHorizontal: 8,
  },
  quickBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  quickRatingCount: {
    width: 25,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
});

export default ReviewsSection; 