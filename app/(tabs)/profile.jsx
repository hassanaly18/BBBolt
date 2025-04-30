import React, { useState } from 'react';
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
import colors from '../constants/colors';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  LogOut,
  Edit3,
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
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const handleEdit = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.location?.formattedAddress || '',
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
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
        <ActivityIndicator size="large" color={colors.primary} />
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
          <View style={styles.inputContainer}>
            <User
              size={20}
              color={colors.text.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholderTextColor={colors.text.inactive}
            />
          </View>

          <View style={styles.inputContainer}>
            <Mail
              size={20}
              color={colors.text.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={user.email}
              editable={false}
              placeholderTextColor={colors.text.inactive}
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone
              size={20}
              color={colors.text.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number (Optional)"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholderTextColor={colors.text.inactive}
            />
          </View>

          <View style={styles.locationContainer}>
            <View style={styles.inputContainer}>
              <MapPin
                size={20}
                color={colors.text.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Your Address"
                value={formData.address}
                onChangeText={(text) =>
                  setFormData({ ...formData, address: text })
                }
                placeholderTextColor={colors.text.inactive}
                multiline
              />
            </View>
            <TouchableOpacity
              style={styles.detectButton}
              onPress={detectCurrentLocation}
              disabled={isDetectingLocation}
            >
              {isDetectingLocation ? (
                <ActivityIndicator size="small" color="#FFF" />
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
                <ActivityIndicator size="small" color="#FFF" />
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
          <Edit3 size={20} color={colors.primary} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Account Information</Text>

        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Mail size={20} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Phone size={20} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user.phone || 'Not provided'}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <MapPin size={20} color={colors.primary} />
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
        <LogOut size={20} color="#FF4D4F" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.background.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  profileSection: {
    backgroundColor: colors.background.white,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    marginTop: 8,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: colors.background.white,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF4D4F',
    marginBottom: 40,
  },
  logoutText: {
    color: '#FF4D4F',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    minHeight: 56,
    color: colors.text.primary,
    fontSize: 16,
  },
  locationContainer: {
    marginBottom: 16,
  },
  detectButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  detectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
