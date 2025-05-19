import React from 'react';
import {Platform, StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerificationScreen from '../screens/auth/VerificationScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import EditProductScreen from '../screens/products/EditProduct';
import MapScreen from '../screens/maps/mapScrenn';
import TabNavigator from './TabNavigation';
import {RootStackParamList} from '../types/navigation';

import {useTheme} from '../contexts/ThemeContext';
import {useAuthStore} from '../store/authStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const {colors, isDarkMode} = useTheme();

  React.useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content');
      StatusBar.setBackgroundColor(colors.background);
    }
  }, [isDarkMode, colors]);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={true}
      />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: {backgroundColor: colors.background},
            animation: 'slide_from_right',
          }}>
          {isAuthenticated ? (
            <>
              {/* Main App Screens */}
              <Stack.Screen
                name="MainTabs"
                component={TabNavigator}
                options={{headerShown: false}}
              />
              <Stack.Screen
                name="ProductDetail"
                component={ProductDetailScreen}
              />
              <Stack.Screen name="EditProduct" component={EditProductScreen} />
              <Stack.Screen name="MapScreen" component={MapScreen} />
            </>
          ) : (
            <>
              {/* Auth Screens */}
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen
                name="Verification"
                component={VerificationScreen}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default AppNavigator;
