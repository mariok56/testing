// Define location type
export interface LocationType {
  name: string;
  latitude: number;
  longitude: number;
}

// Tab navigator params
export type MainTabParamList = {
  Home: undefined;
  MyProducts: undefined;
  AddProduct: undefined;
  Profile: undefined;
};

// Main stack navigator params
export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  Register: undefined;
  Verification: {email: string; password: string};

  // Main app screens
  MainTabs: {screen?: keyof MainTabParamList}; // Allow nested navigation
  ProductDetail: {productId: string};
  EditProduct: {productId: string};
  MapScreen: {
    initialLocation?: LocationType;
    onLocationSelected: (location: LocationType) => void;
  };
};
