// Create a file to define navigation hooks with correct typing
import {
  useNavigation,
  NavigationProp,
  RouteProp,
  useRoute,
} from '@react-navigation/native';
import {RootStackParamList, MainTabParamList} from '../types/navigation';

// Use this for navigating from main stack screens
export const useMainNavigation = () =>
  useNavigation<NavigationProp<RootStackParamList>>();

// Use this for navigating from tab screens
export const useTabNavigation = () =>
  useNavigation<NavigationProp<MainTabParamList>>();

// Type-safe route hooks
export const useMainRoute = <RouteName extends keyof RootStackParamList>() =>
  useRoute<RouteProp<RootStackParamList, RouteName>>();

export const useTabRoute = <RouteName extends keyof MainTabParamList>() =>
  useRoute<RouteProp<MainTabParamList, RouteName>>();
