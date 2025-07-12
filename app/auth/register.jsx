import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from './AuthContext';
import theme from '../constants/theme';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  User,
  Phone,
  MapPin,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  // State management
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: '',
  });
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const { register, error } = useAuth();
  const router = useRouter();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formSlideUp = useRef(new Animated.Value(100)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;

  // Refs for inputs
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // Animation sequences
  useEffect(() => {
    // Initial animations when component mounts
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.parallel([
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.bounce,
        }),
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(formSlideUp, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
    ]).start();

    // Logo continuous rotation
    Animated.loop(
      Animated.timing(logoRotation, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) {
      return 'Full name is required';
    }
    if (name.trim().length < 3) {
      return 'Name should be at least 3 characters';
    }
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Invalid email format';
    }
    return '';
  };

  const validatePhone = (phone) => {
    // Pakistani phone number regex (allows +92 or 0 prefix)
    const pakPhoneRegex = /^(\+92|0)[0-9]{10}$/;
    if (!phone.trim()) {
      return 'Phone number is required';
    }
    if (!pakPhoneRegex.test(phone)) {
      return 'Invalid Pakistani phone format (e.g., +923001234567 or 03001234567)';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password.trim()) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    // Check for complexity (optional)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUpperCase || !hasNumber) {
      return 'Password must contain at least one uppercase letter and one number';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword.trim()) {
      return 'Please confirm your password';
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    return '';
  };

  const validateLocation = () => {
    if (!address.trim() || !location) {
      return 'Location is required';
    }
    return '';
  };

  // Handle input change with validation
  const handleNameChange = (text) => {
    setName(text);
    setFormErrors((prev) => ({ ...prev, name: validateName(text) }));
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    setFormErrors((prev) => ({ ...prev, email: validateEmail(text) }));
  };

  const handlePhoneChange = (text) => {
    setPhone(text);
    setFormErrors((prev) => ({ ...prev, phone: validatePhone(text) }));
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    setFormErrors((prev) => ({ ...prev, password: validatePassword(text) }));
    // Also validate confirm password in case it was previously valid
    if (confirmPassword) {
      setFormErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(confirmPassword),
      }));
    }
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    setFormErrors((prev) => ({
      ...prev,
      confirmPassword: validateConfirmPassword(text),
    }));
  };

  // Handle location detection
  const detectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Permission Denied',
          'Location permission is required to detect your address'
        );
        setFormErrors((prev) => ({
          ...prev,
          location: 'Location permission denied',
        }));
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

        setAddress(formattedAddress);
        setLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setFormErrors((prev) => ({ ...prev, location: '' }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        'Failed to detect location. Please try again or enter your address manually.'
      );
      setFormErrors((prev) => ({
        ...prev,
        location: 'Failed to detect location',
      }));
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Button press animation
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(buttonOpacity, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  // Shake animation for error
  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    ]).start();
  };

  // Success animation
  const successAnimation = () => {
    Animated.sequence([
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.delay(1500),
    ]).start(() => {
      // Navigate to login after success animation
      router.replace('/auth/login');
    });
  };

  // Validate form and handle registration
  const handleRegister = async () => {
    // Validate all inputs
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const phoneError = validatePhone(phone);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    const locationError = validateLocation();

    setFormErrors({
      name: nameError,
      email: emailError,
      phone: phoneError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      location: locationError,
    });

    // Check if there are any errors
    if (
      nameError ||
      emailError ||
      phoneError ||
      passwordError ||
      confirmPasswordError ||
      locationError
    ) {
      shakeAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSubmitting(true);
      animateButtonPress();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const userData = {
        name,
        email,
        password,
        phone,
        address,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      await register(userData);

      // Show success animation
      setRegisterSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      successAnimation();
    } catch (err) {
      console.error('Registration failed:', err);

      // Handle different error types
      let errorMessage = 'Error creating account. Please try again.';
      if (err.response?.status === 409) {
        errorMessage = 'Email or phone number already exists.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Show error and shake animation
      Alert.alert('Registration Failed', errorMessage);
      shakeAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const spin = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <Animated.View
        style={[styles.gradientBackground, { opacity: fadeAnim }]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and App Name */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View
            style={[styles.logoWrapper, { transform: [{ rotate: spin }] }]}
          >
            <Image
              source={{
                uri: 'https://img.icons8.com/color/96/grocery-bag.png',
              }}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
          <Animated.Text
            style={[
              styles.appName,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            Buy Bye
          </Animated.Text>
        </Animated.View>

        {/* Registration Form */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: formOpacity,
              transform: [
                { translateY: formSlideUp },
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Register to start your shopping journey
          </Text>

          {/* Name Input */}
          <View
            style={[
              styles.inputContainer,
              formErrors.name ? styles.inputError : {},
            ]}
          >
            <User
              size={20}
              color={
                formErrors.name ? theme.colors.error : theme.colors.primary.main
              }
              style={styles.inputIcon}
            />
            <TextInput
              ref={nameInputRef}
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChangeText={handleNameChange}
              placeholderTextColor={theme.colors.text.hint}
              returnKeyType="next"
              onSubmitEditing={() => emailInputRef.current?.focus()}
              blurOnSubmit={false}
            />
            {formErrors.name ? (
              <AlertCircle
                size={20}
                color={theme.colors.error}
                style={styles.errorIcon}
              />
            ) : name.length > 0 ? (
              <CheckCircle
                size={20}
                color={theme.colors.success.main}
                style={styles.errorIcon}
              />
            ) : null}
          </View>
          {formErrors.name ? (
            <Animated.Text style={styles.errorText}>
              {formErrors.name}
            </Animated.Text>
          ) : null}

          {/* Email Input */}
          <View
            style={[
              styles.inputContainer,
              formErrors.email ? styles.inputError : {},
            ]}
          >
            <Mail
              size={20}
              color={
                formErrors.email
                  ? theme.colors.error
                  : theme.colors.primary.main
              }
              style={styles.inputIcon}
            />
            <TextInput
              ref={emailInputRef}
              style={styles.input}
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={handleEmailChange}
              placeholderTextColor={theme.colors.text.hint}
              returnKeyType="next"
              onSubmitEditing={() => phoneInputRef.current?.focus()}
              blurOnSubmit={false}
            />
            {formErrors.email ? (
              <AlertCircle
                size={20}
                color={theme.colors.error}
                style={styles.errorIcon}
              />
            ) : email.length > 0 ? (
              <CheckCircle
                size={20}
                color={theme.colors.success.main}
                style={styles.errorIcon}
              />
            ) : null}
          </View>
          {formErrors.email ? (
            <Animated.Text style={styles.errorText}>
              {formErrors.email}
            </Animated.Text>
          ) : null}

          {/* Phone Input */}
          <View
            style={[
              styles.inputContainer,
              formErrors.phone ? styles.inputError : {},
            ]}
          >
            <Phone
              size={20}
              color={
                formErrors.phone
                  ? theme.colors.error
                  : theme.colors.primary.main
              }
              style={styles.inputIcon}
            />
            <TextInput
              ref={phoneInputRef}
              style={styles.input}
              placeholder="Phone Number (e.g. +923001234567)"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={handlePhoneChange}
              placeholderTextColor={theme.colors.text.hint}
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              blurOnSubmit={false}
            />
            {formErrors.phone ? (
              <AlertCircle
                size={20}
                color={theme.colors.error}
                style={styles.errorIcon}
              />
            ) : phone.length > 0 ? (
              <CheckCircle
                size={20}
                color={theme.colors.success.main}
                style={styles.errorIcon}
              />
            ) : null}
          </View>
          {formErrors.phone ? (
            <Animated.Text style={styles.errorText}>
              {formErrors.phone}
            </Animated.Text>
          ) : null}

          {/* Password Input */}
          <View
            style={[
              styles.inputContainer,
              formErrors.password ? styles.inputError : {},
            ]}
          >
            <Lock
              size={20}
              color={
                formErrors.password
                  ? theme.colors.error
                  : theme.colors.primary.main
              }
              style={styles.inputIcon}
            />
            <TextInput
              ref={passwordInputRef}
              style={styles.input}
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={handlePasswordChange}
              placeholderTextColor={theme.colors.text.hint}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => {
                setShowPassword(!showPassword);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              {showPassword ? (
                <EyeOff size={20} color={theme.colors.primary.main} />
              ) : (
                <Eye size={20} color={theme.colors.primary.main} />
              )}
            </TouchableOpacity>
          </View>
          {formErrors.password ? (
            <Animated.Text style={styles.errorText}>
              {formErrors.password}
            </Animated.Text>
          ) : null}

          {/* Confirm Password Input */}
          <View
            style={[
              styles.inputContainer,
              formErrors.confirmPassword ? styles.inputError : {},
            ]}
          >
            <Lock
              size={20}
              color={
                formErrors.confirmPassword
                  ? theme.colors.error
                  : theme.colors.primary.main
              }
              style={styles.inputIcon}
            />
            <TextInput
              ref={confirmPasswordInputRef}
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              placeholderTextColor={theme.colors.text.hint}
              returnKeyType="done"
            />
            {formErrors.confirmPassword ? (
              <AlertCircle
                size={20}
                color={theme.colors.error}
                style={styles.errorIcon}
              />
            ) : confirmPassword.length > 0 ? (
              <CheckCircle
                size={20}
                color={theme.colors.success.main}
                style={styles.errorIcon}
              />
            ) : null}
          </View>
          {formErrors.confirmPassword ? (
            <Animated.Text style={styles.errorText}>
              {formErrors.confirmPassword}
            </Animated.Text>
          ) : null}

          {/* Location Input */}
          <View style={styles.locationContainer}>
            <View
              style={[
                styles.inputContainer,
                formErrors.location ? styles.inputError : {},
              ]}
            >
              <MapPin
                size={20}
                color={
                  formErrors.location
                    ? theme.colors.error
                    : theme.colors.primary.main
                }
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Your Address"
                value={address}
                onChangeText={(text) => {
                  setAddress(text);
                  if (location && text.trim()) {
                    setFormErrors((prev) => ({ ...prev, location: '' }));
                  }
                }}
                placeholderTextColor={theme.colors.text.hint}
                multiline
              />
              {formErrors.location ? (
                <AlertCircle
                  size={20}
                  color={theme.colors.error}
                  style={styles.errorIcon}
                />
              ) : address.length > 0 && location ? (
                <CheckCircle
                  size={20}
                  color={theme.colors.success.main}
                  style={styles.errorIcon}
                />
              ) : null}
            </View>
            {formErrors.location ? (
              <Animated.Text style={styles.errorText}>
                {formErrors.location}
              </Animated.Text>
            ) : null}
            <TouchableOpacity
              style={styles.detectButton}
              onPress={detectCurrentLocation}
              disabled={isDetectingLocation}
              activeOpacity={0.8}
            >
              {isDetectingLocation ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.detectButtonText}>Detect Location</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <Animated.View
            style={{
              transform: [{ scale: buttonScale }],
              opacity: buttonOpacity,
            }}
          >
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isSubmitting || registerSuccess}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : registerSuccess ? (
                <Animated.View
                  style={{
                    opacity: successAnim,
                    transform: [{ scale: successAnim }],
                  }}
                >
                  <CheckCircle size={24} color="white" />
                </Animated.View>
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Success Overlay */}
      {registerSuccess && (
        <Animated.View
          style={[styles.successOverlay, { opacity: successAnim }]}
        >
          <Animated.View
            style={[
              styles.successIcon,
              {
                opacity: successAnim,
                transform: [{ scale: successAnim }],
              },
            ]}
          >
            <CheckCircle size={80} color="white" />
            <Text style={styles.successText}>Registration Successful!</Text>
            <Text style={styles.successSubtext}>
              Redirecting to login page...
            </Text>
          </Animated.View>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background.default,
    borderRadius: 0,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoWrapper: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.circle,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: theme.colors.primary.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 60,
    height: 60,
  },
  appName: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.primary.main,
    marginTop: theme.spacing.md,
    textShadowColor: 'rgba(77, 33, 109, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    minHeight: 56,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    shadowColor: theme.colors.primary.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputError: {
    borderColor: theme.colors.error,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  errorIcon: {
    marginLeft: theme.spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 56,
    color: theme.colors.text.primary,
    fontSize: theme.typography.body1.fontSize,
  },
  passwordToggle: {
    padding: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.caption.fontSize,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.md,
  },
  locationContainer: {
    marginBottom: theme.spacing.md,
  },
  detectButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    shadowColor: theme.colors.primary.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  detectButtonText: {
    color: theme.colors.primary.contrastText,
    fontSize: theme.typography.button.fontSize,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  registerButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.primary.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  registerButtonText: {
    color: theme.colors.primary.contrastText,
    fontSize: theme.typography.button.fontSize,
    fontWeight: '600',
    letterSpacing: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  loginText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.text.secondary,
  },
  loginLink: {
    fontSize: theme.typography.body2.fontSize,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  successIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  successSubtext: {
    color: 'white',
    fontSize: 16,
    marginTop: 8,
    opacity: 0.9,
  },
});