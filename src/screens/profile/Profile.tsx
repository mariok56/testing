import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as ImagePicker from 'react-native-image-picker';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

import {MainTabParamList} from '../../types/navigation';
import Header from '../../components/molecules/Header';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import {useTheme} from '../../contexts/ThemeContext';
import {getResponsiveValue} from '../../utils/responsive';
import fontVariants from '../../utils/fonts';
import {useAuthStore} from '../../store/authStore';
import {useUserProfile, useUpdateProfile} from '../../hooks/useApi';
import {profileSchema, ProfileFormData} from '../../utils/validation';

type Props = NativeStackScreenProps<MainTabParamList, 'Profile'>;

const ProfileScreen: React.FC<Props> = () => {
  const {colors, isDarkMode} = useTheme();
  const {logout, updateProfile: updateAuthProfile} = useAuthStore();
  const {data: profileData, refetch} = useUserProfile();
  const updateProfileMutation = useUpdateProfile();

  const [selectedImage, setSelectedImage] = useState<any>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
    },
  });

  // Update form with user data when loaded
  useEffect(() => {
    if (profileData?.user) {
      const user = profileData.user;
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [profileData, reset]);

  const handleChoosePhoto = () => {
    Alert.alert(
      'Profile Photo',
      'Choose a source',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Camera',
          onPress: () => openCamera(),
        },
        {
          text: 'Photo Library',
          onPress: () => openGallery(),
        },
      ],
      {cancelable: true},
    );
  };

  const openCamera = () => {
    const options: ImagePicker.CameraOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        console.log('Camera Error: ', response.errorMessage);
      } else if (response.assets && response.assets[0]) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  const openGallery = () => {
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets[0]) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const formData = new FormData();
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);

      if (selectedImage) {
        const fileToUpload = {
          name: selectedImage.fileName || `photo_${Date.now()}.jpg`,
          type: selectedImage.type || 'image/jpeg',
          uri:
            Platform.OS === 'ios'
              ? selectedImage.uri.replace('file://', '')
              : selectedImage.uri,
        };

        formData.append('profileImage', fileToUpload as any);
      }

      await updateProfileMutation.mutateAsync(formData);

      // Also update the auth store
      await updateAuthProfile(data.firstName, data.lastName, selectedImage);

      Alert.alert('Success', 'Profile updated successfully');
      refetch(); // Refresh profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
      {cancelable: true},
    );
  };

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={true}
      />
      <SafeAreaView
        style={[styles.container, {backgroundColor: colors.background}]}
        edges={['top']}>
        <Header showBackButton={false} />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={handleChoosePhoto}>
              {selectedImage ? (
                <Image
                  source={{uri: selectedImage.uri}}
                  style={styles.profileImage}
                />
              ) : profileData?.user?.profileImage ? (
                <Image
                  source={{
                    uri:
                      typeof profileData.user.profileImage === 'string'
                        ? profileData.user.profileImage
                        : profileData.user.profileImage.url,
                  }}
                  style={styles.profileImage}
                />
              ) : (
                <View
                  style={[
                    styles.placeholderImage,
                    {backgroundColor: colors.border},
                  ]}>
                  <Text
                    style={[
                      styles.placeholderText,
                      {color: colors.background},
                    ]}>
                    {profileData?.user?.firstName?.charAt(0) || ''}
                    {profileData?.user?.lastName?.charAt(0) || ''}
                  </Text>
                </View>
              )}

              <View
                style={[styles.editBadge, {backgroundColor: colors.primary}]}>
                <Text style={{color: '#fff'}}>✎</Text>
              </View>
            </TouchableOpacity>

            <Text
              style={[
                styles.emailText,
                {color: colors.text},
                fontVariants.body,
              ]}>
              {profileData?.user?.email}
            </Text>

            <View style={styles.formContainer}>
              <Controller
                control={control}
                name="firstName"
                render={({field: {onChange, onBlur, value}}) => (
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.label,
                        {color: colors.text},
                        fontVariants.bodyBold,
                      ]}>
                      First Name
                    </Text>
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
                  </View>
                )}
              />

              <Controller
                control={control}
                name="lastName"
                render={({field: {onChange, onBlur, value}}) => (
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.label,
                        {color: colors.text},
                        fontVariants.bodyBold,
                      ]}>
                      Last Name
                    </Text>
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
                  </View>
                )}
              />

              <Button
                title="Update Profile"
                onPress={handleSubmit(onSubmit)}
                loading={updateProfileMutation.isPending}
              />

              <Button title="Logout" onPress={handleLogout} variant="outline" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
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
  profileImageContainer: {
    position: 'relative',
    marginBottom: getResponsiveValue(24),
  },
  profileImage: {
    width: getResponsiveValue(120),
    height: getResponsiveValue(120),
    borderRadius: getResponsiveValue(60),
  },
  placeholderImage: {
    width: getResponsiveValue(120),
    height: getResponsiveValue(120),
    borderRadius: getResponsiveValue(60),
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: getResponsiveValue(36),
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: getResponsiveValue(36),
    height: getResponsiveValue(36),
    borderRadius: getResponsiveValue(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailText: {
    marginBottom: getResponsiveValue(32),
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: getResponsiveValue(16),
  },
  label: {
    marginBottom: getResponsiveValue(8),
  },
});

export default ProfileScreen;
