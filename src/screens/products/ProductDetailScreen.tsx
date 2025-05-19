import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Swiper from 'react-native-swiper';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import RNFS from 'react-native-fs';
import email from 'react-native-email';
import ImageViewer from 'react-native-image-zoom-viewer';
import {IImageInfo} from 'react-native-image-zoom-viewer/built/image-viewer.type';
import {useRoute, RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../../types/navigation';
import Header from '../../components/molecules/Header';
import Button from '../../components/atoms/Button';
import {useTheme} from '../../contexts/ThemeContext';
import {getResponsiveValue} from '../../utils/responsive';
import fontVariants from '../../utils/fonts';
import {useProduct, useDeleteProduct} from '../../hooks/useApi';
import {useAuthStore} from '../../store/authStore';
import {useStackNavigation} from '../../utils/navigation';

const ProductDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'ProductDetail'>>();
  const {productId} = route.params;
  const {colors, isDarkMode} = useTheme();
  const navigation = useStackNavigation();
  const user = useAuthStore(state => state.user);
  const deleteProductMutation = useDeleteProduct();

  // Use the React Query hook to fetch product details
  const {
    data: productData,
    isLoading,
    isError,
    error,
    refetch,
  } = useProduct(productId);

  // State for image viewer
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Extract the product from the response
  const product = productData?.data;

  // Check if current user is the product owner
  const isOwner = product?.user?.email === user?.email;

  const handleShare = async () => {
    if (product) {
      try {
        await Share.share({
          message: `Check out ${product.title} for $${product.price}!`,
          title: product.title,
        });
      } catch (error) {
        console.error('Error sharing product:', error);
      }
    }
  };

  const handleAddToCart = () => {
    // This would add the product to cart in a real app
    Alert.alert('Success', `${product?.title} added to cart!`);
  };

  const handleDeleteProduct = () => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProductMutation.mutateAsync(productId);
              Alert.alert('Success', 'Product deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert(
                'Error',
                'Failed to delete product. Please try again.',
              );
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  const handleEditProduct = () => {
    navigation.navigate('EditProduct', {productId});
  };

  const handleContactSeller = () => {
    if (product?.user?.email) {
      email([product.user.email], {
        subject: `Inquiry about: ${product.title}`,
        body: `I'm interested in your product "${product.title}" priced at $${product.price}.`,
      }).catch(console.error);
    }
  };

  const handleImageLongPress = async (imageUrl: string, index: number) => {
    Alert.alert(
      'Save Image',
      'Do you want to save this image to your device?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: async () => {
            try {
              // Get the filename from the URL
              const filename = imageUrl.substring(
                imageUrl.lastIndexOf('/') + 1,
              );
              const fileExtension = filename.includes('.')
                ? filename.substring(filename.lastIndexOf('.'))
                : '.jpg';

              // Define the path where the image will be saved
              const destinationPath =
                Platform.OS === 'android'
                  ? `${RNFS.PicturesDirectoryPath}/${product?.title}_${index}${fileExtension}`
                  : `${RNFS.DocumentDirectoryPath}/${product?.title}_${index}${fileExtension}`;

              // Download the image
              const response = await RNFS.downloadFile({
                fromUrl: imageUrl,
                toFile: destinationPath,
              }).promise;

              if (response.statusCode === 200) {
                // For iOS, move to camera roll
                if (Platform.OS === 'ios') {
                  await CameraRoll.save(destinationPath);
                }

                Alert.alert('Success', 'Image saved to your device.');
              } else {
                throw new Error('Download failed');
              }
            } catch (error) {
              console.error('Error saving image:', error);
              Alert.alert('Error', 'Failed to save image. Please try again.');
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  // Format images for the ImageViewer component
  const images: IImageInfo[] =
    product?.images.map(img => ({
      url: img.url,
    })) || [];

  if (isLoading) {
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

  if (isError || !product) {
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
              {error instanceof Error
                ? error.message
                : 'Failed to load product'}
            </Text>
            <Button
              title="Try Again"
              onPress={() => refetch()}
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
        <Header
          title={product.title}
          showBackButton
          rightComponent={
            isOwner ? (
              <TouchableOpacity
                onPress={handleEditProduct}
                style={styles.editButton}>
                <Text style={{fontSize: 16, color: colors.primary}}>Edit</Text>
              </TouchableOpacity>
            ) : null
          }
        />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Image Swiper */}
          <View style={styles.swiperContainer}>
            <Swiper
              style={styles.swiper}
              showsButtons={false}
              loop={true}
              autoplay={false}
              dot={
                <View
                  style={[
                    styles.dot,
                    {backgroundColor: 'rgba(255,255,255,.3)'},
                  ]}
                />
              }
              activeDot={
                <View style={[styles.dot, {backgroundColor: '#fff'}]} />
              }
              onIndexChanged={setCurrentImageIndex}>
              {product.images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.slide}
                  onPress={() => setIsImageViewerVisible(true)}
                  onLongPress={() => handleImageLongPress(image.url, index)}>
                  <FastImage
                    source={{uri: image.url}}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </Swiper>
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1}/{product.images.length}
              </Text>
            </View>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  {color: colors.text},
                  fontVariants.heading2,
                ]}>
                {product.title}
              </Text>
              <Text
                style={[
                  styles.price,
                  {color: colors.primary},
                  fontVariants.heading2,
                ]}>
                ${product.price.toFixed(2)}
              </Text>
            </View>

            <Text
              style={[
                styles.description,
                {color: colors.text},
                fontVariants.body,
              ]}>
              {product.description}
            </Text>

            {/* Location Map */}
            {product.location && (
              <View style={styles.mapSection}>
                <Text
                  style={[
                    styles.sectionTitle,
                    {color: colors.text},
                    fontVariants.bodyBold,
                  ]}>
                  Location
                </Text>
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                      latitude: product.location.latitude,
                      longitude: product.location.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}>
                    <Marker
                      coordinate={{
                        latitude: product.location.latitude,
                        longitude: product.location.longitude,
                      }}
                      title={product.location.name}
                    />
                  </MapView>
                  <Text
                    style={[
                      styles.locationName,
                      {color: colors.text},
                      fontVariants.caption,
                    ]}>
                    {product.location.name}
                  </Text>
                </View>
              </View>
            )}

            {/* Seller information */}
            {product.user && (
              <View
                style={[styles.sellerSection, {borderColor: colors.border}]}>
                <Text
                  style={[
                    styles.sectionTitle,
                    {color: colors.text},
                    fontVariants.bodyBold,
                  ]}>
                  Seller Information
                </Text>
                <View style={styles.sellerInfo}>
                  <View
                    style={[
                      styles.sellerAvatar,
                      {backgroundColor: colors.primary},
                    ]}>
                    <Text style={styles.sellerInitials}>
                      {product.user.firstName?.charAt(0) || ''}
                      {product.user.lastName?.charAt(0) || ''}
                    </Text>
                  </View>
                  <View style={styles.sellerDetails}>
                    <Text
                      style={[
                        styles.sellerName,
                        {color: colors.text},
                        fontVariants.bodyBold,
                      ]}>
                      {product.user.firstName} {product.user.lastName}
                    </Text>
                    <Text
                      style={[
                        styles.sellerEmail,
                        {color: colors.text},
                        fontVariants.caption,
                      ]}>
                      {product.user.email}
                    </Text>
                  </View>
                </View>
                <Button
                  title="Contact Seller"
                  onPress={handleContactSeller}
                  variant="outline"
                />
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.buttonsContainer}>
              {isOwner ? (
                <Button
                  title="Delete Product"
                  onPress={handleDeleteProduct}
                  variant="outline"
                  style={[styles.deleteButton, {borderColor: colors.error}]}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.shareButton, {borderColor: colors.border}]}
                    onPress={handleShare}>
                    <Text
                      style={[
                        styles.shareButtonText,
                        {color: colors.text},
                        fontVariants.button,
                      ]}>
                      Share
                    </Text>
                  </TouchableOpacity>

                  <Button
                    title="Add to Cart"
                    onPress={handleAddToCart}
                    variant="primary"
                  />
                </>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Full screen image viewer */}
        {isImageViewerVisible && (
          <View style={styles.imageViewerContainer}>
            <ImageViewer
              imageUrls={images}
              index={currentImageIndex}
              enableSwipeDown
              onSwipeDown={() => setIsImageViewerVisible(false)}
              onClick={() => setIsImageViewerVisible(false)}
              saveToLocalByLongPress={true}
              menuContext={{saveToLocal: 'Save to device', cancel: 'Cancel'}}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsImageViewerVisible(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
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
    padding: getResponsiveValue(24),
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
  swiperContainer: {
    height: getResponsiveValue(300),
    position: 'relative',
  },
  swiper: {},
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
    marginTop: 3,
    marginBottom: 3,
  },
  imageCounter: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
  },
  contentContainer: {
    padding: getResponsiveValue(16),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveValue(16),
  },
  title: {
    flex: 1,
    marginRight: getResponsiveValue(8),
  },
  price: {},
  description: {
    marginBottom: getResponsiveValue(24),
  },
  sectionTitle: {
    marginBottom: getResponsiveValue(8),
  },
  mapSection: {
    marginBottom: getResponsiveValue(24),
  },
  mapContainer: {
    height: getResponsiveValue(200),
    borderRadius: getResponsiveValue(8),
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  locationName: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 4,
    borderRadius: 4,
    textAlign: 'center',
  },
  sellerSection: {
    marginBottom: getResponsiveValue(24),
    padding: getResponsiveValue(16),
    borderRadius: getResponsiveValue(8),
    borderWidth: 1,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveValue(16),
  },
  sellerAvatar: {
    width: getResponsiveValue(50),
    height: getResponsiveValue(50),
    borderRadius: getResponsiveValue(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveValue(16),
  },
  sellerInitials: {
    color: '#fff',
    fontSize: getResponsiveValue(18),
    fontWeight: 'bold',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    marginBottom: getResponsiveValue(4),
  },
  sellerEmail: {},
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareButton: {
    borderWidth: 1,
    borderRadius: getResponsiveValue(8),
    paddingVertical: getResponsiveValue(12),
    paddingHorizontal: getResponsiveValue(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveValue(8),
  },
  shareButtonText: {},
  deleteButton: {
    width: '100%',
  },
  imageViewerContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 1000,
  },
  closeButton: {
    position: 'absolute',
    top: getResponsiveValue(40),
    right: getResponsiveValue(20),
    width: getResponsiveValue(30),
    height: getResponsiveValue(30),
    borderRadius: getResponsiveValue(15),
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: getResponsiveValue(16),
  },
  editButton: {
    padding: getResponsiveValue(8),
  },
});

export default ProductDetailScreen;
