import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reviewApi } from '../services/api';

const ReviewsDisplay = ({ vendorProductId, onReviewCountChange }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedRating, setSelectedRating] = useState(null);

  const loadReviews = async (pageNum = 1, refresh = false) => {
    try {
      const params = {
        page: pageNum,
        limit: 10,
      };

      if (selectedRating) {
        params.rating = selectedRating;
      }

      const response = await reviewApi.getProductReviews(vendorProductId, params);
      const { reviews: newReviews, stats: newStats, pagination } = response.data.data;

      if (refresh) {
        setReviews(newReviews);
        setPage(1);
      } else {
        setReviews(prev => pageNum === 1 ? newReviews : [...prev, ...newReviews]);
      }

      setStats(newStats);
      setHasMore(pagination.hasNextPage);
      
      if (onReviewCountChange) {
        onReviewCountChange(newStats.totalReviews);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReviews(1, true);
  }, [vendorProductId, selectedRating]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReviews(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadReviews(nextPage, false);
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

  const renderRatingFilter = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterTitle}>Filter by Rating:</Text>
      <View style={styles.filterButtons}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedRating === null && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedRating(null)}
        >
          <Text style={[
            styles.filterButtonText,
            selectedRating === null && styles.filterButtonTextActive,
          ]}>
            All
          </Text>
        </TouchableOpacity>
        {[5, 4, 3, 2, 1].map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.filterButton,
              selectedRating === rating && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedRating(rating)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedRating === rating && styles.filterButtonTextActive,
            ]}>
              {rating}★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>
            {item.customer?.name || 'Anonymous'}
          </Text>
          <Text style={styles.reviewDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.ratingContainer}>
          {renderStars(item.rating)}
          <Text style={styles.ratingText}>{item.rating}/5</Text>
        </View>
      </View>
      
      <Text style={styles.reviewText}>{item.review}</Text>
      
      {/* Optional detailed ratings */}
      {(item.productQuality || item.deliveryExperience || item.valueForMoney) && (
        <View style={styles.detailedRatings}>
          {item.productQuality && (
            <View style={styles.detailedRating}>
              <Text style={styles.detailedRatingLabel}>Quality:</Text>
              {renderStars(item.productQuality)}
            </View>
          )}
          {item.deliveryExperience && (
            <View style={styles.detailedRating}>
              <Text style={styles.detailedRatingLabel}>Delivery:</Text>
              {renderStars(item.deliveryExperience)}
            </View>
          )}
          {item.valueForMoney && (
            <View style={styles.detailedRating}>
              <Text style={styles.detailedRatingLabel}>Value:</Text>
              {renderStars(item.valueForMoney)}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.overallRating}>
          <Text style={styles.averageRating}>{stats.averageRating}</Text>
          <Text style={styles.averageRatingLabel}>out of 5</Text>
          {renderStars(Math.round(stats.averageRating))}
        </View>
        
        <View style={styles.ratingDistribution}>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating] || 0;
            const percentage = stats.totalReviews > 0 
              ? Math.round((count / stats.totalReviews) * 100) 
              : 0;
            
            return (
              <View key={rating} style={styles.ratingBar}>
                <Text style={styles.ratingLabel}>{rating}★</Text>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { width: `${percentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.ratingCount}>{count}</Text>
              </View>
            );
          })}
        </View>
        
        <Text style={styles.totalReviews}>
          Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderStats()}
      {renderRatingFilter()}
      
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item._id}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No reviews yet</Text>
            <Text style={styles.emptySubtext}>Be the first to review this product!</Text>
          </View>
        }
        ListFooterComponent={
          hasMore && (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadMoreText}>Loading more reviews...</Text>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  overallRating: {
    alignItems: 'center',
    marginBottom: 20,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  averageRatingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  ratingDistribution: {
    marginBottom: 15,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingLabel: {
    width: 30,
    fontSize: 12,
    color: '#666',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginHorizontal: 10,
  },
  bar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  ratingCount: {
    width: 30,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  totalReviews: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  filterContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  reviewItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  stars: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  detailedRatings: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailedRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailedRatingLabel: {
    fontSize: 12,
    color: '#666',
    width: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadMoreText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
});

export default ReviewsDisplay; 