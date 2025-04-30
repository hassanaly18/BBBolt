import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import theme from '../app/theme';

const { height } = Dimensions.get('window');

const SortModal = ({
  isVisible,
  onClose,
  selectedSort,
  onSelect,
  options = {},
}) => {
  const [animation] = React.useState(new Animated.Value(0));

  useEffect(() => {
    if (isVisible) {
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, animation]);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const handleSortSelect = (key) => {
    onSelect(key);
    // onClose is handled by the parent component after selection
  };

  const renderSortOption = (label, key) => (
    <TouchableOpacity
      key={key}
      style={[styles.option, selectedSort === key && styles.selectedOption]}
      onPress={() => handleSortSelect(key)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.optionText,
          selectedSort === key && styles.selectedOptionText,
        ]}
      >
        {label}
      </Text>
      {selectedSort === key && (
        <Check size={20} color={theme.colors.primary.main} />
      )}
    </TouchableOpacity>
  );

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <Text style={styles.title}>Sort by</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.optionsContainer}>
            {Object.entries(options).map(([key, label]) =>
              renderSortOption(label, key)
            )}
          </View>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.background.default,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    paddingBottom: theme.spacing.lg,
    // Add shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    // Add elevation for Android
    elevation: 5,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.text.disabled,
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.background.paper,
    marginBottom: theme.spacing.md,
  },
  optionsContainer: {
    paddingHorizontal: theme.spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  selectedOption: {
    backgroundColor: `${theme.colors.primary.main}15`, // 15% opacity of primary color
  },
  optionText: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.primary,
  },
  selectedOptionText: {
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
});

export default SortModal;
