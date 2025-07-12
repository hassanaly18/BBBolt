// C:\Users\faeiz\Desktop\BBBolt\app\auth\login.jsx
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
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  // State management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({ email: '', password: '' });
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, error } = useAuth();
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
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Email validation
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

  // Password validation
  const validatePassword = (password) => {
    if (!password.trim()) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  // Handle input change with validation
  const handleEmailChange = (text) => {
    setEmail(text);
    setFormErrors((prev) => ({ ...prev, email: validateEmail(text) }));
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    setFormErrors((prev) => ({ ...prev, password: validatePassword(text) }));
  };

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
      Animated.delay(500),
    ]).start(() => {
      // Navigate to home after success animation
      router.replace('/');
    });
  };

  // Handle login process
  const handleLogin = async () => {
    // Validate all inputs
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setFormErrors({
      email: emailError,
      password: passwordError,
    });

    // Return if there are validation errors
    if (emailError || passwordError) {
      shakeAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSubmitting(true);
      animateButtonPress();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await login({ email, password });

      // Show success animation
      setLoginSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      successAnimation();
    } catch (err) {
      console.error('Login failed:', err);

      // Handle different error types
      let errorMessage = 'Error logging in. Please try again.';
      if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Account not found. Please sign up.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Show error and shake animation
      Alert.alert('Login Failed', errorMessage);
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

  // Render function
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

        {/* Login Form */}
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Login to your account to continue shopping
          </Text>

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
              onSubmitEditing={() => passwordInputRef.current?.focus()}
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
              returnKeyType="done"
              onSubmitEditing={handleLogin}
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

          {/* Forgot Password */}
          <View style={styles.forgotContainer}>
            <TouchableOpacity
              onPress={() => {
                // Handle forgot password
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <Animated.View
            style={{
              transform: [{ scale: buttonScale }],
              opacity: buttonOpacity,
            }}
          >
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isSubmitting || loginSuccess}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : loginSuccess ? (
                <Animated.View
                  style={{
                    opacity: successAnim,
                    transform: [{ scale: successAnim }],
                  }}
                >
                  <CheckCircle size={24} color="white" />
                </Animated.View>
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <Link href="/auth/register" asChild>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Success Overlay */}
      {loginSuccess && (
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
            <Text style={styles.successText}>Login Successful!</Text>
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
    marginBottom: theme.spacing.xxl,
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
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
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
    height: 56,
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
    height: 56,
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
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  forgotText: {
    color: theme.colors.primary.main,
    fontSize: theme.typography.body2.fontSize,
    fontWeight: theme.typography.subtitle2.fontWeight,
  },
  loginButton: {
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
  loginButtonText: {
    color: theme.colors.primary.contrastText,
    fontSize: theme.typography.button.fontSize,
    fontWeight: '600',
    letterSpacing: 1,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  registerText: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.text.secondary,
  },
  registerLink: {
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
});
