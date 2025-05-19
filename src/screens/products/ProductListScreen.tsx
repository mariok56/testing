import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Text,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RootStackParamList} from '../../types/navigation';
import Header from '../../components/molecules/Header';
import ProductList from '../../components/organisms/ProductList';
import {useTheme} from '../../contexts/ThemeContext';
import {useProducts, useProductSearch} from '../../hooks/useApi';
import {getResponsiveValue} from '../../utils/responsive';
import fontVariants from '../../utils/fonts';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductList'>;

type SortOption = {
  label: string;
  value: string;
  order: 'asc' | 'desc';
};

const sortOptions: SortOption[] = [
  {label: 'Default', value: '', order: 'desc'},
  {label: 'Price: Low to High', value: 'price', order: 'asc'},
  {label: 'Price: High to Low', value: 'price', order: 'desc'},
  {label: 'Name: A-Z', value: 'title', order: 'asc'},
  {label: 'Name: Z-A', value: 'title', order: 'desc'},
];

const ProductListScreen: React.FC<Props> = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedSort, setSelectedSort] = useState<SortOption>(sortOptions[0]);
  const [showSortOptions, setShowSortOptions] = useState(false);

  const {colors, isDarkMode} = useTheme();

  // Use our React Query hooks
  const {
    data: productsData,
    isLoading,
    isError,
    error,
    refetch,
    isPending,
  } = useProducts(
    page,
    10,
    undefined,
    undefined,
    selectedSort.value,
    selectedSort.order,
  );

  const {data: searchData, isLoading: searchLoading} =
    useProductSearch(searchQuery);

  // Determine which data to show - search results or regular products
  const products =
    searchQuery.length > 0 ? searchData?.data || [] : productsData?.data || [];

  const isLoadingData = isLoading || searchLoading;
  const isPreviousData = isPending;

  // Handle pagination
  const handleNextPage = () => {
    if (productsData?.pagination.hasNextPage && !isPreviousData) {
      setPage(page => page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page => page - 1);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setSearchQuery('');
    refetch();
  };

  // Handle sort selection
  const handleSortSelect = (option: SortOption) => {
    setSelectedSort(option);
    setShowSortOptions(false);
  };

  // Toggle search bar
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <SafeAreaView
        style={[styles.container, {backgroundColor: colors.background}]}
        edges={['top']}>
        <Header
          showBackButton={false}
          showThemeToggle={true}
          rightComponent={
            <TouchableOpacity
              onPress={toggleSearch}
              style={styles.searchButton}>
              <Text style={{fontSize: 16}}>🔍</Text>
            </TouchableOpacity>
          }
        />

        {showSearch && (
          <View
            style={[
              styles.searchContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <TextInput
              style={[styles.searchInput, {color: colors.text}]}
              placeholder="Search products..."
              placeholderTextColor={colors.border}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}>
                <Text style={{fontSize: 16}}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}
            onPress={() => setShowSortOptions(!showSortOptions)}>
            <Text style={[{color: colors.text}, fontVariants.bodyBold]}>
              Sort: {selectedSort.label}
            </Text>
            <Text style={{color: colors.text}}>▼</Text>
          </TouchableOpacity>

          {showSortOptions && (
            <View
              style={[
                styles.sortOptions,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}>
              {sortOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.sortOption,
                    selectedSort.label === option.label && {
                      backgroundColor: colors.background,
                    },
                  ]}
                  onPress={() => handleSortSelect(option)}>
                  <Text style={[{color: colors.text}, fontVariants.body]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          <ProductList
            products={products}
            loading={isLoadingData}
            error={
              isError ? (error as Error)?.message || 'An error occurred' : null
            }
            onRefresh={handleRefresh}
            refreshing={isLoadingData}
          />
        </View>

        {!searchQuery && productsData?.pagination && (
          <View
            style={[
              styles.paginationContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                !productsData.pagination.hasPrevPage && styles.disabledButton,
                {borderColor: colors.border},
              ]}
              onPress={handlePrevPage}
              disabled={!productsData.pagination.hasPrevPage}>
              <Text
                style={{
                  color: productsData.pagination.hasPrevPage
                    ? colors.primary
                    : colors.border,
                }}>
                Previous
              </Text>
            </TouchableOpacity>

            <Text style={[{color: colors.text}, fontVariants.body]}>
              Page {productsData.pagination.currentPage} of{' '}
              {productsData.pagination.totalPages}
            </Text>

            <TouchableOpacity
              style={[
                styles.paginationButton,
                !productsData.pagination.hasNextPage && styles.disabledButton,
                {borderColor: colors.border},
              ]}
              onPress={handleNextPage}
              disabled={!productsData.pagination.hasNextPage}>
              <Text
                style={{
                  color: productsData.pagination.hasNextPage
                    ? colors.primary
                    : colors.border,
                }}>
                Next
              </Text>
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
  content: {
    flex: 1,
  },
  searchButton: {
    padding: getResponsiveValue(8),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveValue(16),
    paddingVertical: getResponsiveValue(8),
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: getResponsiveValue(40),
    fontSize: getResponsiveValue(16),
  },
  clearButton: {
    padding: getResponsiveValue(8),
  },
  sortContainer: {
    padding: getResponsiveValue(16),
    position: 'relative',
    zIndex: 100,
  },
  sortButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsiveValue(12),
    borderRadius: getResponsiveValue(8),
    borderWidth: 1,
  },
  sortOptions: {
    position: 'absolute',
    top: getResponsiveValue(70),
    left: getResponsiveValue(16),
    right: getResponsiveValue(16),
    borderRadius: getResponsiveValue(8),
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sortOption: {
    padding: getResponsiveValue(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsiveValue(16),
    borderTopWidth: 1,
  },
  paginationButton: {
    paddingVertical: getResponsiveValue(8),
    paddingHorizontal: getResponsiveValue(16),
    borderRadius: getResponsiveValue(8),
    borderWidth: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default ProductListScreen;
