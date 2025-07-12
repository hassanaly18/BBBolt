/**
 * Unified BBBolt Theme System
 * Consolidates colors, typography, spacing, and design tokens
 * Updated to match vendor panel theme with purple and yellow color scheme
 */

const theme = {
  colors: {
    // Primary brand colors - Purple theme from vendor panel
    primary: {
      main: '#4d216d', // Main purple from vendor panel
      light: '#6a2c8f', // Lighter purple
      dark: '#3a1a52', // Darker purple
      contrastText: '#FFFFFF',
    },
    
    // Secondary colors - Yellow theme from vendor panel
    secondary: {
      main: '#ffd600', // Yellow from vendor panel
      light: '#ffe033', // Lighter yellow
      dark: '#e6c100', // Darker yellow
      contrastText: '#000000',
    },
    
    // Text colors - Enhanced for better contrast
    text: {
      primary: '#2c2c2c', // Darker for better readability
      secondary: '#5a5a5a', // Medium gray
      disabled: '#9e9e9e', // Light gray
      hint: '#bdbdbd', // Very light gray
    },
    
    // Background colors - Clean and modern
    background: {
      main: '#f8f9fa', // Very light gray-blue
      white: '#FFFFFF',
      secondary: '#f1f3f4', // Light gray-blue
      paper: '#FFFFFF',
      default: '#f8f9fa',
      card: '#FFFFFF', // For cards and elevated surfaces
    },
    
    // State colors - Enhanced with purple theme
    success: '#4a148c', // Purple success from vendor panel
    error: '#d32f2f', // Red error
    warning: '#ff9800', // Orange warning
    info: '#4d216d', // Purple info from vendor panel
    
    // Utility colors
    border: '#e0e0e0', // Light gray border
    divider: '#4a148c', // Purple divider from vendor panel
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Additional colors for enhanced UI
    surface: {
      primary: '#4d216d',
      secondary: '#ffd600',
      success: '#4a148c',
      error: '#d32f2f',
      warning: '#ff9800',
      info: '#4d216d',
    },
    
    // Gradient colors
    gradients: {
      primary: ['#4d216d', '#6a2c8f'],
      secondary: ['#ffd600', '#ffe033'],
      success: ['#4a148c', '#6a1b9a'],
      card: ['#ffffff', '#f8f9fa'],
    },
  },
  
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
      color: '#2c2c2c',
    },
    h2: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 32,
      color: '#2c2c2c',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
      color: '#2c2c2c',
    },
    h4: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
      color: '#2c2c2c',
    },
    h5: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 22,
      color: '#2c2c2c',
    },
    subtitle1: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22,
      color: '#5a5a5a',
    },
    subtitle2: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
      color: '#5a5a5a',
    },
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      color: '#2c2c2c',
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      color: '#5a5a5a',
    },
    button: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
      color: '#FFFFFF',
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      color: '#9e9e9e',
    },
    overline: {
      fontSize: 10,
      fontWeight: '600',
      lineHeight: 16,
      letterSpacing: 1.5,
      color: '#4d216d',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    circle: 9999,
  },
  
  shadows: {
    none: 'none',
    xs: {
      shadowColor: '#4d216d',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: '#4d216d',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 3,
    },
    md: {
      shadowColor: '#4d216d',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 6,
    },
    lg: {
      shadowColor: '#4d216d',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 10,
    },
    xl: {
      shadowColor: '#4d216d',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 15,
    },
  },
  
  animation: {
    fast: 150,
    normal: 300,
    slow: 450,
  },
  
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
  },
  
  // Enhanced design tokens
  elevation: {
    card: 2,
    button: 1,
    modal: 8,
    tooltip: 4,
  },
  
  // Component-specific styles
  components: {
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      shadow: 'sm',
    },
    button: {
      primary: {
        backgroundColor: '#4d216d',
        color: '#FFFFFF',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
      },
      secondary: {
        backgroundColor: '#ffd600',
        color: '#000000',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#4d216d',
        borderColor: '#4d216d',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
      },
    },
    input: {
      backgroundColor: '#FFFFFF',
      borderColor: '#e0e0e0',
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 16,
    },
  },
};

// Create flat colors structure for backwards compatibility
const flatColors = {
  // Direct color values that the app expects
  primary: theme.colors.primary.main,
  secondary: theme.colors.secondary.main,
  text: theme.colors.text,
  background: theme.colors.background,
  success: theme.colors.success,
  error: theme.colors.error,
  warning: theme.colors.warning,
  info: theme.colors.info,
  border: theme.colors.border,
  divider: theme.colors.divider,
  overlay: theme.colors.overlay,
};

// Legacy color export for backwards compatibility
export const colors = flatColors;

export default theme; 