import {
  useStackNavigation,
  navigateToMainTabs,
  navigateToMapScreen,
} from '../../utils/navigation';
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as ImagePicker from 'react-native-image-picker';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

import Header from '../../components/molecules/Header';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import {useTheme} from '../../contexts/ThemeContext';
import {getResponsiveValue} from '../../utils/responsive';
import fontVariants from '../../utils/fonts';
import {useCreateProduct} from '../../hooks/useApi';
import {productSchema, ProductFormData} from '../../utils/validation';

const AddProductScreen: React.FC = () => {
  const {colors, isDarkMode} = useTheme();
  const createProductMutation = useCreateProduct();
  const navigation = useStackNavigation();

  const [productImages, setProductImages] = useState<any[]>([]);
  const [location, setLocation] = useState({
    name: '',
    longitude: 0,
    latitude: 0,
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: {errors},
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      location: {
        name: '',
        longitude: 0,
        latitude: 0,
      },
    },
  });

  const handleAddImages = () => {
    if (productImages.length >= 5) {
      Alert.alert('Limit Reached', 'You can only add up to 5 images.');
      return;
    }

    Alert.alert(
      'Add Product Images',
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
        setProductImages([...productImages, response.assets[0]]);
      }
    });
  };

  const openGallery = () => {
    const options: ImagePicker.ImageLibraryOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      selectionLimit: 5 - productImages.length,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets) {
        setProductImages([...productImages, ...response.assets]);
      }
    });
  };

  const removeImage = (index: number) => {
    const newImages = [...productImages];
    newImages.splice(index, 1);
    setProductImages(newImages);
  };

  const handleChooseLocation = () => {
    navigateToMapScreen(navigation, {
      initialLocation: location,
      onLocationSelected: selectedLocation => {
        setLocation(selectedLocation);
        setValue('location', selectedLocation);
      },
    });
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (productImages.length === 0) {
        Alert.alert('Error', 'Please add at least one image.');
        return;
      }

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('price', data.price.toString());
      formData.append('location', JSON.stringify(data.location));

      // Add images
      productImages.forEach((image, index) => {
        const fileToUpload = {
          name: image.fileName || `photo_${index}_${Date.now()}.jpg`,
          type: image.type || 'image/jpeg',
          uri:
            Platform.OS === 'ios'
              ? image.uri.replace('file://', '')
              : image.uri,
        };

        formData.append('images', fileToUpload as any);
      });

      await createProductMutation.mutateAsync(formData);

      Alert.alert('Success', 'Product created successfully', [
        {
          text: 'OK',
          onPress: () => {
            navigateToMainTabs(navigation);
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'Failed to create product. Please try again.');
    }
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
            <View style={styles.formContainer}>
              <Controller
                control={control}
                name="title"
                render={({field: {onChange, onBlur, value}}) => (
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.label,
                        {color: colors.text},
                        fontVariants.bodyBold,
                      ]}>
                      Product Title
                    </Text>
                    <Input
                      name="title"
                      control={control}
                      label=""
                      placeholder="Enter product title"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.title?.message}
                    />
                  </View>
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({field: {onChange, onBlur, value}}) => (
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.label,
                        {color: colors.text},
                        fontVariants.bodyBold,
                      ]}>
                      Description
                    </Text>
                    <Input
                      name="description"
                      control={control}
                      label=""
                      placeholder="Enter product description"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.description?.message}
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                )}
              />

              <Controller
                control={control}
                name="price"
                render={({field: {onChange, onBlur, value}}) => (
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.label,
                        {color: colors.text},
                        fontVariants.bodyBold,
                      ]}>
                      Price
                    </Text>
                    <Input
                      name="price"
                      control={control}
                      label=""
                      placeholder="Enter product price"
                      value={value.toString()}
                      onChangeText={text => onChange(parseFloat(text) || 0)}
                      onBlur={onBlur}
                      error={errors.price?.message}
                      keyboardType="numeric"
                    />
                  </View>
                )}
              />

              <View style={styles.inputContainer}>
                <Text
                  style={[
                    styles.label,
                    {color: colors.text},
                    fontVariants.bodyBold,
                  ]}>
                  Location
                </Text>
                <TouchableOpacity
                  style={[
                    styles.locationButton,
                    {borderColor: colors.border, backgroundColor: colors.card},
                  ]}
                  onPress={handleChooseLocation}>
                  <Text style={[{color: colors.text}, fontVariants.body]}>
                    {location.name || 'Select Location'}
                  </Text>
                </TouchableOpacity>
                {errors.location?.name && (
                  <Text
                    style={[
                      styles.errorText,
                      {color: colors.error},
                      fontVariants.caption,
                    ]}>
                    {errors.location.name.message}
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text
                  style={[
                    styles.label,
                    {color: colors.text},
                    fontVariants.bodyBold,
                  ]}>
                  Images ({productImages.length}/5)
                </Text>
                <View style={styles.imagesContainer}>
                  {productImages.map((image, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <Image
                        source={{uri: image.uri}}
                        style={styles.productImage}
                      />
                      <TouchableOpacity
                        style={[
                          styles.removeButton,
                          {backgroundColor: colors.error},
                        ]}
                        onPress={() => removeImage(index)}>
                        <Text style={{color: '#fff'}}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  {productImages.length < 5 && (
                    <TouchableOpacity
                      style={[
                        styles.addImageButton,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                        },
                      ]}
                      onPress={handleAddImages}>
                      <Text style={{fontSize: 24, color: colors.text}}>+</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Button
                title="Add Product"
                onPress={handleSubmit(onSubmit)}
                loading={createProductMutation.isPending}
              />
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
    padding: getResponsiveValue(16),
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
  locationButton: {
    padding: getResponsiveValue(12),
    borderRadius: getResponsiveValue(8),
    borderWidth: 1,
  },
  errorText: {
    marginTop: getResponsiveValue(4),
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: getResponsiveValue(8),
  },
  imageContainer: {
    position: 'relative',
    margin: getResponsiveValue(4),
  },
  productImage: {
    width: getResponsiveValue(80),
    height: getResponsiveValue(80),
    borderRadius: getResponsiveValue(8),
  },
  removeButton: {
    position: 'absolute',
    top: getResponsiveValue(-8),
    right: getResponsiveValue(-8),
    width: getResponsiveValue(24),
    height: getResponsiveValue(24),
    borderRadius: getResponsiveValue(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: getResponsiveValue(80),
    height: getResponsiveValue(80),
    borderRadius: getResponsiveValue(8),
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    margin: getResponsiveValue(4),
  },
});

export default AddProductScreen;
