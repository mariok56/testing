import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RootStackParamList} from '../../types/navigation';
import Header from '../../components/molecules/Header';
import {useTheme} from '../../contexts/ThemeContext';
import {getResponsiveValue} from '../../utils/responsive';
import fontVariants from '../../utils/fonts';
import {useProducts, useDeleteProduct} from '../../hooks/useApi';
import {useAuthStore} from '../../store/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'MyProducts'>;

const MyProductsScreen: React.FC<Props> = ({navigation}) => {
  const {colors, isDarkMode} = useTheme();
  const user = useAuthStore(state => state.user);
  const deleteProductMutation = useDeleteProduct();

  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch only the user's products
  const {
    data: productsData,
    isLoading,
    isError,
    error,
    refetch,
    isPreviousData,
  } = useProducts(page, limit, undefined, undefined, undefined, 'desc');

  // Filter products to only show user's products
  const userProducts =
    productsData?.data.filter(product => product.user?.email === user?.email) ||
    [];

  const handleRefresh = () => {
    refetch();
  };

  const handleViewProduct = (productId: string) => {
    navigation.navigate('ProductDetail', {productId});
  };

  const handleEditProduct = (productId: string) => {
    navigation.navigate('EditProduct', {productId});
  };

  const handleDeleteProduct = (productId: string) => {
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
              refetch(); // Refresh the list
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

  const handleAddProduct = () => {
    navigation.navigate('AddProduct');
  };

  const renderItem = ({item}: {item: any}) => (
    <View
      style={[
        styles.productCard,
        {backgroundColor: colors.card, borderColor: colors.border},
      ]}>
      <TouchableOpacity
        style={styles.productContent}
        onPress={() => handleViewProduct(item._id)}>
        <Image
          source={{uri: item.images[0]?.url}}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text
            style={[
              styles.productTitle,
              {color: colors.text},
              fontVariants.bodyBold,
            ]}
            numberOfLines={1}>
            {item.title}
          </Text>
          <Text
            style={[
              styles.productPrice,
              {color: colors.primary},
              fontVariants.body,
            ]}>
            ${item.price.toFixed(2)}
          </Text>
          <Text
            style={[
              styles.productDescription,
              {color: colors.text},
              fontVariants.caption,
            ]}
            numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: colors.primary}]}
          onPress={() => handleEditProduct(item._id)}>
          <Text style={[styles.actionButtonText, {color: '#fff'}]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: colors.error}]}
          onPress={() => handleDeleteProduct(item._id)}>
          <Text style={[styles.actionButtonText, {color: '#fff'}]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading && !userProducts.length) {
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
          <Header title="My Products" showBackButton={false} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={[
                styles.loadingText,
                {color: colors.text},
                fontVariants.body,
              ]}>
              Loading your products...
            </Text>
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
          title="My Products"
          showBackButton={false}
          rightComponent={
            <TouchableOpacity
              onPress={handleAddProduct}
              style={styles.addButton}>
              <Text style={{fontSize: 24, color: colors.primary}}>+</Text>
            </TouchableOpacity>
          }
        />

        {isError && (
          <View style={styles.errorContainer}>
            <Text
              style={[
                styles.errorText,
                {color: colors.error},
                fontVariants.bodyBold,
              ]}>
              {error instanceof Error
                ? error.message
                : 'Failed to load products'}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, {backgroundColor: colors.primary}]}
              onPress={handleRefresh}>
              <Text style={[styles.retryButtonText, {color: '#fff'}]}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!isError && userProducts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text
              style={[
                styles.emptyText,
                {color: colors.text},
                fontVariants.body,
              ]}>
              You haven't added any products yet.
            </Text>
            <TouchableOpacity
              style={[
                styles.addProductButton,
                {backgroundColor: colors.primary},
              ]}
              onPress={handleAddProduct}>
              <Text
                style={[
                  styles.addProductButtonText,
                  {color: '#fff'},
                  fontVariants.button,
                ]}>
                Add Your First Product
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!isError && userProducts.length > 0 && (
          <FlatList
            data={userProducts}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            refreshing={isLoading}
            onRefresh={handleRefresh}
          />
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
    marginBottom: getResponsiveValue(16),
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: getResponsiveValue(8),
    paddingHorizontal: getResponsiveValue(16),
    borderRadius: getResponsiveValue(8),
  },
  retryButtonText: {
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveValue(24),
  },
  emptyText: {
    marginBottom: getResponsiveValue(16),
    textAlign: 'center',
  },
  addProductButton: {
    paddingVertical: getResponsiveValue(12),
    paddingHorizontal: getResponsiveValue(24),
    borderRadius: getResponsiveValue(8),
  },
  addProductButtonText: {
    fontWeight: 'bold',
  },
  listContent: {
    padding: getResponsiveValue(16),
  },
  productCard: {
    borderRadius: getResponsiveValue(8),
    borderWidth: 1,
    marginBottom: getResponsiveValue(16),
    overflow: 'hidden',
  },
  productContent: {
    flexDirection: 'row',
  },
  productImage: {
    width: getResponsiveValue(100),
    height: getResponsiveValue(100),
  },
  productInfo: {
    flex: 1,
    padding: getResponsiveValue(12),
  },
  productTitle: {
    marginBottom: getResponsiveValue(4),
  },
  productPrice: {
    marginBottom: getResponsiveValue(4),
  },
  productDescription: {},
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    flex: 1,
    padding: getResponsiveValue(8),
    alignItems: 'center',
  },
  actionButtonText: {
    fontWeight: 'bold',
  },
  addButton: {
    padding: getResponsiveValue(8),
  },
});

export default MyProductsScreen;
