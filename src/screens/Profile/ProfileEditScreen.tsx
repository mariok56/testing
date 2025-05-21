import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {useNavigation} from '@react-navigation/native';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
} from 'react-native-image-picker';

import Header from '../../components/molecules/Header';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import OptionsModal from '../../components/molecules/optionalModels';
import FeedbackModal from '../../components/molecules/FeedbackModal';
import {useTheme} from '../../contexts/ThemeContext';
import {getResponsiveValue} from '../../utils/responsive';
import fontVariants from '../../utils/fonts';
import {profileEditSchema} from '../../utils/validation';
import {useUserProfile, useUpdateProfile} from '../../hooks/useAuth';
import {ImageFile} from '../../types/auth';

interface ProfileEditForm {
  firstName: string;
  lastName: string;
}

const ProfileEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const [profileImage, setProfileImage] = useState<ImageFile | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Modal states
  const [isImagePickerVisible, setImagePickerVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Get current user profile
  const {
    data: user,
    isLoading: profileLoading,
    isError: profileError,
    refetch,
  } = useUserProfile();

  // Update profile mutation
  const updateProfileMutation = useUpdateProfile();

  const {
    control,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm<ProfileEditForm>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
    },
  });

  // Set form values when user data is loaded
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });

      // Set initial image preview if user has a profile image
      if (user.profileImage?.url) {
        setImagePreview(
          `https://backend-practice.eurisko.me${user.profileImage.url}`,
        );
      }
    }
  }, [user, reset]);

  const selectImageFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
      });

      handleImagePickerResponse(result);
    } catch (error) {
      console.error('Error selecting image from gallery:', error);
      setErrorMessage('Failed to access photo library');
      setShowErrorModal(true);
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
      });

      handleImagePickerResponse(result);
    } catch (error) {
      console.error('Error taking photo with camera:', error);
      setErrorMessage('Failed to access camera');
      setShowErrorModal(true);
    }
  };

  const handleImagePickerResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.errorCode) {
      console.log('ImagePicker Error: ', response.errorMessage);
      setErrorMessage('Failed to pick image');
      setShowErrorModal(true);
    } else if (response.assets && response.assets[0]) {
      const selectedImage = response.assets[0];

      // Set image for form submission
      setProfileImage({
        uri: selectedImage.uri || '',
        type: selectedImage.type || 'image/jpeg',
        fileName: selectedImage.fileName || 'profile.jpg',
        fileSize: selectedImage.fileSize,
      });

      // Set preview
      if (selectedImage.uri) {
        setImagePreview(selectedImage.uri);
      }
    }
  };

  // Show image picker options modal
  const showImagePickerOptions = () => {
    setImagePickerVisible(true);
  };

  const onSubmit = async (data: ProfileEditForm) => {
    try {
      await updateProfileMutation.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        profileImage: profileImage || undefined,
      });

      // Refresh user profile data
      await refetch();

      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      // Show error modal
      setErrorMessage(error.message || 'Failed to update profile');
      setShowErrorModal(true);
    }
  };

  if (profileLoading) {
    return (
      <SafeAreaView
        style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title="Edit Profile" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              styles.loadingText,
              {color: colors.text},
              fontVariants.body,
            ]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profileError) {
    return (
      <SafeAreaView
        style={[styles.container, {backgroundColor: colors.background}]}>
        <Header title="Edit Profile" showBackButton={true} />
        <View style={styles.errorContainer}>
          <Text
            style={[
              styles.errorText,
              {color: colors.error},
              fontVariants.body,
            ]}>
            Failed to load profile. Please try again.
          </Text>
          <Button title="Try Again" onPress={() => refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Edit Profile" showBackButton={true} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Changed from TouchableOpacity to View */}
          <View style={styles.imageContainer}>
            {imagePreview ? (
              <Image source={{uri: imagePreview}} style={styles.profileImage} />
            ) : (
              <View
                style={[
                  styles.placeholderImage,
                  {backgroundColor: colors.border},
                ]}>
                <Text style={[styles.placeholderText, {color: colors.text}]}>
                  {user?.firstName?.charAt(0) || ''}
                  {user?.lastName?.charAt(0) || ''}
                </Text>
              </View>
            )}
            {/* Added onPress directly to this button */}
            <TouchableOpacity
              style={[
                styles.changePhotoButton,
                {backgroundColor: colors.primary},
              ]}
              onPress={showImagePickerOptions}>
              <Text
                style={[
                  styles.changePhotoText,
                  {color: colors.card},
                  fontVariants.caption,
                ]}>
                Change
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text
              style={[
                styles.label,
                {color: colors.text},
                fontVariants.bodyBold,
              ]}>
              First Name
            </Text>
            <Controller
              control={control}
              name="firstName"
              render={({field: {onChange, onBlur, value}}) => (
                <Input
                  name="firstName"
                  control={control}
                  label=""
                  placeholder="Enter your first name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.firstName?.message}
                />
              )}
            />

            <Text
              style={[
                styles.label,
                {color: colors.text},
                fontVariants.bodyBold,
              ]}>
              Last Name
            </Text>
            <Controller
              control={control}
              name="lastName"
              render={({field: {onChange, onBlur, value}}) => (
                <Input
                  name="lastName"
                  control={control}
                  label=""
                  placeholder="Enter your last name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.lastName?.message}
                />
              )}
            />

            <Button
              title="Save Changes"
              onPress={handleSubmit(onSubmit)}
              loading={updateProfileMutation.isPending}
            />
          </View>
        </View>
      </ScrollView>

      {/* Custom image picker modal */}
      <OptionsModal
        visible={isImagePickerVisible}
        title="Change Profile Photo"
        options={[
          {
            label: 'Take Photo',
            onPress: takePhotoWithCamera,
          },
          {
            label: 'Choose from Gallery',
            onPress: selectImageFromGallery,
          },
        ]}
        onClose={() => setImagePickerVisible(false)}
      />

      {/* Success modal */}
      <FeedbackModal
        visible={showSuccessModal}
        title="Success"
        message="Profile updated successfully"
        buttonText="OK"
        type="success"
        onButtonPress={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
      />

      {/* Error modal */}
      <FeedbackModal
        visible={showErrorModal}
        title="Error"
        message={errorMessage}
        buttonText="OK"
        type="error"
        onButtonPress={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: getResponsiveValue(24),
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: getResponsiveValue(32),
  },
  profileImage: {
    width: getResponsiveValue(150),
    height: getResponsiveValue(150),
    borderRadius: getResponsiveValue(75),
  },
  placeholderImage: {
    width: getResponsiveValue(150),
    height: getResponsiveValue(150),
    borderRadius: getResponsiveValue(75),
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: getResponsiveValue(40),
    fontWeight: 'bold',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: getResponsiveValue(12),
    paddingVertical: getResponsiveValue(6),
    borderRadius: getResponsiveValue(20),
  },
  changePhotoText: {
    color: '#fff',
    fontSize: getResponsiveValue(12),
  },
  form: {
    width: '100%',
  },
  label: {
    marginBottom: getResponsiveValue(8),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveValue(20),
  },
  loadingText: {
    marginTop: getResponsiveValue(16),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveValue(20),
  },
  errorText: {
    marginBottom: getResponsiveValue(16),
    textAlign: 'center',
  },
});

export default ProfileEditScreen;
