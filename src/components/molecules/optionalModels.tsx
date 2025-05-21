import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {getResponsiveValue} from '../../utils/responsive';
import fontVariants from '../../utils/fonts';

interface OptionsModalProps {
  visible: boolean;
  title: string;
  options: Array<{
    label: string;
    onPress: () => void;
    destructive?: boolean;
  }>;
  onClose: () => void;
}

const OptionsModal: React.FC<OptionsModalProps> = ({
  visible,
  title,
  options,
  onClose,
}) => {
  console.log('OptionsModal render - visible:', visible);
  const {colors} = useTheme();

  // Use useEffect to log when visibility changes
  React.useEffect(() => {
    console.log('OptionsModal visibility changed to:', visible);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        console.log('Modal back button pressed');
        onClose();
      }}>
      <TouchableWithoutFeedback
        onPress={() => {
          console.log('Modal background pressed');
          onClose();
        }}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.container,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}>
              <Text
                style={[
                  styles.title,
                  {color: colors.text},
                  fontVariants.bodyBold,
                ]}>
                {title}
              </Text>

              <View style={styles.optionsContainer}>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.option,
                      index < options.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      console.log(`Option "${option.label}" pressed`);
                      onClose();
                      setTimeout(() => {
                        option.onPress();
                      }, 100);
                    }}>
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: option.destructive
                            ? colors.error
                            : colors.primary,
                        },
                        fontVariants.body,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.cancelButton, {borderTopColor: colors.border}]}
                onPress={() => {
                  console.log('Cancel button pressed');
                  onClose();
                }}>
                <Text
                  style={[
                    styles.cancelText,
                    {color: colors.text},
                    fontVariants.bodyBold,
                  ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
  },
  title: {
    textAlign: 'center',
    paddingVertical: getResponsiveValue(16),
    paddingHorizontal: getResponsiveValue(16),
  },
  optionsContainer: {
    width: '100%',
  },
  option: {
    paddingVertical: getResponsiveValue(16),
    paddingHorizontal: getResponsiveValue(16),
    width: '100%',
  },
  optionText: {
    textAlign: 'center',
  },
  cancelButton: {
    borderTopWidth: 1,
    paddingVertical: getResponsiveValue(16),
    width: '100%',
  },
  cancelText: {
    textAlign: 'center',
  },
});

export default OptionsModal;
