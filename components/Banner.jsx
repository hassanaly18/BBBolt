import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import theme from '../app/theme';

const Banner = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress || (() => {})}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={{
          uri: 'https://via.placeholder.com/800x300/4d216d/ffffff?text=Discover+Local+Vendors',
        }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.overlay} />
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Discover Local Vendors</Text>
            <Text style={styles.subtitle}>
              Find quality products from trusted local businesses
            </Text>
            <View style={styles.ctaContainer}>
              <Text style={styles.ctaText}>Explore Now</Text>
              <ChevronRight
                size={16}
                color={theme.colors.primary.contrastText}
              />
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 140,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.primary.main, // Fallback color
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
  },
  backgroundImageStyle: {
    borderRadius: theme.borderRadius.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(77, 33, 109, 0.4)', // Primary color with 40% opacity
    borderRadius: theme.borderRadius.lg,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'center',
  },
  textContainer: {
    maxWidth: '80%',
  },
  title: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.primary.contrastText,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.body2.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing.md,
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary.main,
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  ctaText: {
    fontSize: theme.typography.button.fontSize,
    fontWeight: '500',
    color: theme.colors.primary.main,
    marginRight: theme.spacing.xs,
  },
});

export default Banner;
