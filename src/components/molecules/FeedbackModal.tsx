import React from 'react';
import {Modal, View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {getResponsiveValue} from '../../utils/responsive';
import fontVariants from '../../utils/fonts';

interface FeedbackModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText: string;
  onButtonPress: () => void;
  type?: 'success' | 'error';
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  title,
  message,
  buttonText,
  onButtonPress,
  type = 'success',
}) => {
  const {colors} = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onButtonPress}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {backgroundColor: colors.card, borderColor: colors.border},
          ]}>
          <Text
            style={[
              styles.title,
              {color: type === 'success' ? colors.success : colors.error},
              fontVariants.heading3,
            ]}>
            {title}
          </Text>

          <Text
            style={[styles.message, {color: colors.text}, fontVariants.body]}>
            {message}
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor:
                  type === 'success' ? colors.success : colors.error,
              },
            ]}
            onPress={onButtonPress}>
            <Text
              style={[
                styles.buttonText,
                {color: '#FFFFFF'},
                fontVariants.button,
              ]}>
              {buttonText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: getResponsiveValue(20),
  },
  container: {
    width: '90%',
    borderRadius: getResponsiveValue(12),
    overflow: 'hidden',
    borderWidth: 1,
    padding: getResponsiveValue(24),
    alignItems: 'center',
  },
  title: {
    marginBottom: getResponsiveValue(16),
    textAlign: 'center',
  },
  message: {
    marginBottom: getResponsiveValue(24),
    textAlign: 'center',
  },
  button: {
    paddingVertical: getResponsiveValue(12),
    paddingHorizontal: getResponsiveValue(24),
    borderRadius: getResponsiveValue(8),
    minWidth: getResponsiveValue(120),
    alignItems: 'center',
  },
  buttonText: {
    textAlign: 'center',
  },
});

export default FeedbackModal;
