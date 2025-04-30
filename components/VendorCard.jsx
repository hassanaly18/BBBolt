import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MapPin, Star, Clock, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import theme from '../app/theme';

const VendorCard = ({ vendor }) => {
  const navigation = useNavigation();

  // Calculate the rating display
  const rating = vendor.rating || 0;
  const reviewCount = vendor.reviewCount || 0;

  // Handle different statuses
  const isOpen = vendor.isOpen !== undefined ? vendor.isOpen : true;

  // Get vendor image or use placeholder
  const vendorImage =
    vendor.imageUrl || 'https://via.placeholder.com/300x200?text=Vendor';

  // Format distance if available
  const distance = vendor.distance
    ? `${
        vendor.distance < 1
          ? `${Math.round(vendor.distance * 1000)}m`
          : `${vendor.distance.toFixed(1)}km`
      }`
    : null;

  const handlePress = () => {
    // Navigate to vendor detail screen (update the route as needed)
    navigation.navigate('VendorDetail', { vendorId: vendor._id });
  };

  // Format address for display
  const displayAddress =
    vendor.location?.formattedAddress ||
    (vendor.location?.address
      ? vendor.location.address
      : 'Address not available');

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: vendorImage }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Status badge */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isOpen
                  ? theme.colors.success.main
                  : theme.colors.text.secondary,
              },
            ]}
          >
            <Text style={styles.statusText}>{isOpen ? 'OPEN' : 'CLOSED'}</Text>
          </View>

          {/* Distance badge (if available) */}
          {distance && (
            <View style={styles.distanceBadge}>
              <MapPin size={12} color={theme.colors.primary.contrastText} />
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {vendor.name}
            </Text>

            {/* Rating display */}
            <View style={styles.ratingContainer}>
              <Star
                size={16}
                color={
                  rating > 0
                    ? theme.colors.secondary.main
                    : theme.colors.text.disabled
                }
                fill={rating > 0 ? theme.colors.secondary.main : 'none'}
              />
              <Text style={styles.ratingText}>
                {rating > 0 ? rating.toFixed(1) : 'New'}
              </Text>
              {reviewCount > 0 && (
                <Text style={styles.reviewCount}>({reviewCount})</Text>
              )}
            </View>
          </View>

          {/* Location info */}
          <View style={styles.infoRow}>
            <MapPin
              size={14}
              color={theme.colors.text.secondary}
              style={styles.icon}
            />
            <Text style={styles.infoText} numberOfLines={1}>
              {displayAddress}
            </Text>
          </View>

          {/* Hours info - would come from vendor data */}
          <View style={styles.infoRow}>
            <Clock
              size={14}
              color={theme.colors.text.secondary}
              style={styles.icon}
            />
            <Text style={styles.infoText}>
              {isOpen ? 'Open now' : 'Currently closed'}
              {vendor.hours ? ` · ${vendor.hours}` : ''}
            </Text>
          </View>

          {/* Call to action */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.actionButton} onPress={handlePress}>
              <Text style={styles.actionButtonText}>View Details</Text>
              <ChevronRight size={14} color={theme.colors.primary.main} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.background.default,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.background.paper,
  },
  statusBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    color: theme.colors.primary.contrastText,
    fontSize: 10,
    fontWeight: '700',
  },
  distanceBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    color: theme.colors.primary.contrastText,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    padding: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.h5.fontSize,
    fontWeight: theme.typography.h5.fontWeight,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text.secondary,
    marginLeft: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  footer: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(77, 33, 109, 0.1)',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  actionButtonText: {
    fontSize: theme.typography.button.fontSize,
    color: theme.colors.primary.main,
    marginRight: theme.spacing.xs,
  },
});

export default VendorCard;
