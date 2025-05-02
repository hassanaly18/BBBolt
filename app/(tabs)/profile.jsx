import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import theme from '../theme';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  LogOut,
  Edit3,
  AlertCircle,
} from 'lucide-react-native';
import * as Location from 'expo-location';

export default function ProfileScreen() {
  const { user, logout, updateProfile, updateLocation, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.location?.formattedAddress || '',
  });
  const [errors, setErrors] = useState({});
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const handleEdit = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.location?.formattedAddress || '',
    });
    setErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    // Validate form data
    if (!validateForm()) {
      return;
    }

    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
      });

      // If address was changed, update location
      if (formData.address !== user?.location?.formattedAddress) {
        try {
          const geocodeResult = await Location.geocodeAsync(formData.address);

          if (geocodeResult && geocodeResult.length > 0) {
            await updateLocation({
              lat: geocodeResult[0].latitude,
              lng: geocodeResult[0].longitude,
              address: formData.address,
            });
          }
        } catch (error) {
          console.error('Error geocoding address:', error);
        }
      }

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile'
      );
    }
  };

  const detectCurrentLocation = async () => {
    setIsDetectingLocation(true);

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to detect your address'
        );
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      const [geoResult] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geoResult) {
        const formattedAddress = [
          geoResult.name,
          geoResult.street,
          geoResult.city,
          geoResult.region,
          geoResult.postalCode,
          geoResult.country,
        ]
          .filter(Boolean)
          .join(', ');

        setFormData({
          ...formData,
          address: formattedAddress,
        });
        
        // Clear any address error when we successfully detect location
        if (errors.address) {
          setErrors({ ...errors, address: undefined });
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to detect location');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' },
    ]);
  };

  if (loading || !user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  if (isEditing) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={[
            styles.inputContainer, 
            errors.name ? styles.inputError : null
          ]}>
            <User
              size={20}
              color={errors.name ? theme.colors.error : theme.colors.text.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text });
                if (text.trim() && errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              placeholderTextColor={theme.colors.text.hint}
            />
            {errors.name && (
              <AlertCircle size={20} color={theme.colors.error} />
            )}
          </View>
          {errors.name && (
            <Text style={styles.errorText}>{errors.name}</Text>
          )}

          <View style={styles.inputContainer}>
            <Mail
              size={20}
              color={theme.colors.info.main}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={user.email}
              editable={false}
              placeholderTextColor={theme.colors.text.hint}
            />
          </View>

          <View style={[
              styles.inputContainer,
              errors.phone ? styles.inputError : null
            ]}>
            <Phone
              size={20}
              color={errors.phone ? theme.colors.error : theme.colors.text.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => {
                setFormData({ ...formData, phone: text });
                if (text.trim() && errors.phone) {
                  setErrors({ ...errors, phone: undefined });
                }
              }}
              placeholderTextColor={theme.colors.text.hint}
            />
            {errors.phone && (
              <AlertCircle size={20} color={theme.colors.error} />
            )}
          </View>
          {errors.phone && (
            <Text style={styles.errorText}>{errors.phone}</Text>
          )}

          <View style={styles.locationContainer}>
            <View style={[
              styles.inputContainer,
              errors.address ? styles.inputError : null
            ]}>
              <MapPin
                size={20}
                color={errors.address ? theme.colors.error : theme.colors.text.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Your Address"
                value={formData.address}
                onChangeText={(text) => {
                  setFormData({ ...formData, address: text });
                  if (text.trim() && errors.address) {
                    setErrors({ ...errors, address: undefined });
                  }
                }}
                placeholderTextColor={theme.colors.text.hint}
                multiline
              />
              {errors.address && (
                <AlertCircle size={20} color={theme.colors.error} />
              )}
            </View>
            {errors.address && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
            <TouchableOpacity
              style={styles.detectButton}
              onPress={detectCurrentLocation}
              disabled={isDetectingLocation}
            >
              {isDetectingLocation ? (
                <ActivityIndicator size="small" color={theme.colors.primary.contrastText} />
              ) : (
                <Text style={styles.detectButtonText}>Detect Location</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary.contrastText} />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>
                {user.isEmailVerified ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Edit3 size={20} color={theme.colors.primary.main} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Account Information</Text>

        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Mail size={20} color={theme.colors.primary.main} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Phone size={20} color={theme.colors.primary.main} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user.phone || 'Not provided'}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <MapPin size={20} color={theme.colors.primary.main} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>
              {user.location?.formattedAddress || 'Not provided'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color={theme.colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: theme.colors.background.paper,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  headerTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text.primary,
  },
  profileSection: {
    backgroundColor: theme.colors.background.paper,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    ...getShadow(theme.shadows.md),
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: theme.borderRadius.circle,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: theme.colors.primary.contrastText,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  verifiedBadge: {
    backgroundColor: theme.colors.success.main,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.xs,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: theme.colors.primary.contrastText,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: theme.typography.caption.fontWeight,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
  },
  editButtonText: {
    color: theme.colors.primary.main,
    fontSize: theme.typography.subtitle1.fontSize,
    fontWeight: theme.typography.subtitle1.fontWeight,
    marginLeft: theme.spacing.sm,
  },
  infoSection: {
    backgroundColor: theme.colors.background.paper,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    ...getShadow(theme.shadows.md),
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.circle,
    backgroundColor: 'rgba(77, 33, 109, 0.08)', // Using the primary color with reduced opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs / 2,
  },
  infoValue: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.paper,
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    marginBottom: theme.spacing.xxl,
  },
  logoutText: {
    color: theme.colors.error,
    fontSize: theme.typography.subtitle1.fontSize,
    fontWeight: theme.typography.subtitle1.fontWeight,
    marginLeft: theme.spacing.sm,
  },
  formContainer: {
    padding: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 56,
    borderWidth: 1,
    borderColor: theme.colors.text.hint,
  },
  inputError: {
    borderColor: theme.colors.error,
    borderWidth: 1,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.caption.fontSize,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.md,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 56,
    color: theme.colors.text.primary,
    fontSize: theme.typography.body1.fontSize,
  },
  locationContainer: {
    marginBottom: theme.spacing.md,
  },
  detectButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.sm,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  detectButtonText: {
    color: theme.colors.primary.contrastText,
    fontSize: theme.typography.button.fontSize,
    fontWeight: theme.typography.button.fontWeight,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: theme.colors.text.hint,
    borderRadius: theme.borderRadius.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.subtitle1.fontSize,
    fontWeight: theme.typography.subtitle1.fontWeight,
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.colors.primary.contrastText,
    fontSize: theme.typography.subtitle1.fontSize,
    fontWeight: theme.typography.subtitle1.fontWeight,
  },
});

// Helper function to parse shadow values from theme
function getShadow(shadowString) {
  if (shadowString === 'none') {
    return {};
  }
  
  // Basic shadow for React Native
  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  };
}