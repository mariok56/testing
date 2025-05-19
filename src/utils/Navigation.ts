// Helper function to go back
export const goBack = (navigation: StackNavigation) => {
  navigation.dispatch(CommonActions.goBack());
};
import {
  useNavigation,
  NavigationProp,
  CommonActions,
} from '@react-navigation/native';
import {RootStackParamList, MainTabParamList} from '../types/navigation';

// Use this type for stack navigation
export type StackNavigation = NavigationProp<RootStackParamList>;

// Use this hook to navigate within the main stack
export const useStackNavigation = () => {
  return useNavigation<NavigationProp<RootStackParamList>>();
};

// Helper function to navigate to the main tab screen
export const navigateToMainTabs = (navigation: StackNavigation) => {
  navigation.dispatch(
    CommonActions.navigate({
      name: 'MainTabs',
    }),
  );
};

// Helper function to navigate to a specific tab within the tab navigator
export const navigateToTab = (
  navigation: StackNavigation,
  tabName: keyof MainTabParamList,
) => {
  navigation.dispatch(
    CommonActions.navigate({
      name: 'MainTabs',
      params: {
        screen: tabName,
      },
    }),
  );
};

// Specific tab navigation helpers
export const navigateToHome = (navigation: StackNavigation) => {
  navigateToTab(navigation, 'Home');
};

export const navigateToMyProducts = (navigation: StackNavigation) => {
  navigateToTab(navigation, 'MyProducts');
};

export const navigateToAddProduct = (navigation: StackNavigation) => {
  navigateToTab(navigation, 'AddProduct');
};

export const navigateToProfile = (navigation: StackNavigation) => {
  navigateToTab(navigation, 'Profile');
};

// Helper function for navigating to product detail
export const navigateToProductDetail = (
  navigation: StackNavigation,
  productId: string,
) => {
  navigation.dispatch(
    CommonActions.navigate({
      name: 'ProductDetail',
      params: {productId},
    }),
  );
};

// Helper function for navigating to edit product
export const navigateToEditProduct = (
  navigation: StackNavigation,
  productId: string,
) => {
  navigation.dispatch(
    CommonActions.navigate({
      name: 'EditProduct',
      params: {productId},
    }),
  );
};

// Helper function for navigating to map screen
export const navigateToMapScreen = (
  navigation: StackNavigation,
  params: {
    initialLocation?: {
      name: string;
      latitude: number;
      longitude: number;
    };
    onLocationSelected: (location: {
      name: string;
      latitude: number;
      longitude: number;
    }) => void;
  },
) => {
  navigation.dispatch(
    CommonActions.navigate({
      name: 'MapScreen',
      params,
    }),
  );
};
