import {ImagePickerAsset, formatImageForUpload} from '../../types/images';
import {navigateToMapScreen, goBack} from '../../utils/navigationUtils';
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as ImagePicker from 'react-native-image-picker';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

import {RootStackParamList} from '../../types/navigation';
import Header from '../../components/molecules/Header';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import {useTheme} from '../../contexts/ThemeContext';
import {getResponsiveValue} from '../../utils/responsive';
import fontVariants from '../../utils/fonts';
import {useProduct, useUpdateProduct} from '../../hooks/useApi';
import {productSchema, ProductFormData} from '../../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProduct'>;

const EditProductScreen: React.FC<Props> = ({route, navigation}) => {
  const {productId} = route.params;
  const {colors, isDarkMode} = useTheme();

  // Get the product data
  const {
    data: productData,
    isLoading: isProductLoading,
    isError,
  } = useProduct(productId);

  const updateProductMutation = useUpdateProduct();

  // States for form
  const [productImages, setProductImages] = useState<ImagePickerAsset[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [location, setLocation] = useState({
    name: '',
    longitude: 0,
    latitude: 0,
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
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

  // Initialize form when product data is loaded
  useEffect(() => {
    if (productData?.data) {
      const product = productData.data;

      reset({
        title: product.title,
        description: product.description,
        price: product.price,
        location: product.location || {
          name: '',
          longitude: 0,
          latitude: 0,
        },
      });

      if (product.location) {
        setLocation(product.location);
      }

      if (product.images) {
        setExistingImages(product.images.map(img => img.url));
      }
    }
  }, [productData, reset]);

  const handleAddImages = () => {
    if (
      productImages.length + existingImages.length - imagesToDelete.length >=
      5
    ) {
      Alert.alert('Limit Reached', 'You can only have up to 5 images.');
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
      selectionLimit:
        5 -
        (productImages.length + existingImages.length - imagesToDelete.length),
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

  const removeNewImage = (index: number) => {
    const newImages = [...productImages];
    newImages.splice(index, 1);
    setProductImages(newImages);
  };

  const toggleExistingImage = (imageUrl: string) => {
    if (imagesToDelete.includes(imageUrl)) {
      setImagesToDelete(imagesToDelete.filter(url => url !== imageUrl));
    } else {
      // Make sure we're not removing all images
      if (
        existingImages.length -
          imagesToDelete.length -
          1 +
          productImages.length <
        1
      ) {
        Alert.alert('Error', 'You must keep at least one image.');
        return;
      }
      setImagesToDelete([...imagesToDelete, imageUrl]);
    }
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
      // Check if there will be at least one image after the update
      if (
        existingImages.length - imagesToDelete.length + productImages.length <
        1
      ) {
        Alert.alert('Error', 'Please add at least one image.');
        return;
      }

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('price', data.price.toString());
      formData.append('location', JSON.stringify(data.location));

      // Add new images
      productImages.forEach((image, index) => {
        const fileToUpload = formatImageForUpload(image, index);
        formData.append('images', fileToUpload as any);
      });

      // Add image URLs to delete
      if (imagesToDelete.length > 0) {
        formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
      }

      await updateProductMutation.mutateAsync({id: productId, data: formData});

      Alert.alert('Success', 'Product updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            goBack(navigation);
          },
        },
      ]);
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product. Please try again.');
    }
  };

  if (isProductLoading) {
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
          <Header title="Loading..." showBackButton />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={[
                styles.loadingText,
                {color: colors.text},
                fontVariants.body,
              ]}>
              Loading product details...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (isError) {
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
          <Header title="Error" showBackButton />
          <View style={styles.errorContainer}>
            <Text
              style={[
                styles.errorText,
                {color: colors.error},
                fontVariants.bodyBold,
              ]}>
              Failed to load product details. Please try again.
            </Text>
            <Button
              title="Go Back"
              onPress={() => navigation.goBack()}
              variant="primary"
            />
          </View>
        </SafeAreaView>
      </>
    );
  }

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
        <Header title="Edit Product" showBackButton />

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
                  Images (
                  {existingImages.length -
                    imagesToDelete.length +
                    productImages.length}
                  /5)
                </Text>

                {/* Existing images */}
                {existingImages.length > 0 && (
                  <View>
                    <Text
                      style={[
                        styles.subLabel,
                        {color: colors.text},
                        fontVariants.caption,
                      ]}>
                      Current Images
                    </Text>
                    <View style={styles.imagesContainer}>
                      {existingImages.map((imageUrl: string, index: number) => (
                        <View
                          key={`existing-${index}`}
                          style={styles.imageContainer}>
                          <Image
                            source={{uri: imageUrl}}
                            style={[
                              styles.productImage,
                              imagesToDelete.includes(imageUrl) &&
                                styles.imageMarkedForDeletion,
                            ]}
                          />
                          <TouchableOpacity
                            style={[
                              styles.removeButton,
                              {
                                backgroundColor: imagesToDelete.includes(
                                  imageUrl,
                                )
                                  ? colors.primary
                                  : colors.error,
                              },
                            ]}
                            onPress={() => toggleExistingImage(imageUrl)}>
                            <Text style={{color: '#fff'}}>
                              {imagesToDelete.includes(imageUrl) ? '↩' : '✕'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* New images */}
                {productImages.length > 0 && (
                  <View>
                    <Text
                      style={[
                        styles.subLabel,
                        {color: colors.text},
                        fontVariants.caption,
                      ]}>
                      New Images
                    </Text>
                    <View style={styles.imagesContainer}>
                      {productImages.map((image, index) => (
                        <View
                          key={`new-${index}`}
                          style={styles.imageContainer}>
                          <Image
                            source={{uri: image.uri}}
                            style={styles.productImage}
                          />
                          <TouchableOpacity
                            style={[
                              styles.removeButton,
                              {backgroundColor: colors.error},
                            ]}
                            onPress={() => removeNewImage(index)}>
                            <Text style={{color: '#fff'}}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {existingImages.length -
                  imagesToDelete.length +
                  productImages.length <
                  5 && (
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
                    <Text
                      style={[
                        styles.addImageText,
                        {color: colors.text},
                        fontVariants.caption,
                      ]}>
                      Add Image
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <Button
                title="Update Product"
                onPress={handleSubmit(onSubmit)}
                loading={updateProductMutation.isPending}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: getResponsiveValue(16),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveValue(24),
  },
  errorText: {
    marginBottom: getResponsiveValue(24),
    textAlign: 'center',
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
  subLabel: {
    marginTop: getResponsiveValue(8),
    marginBottom: getResponsiveValue(4),
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
  imageMarkedForDeletion: {
    opacity: 0.3,
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
    width: '100%',
    height: getResponsiveValue(80),
    borderRadius: getResponsiveValue(8),
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getResponsiveValue(8),
  },
  addImageText: {
    marginTop: getResponsiveValue(4),
  },
});

export default EditProductScreen;
