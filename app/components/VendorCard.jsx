import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Star, Clock } from 'lucide-react-native';
import theme from '../constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

export default function VendorCard({ vendor }) {
  const router = useRouter();

  const handlePress = () => {
    // Use _id if id is not available (MongoDB default)
    const vendorId = vendor.id || vendor._id;
    router.push(`/vendor-details?id=${vendorId}`);
  };

  // Handle different possible image field names
  const getVendorImage = () => {
    if (vendor.image) return vendor.image;
    if (vendor.profileImage) return vendor.profileImage;
    if (vendor.imageUrl) return vendor.imageUrl;
    // Default fallback image
    return require('../../assets/images/no-shops.png');
  };

  // Format location text
  const getLocationText = () => {
    if (vendor.location?.formattedAddress) {
      return vendor.location.formattedAddress;
    }
    if (vendor.location?.address) {
      return vendor.location.address;
    }
    if (vendor.address) {
      return vendor.address;
    }
    if (vendor.distanceText) {
      return vendor.distanceText;
    }
    return 'Location unavailable';
  };

  // Get delivery time with fallback
  const getDeliveryTime = () => {
    if (vendor.deliveryTime) return vendor.deliveryTime;
    if (vendor.estimatedDeliveryTime) return vendor.estimatedDeliveryTime;
    return '30-45 min';
  };

  // Get rating with fallback
  const getRating = () => {
    if (vendor.rating) return vendor.rating.toFixed(1);
    if (vendor.averageRating) return vendor.averageRating.toFixed(1);
    return '4.0';
  };

  // Get tags with fallback
  const getTags = () => {
    if (vendor.tags && Array.isArray(vendor.tags)) return vendor.tags;
    if (vendor.categories && Array.isArray(vendor.categories)) {
      return vendor.categories.map(cat => cat.name || cat).filter(Boolean);
    }
    return ['General'];
  };

  // Get delivery fee with fallback
  const getDeliveryFee = () => {
    if (vendor.deliveryFee !== undefined) return vendor.deliveryFee;
    if (vendor.deliveryCharges !== undefined) return vendor.deliveryCharges;
    return 40; // Default delivery fee
  };

  // Get minimum order with fallback
  const getMinOrder = () => {
    if (vendor.minOrder !== undefined) return vendor.minOrder;
    if (vendor.minimumOrder !== undefined) return vendor.minimumOrder;
    return 200; // Default minimum order
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image
          source={typeof getVendorImage() === 'string' ? { uri: getVendorImage() } : getVendorImage()}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.ratingContainer}>
          <Star size={12} color="#FFD700" fill="#FFD700" />
          <Text style={styles.rating}>{getRating()}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {vendor.name || 'Unknown Vendor'}
          </Text>
          <View style={styles.deliveryTimeContainer}>
            <Clock size={12} color={theme.colors.text.secondary} />
            <Text style={styles.deliveryTime}>{getDeliveryTime()}</Text>
          </View>
        </View>

        <View style={styles.locationContainer}>
          <MapPin size={12} color={theme.colors.text.secondary} />
          <Text style={styles.location} numberOfLines={1}>
            {getLocationText()}
          </Text>
          {vendor.distanceText && (
            <Text style={styles.distance}>
              • {vendor.distanceText === 'Location unavailable' ? 'Distance unavailable' : vendor.distanceText}
            </Text>
          )}
        </View>

        <View style={styles.tagsContainer}>
          {getTags().slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.deliveryFee}>
            Delivery: Rs {getDeliveryFee()}
          </Text>
          <Text style={styles.minOrder}>
            Min: Rs {getMinOrder()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.background.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ratingContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 2,
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginRight: 8,
  },
  deliveryTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  distance: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryFee: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  minOrder: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
}); 