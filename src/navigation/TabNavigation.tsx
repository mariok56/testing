import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {getResponsiveValue} from '../utils/responsive';

import ProductListScreen from '../screens/products/ProductListScreen';
import ProfileScreen from '../screens/profile/Profile';
import AddProductScreen from '../screens/products/AddProducts';
import MyProductsScreen from '../screens/products/myProductScreen';
import {MainTabParamList} from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabNavigator: React.FC = () => {
  const {colors} = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.border,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: getResponsiveValue(60),
          paddingBottom: getResponsiveValue(10),
          paddingTop: getResponsiveValue(10),
        },
      }}>
      <Tab.Screen
        name="Home"
        component={ProductListScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({color, focused}) => (
            <Text style={{fontSize: 20, color}}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="MyProducts"
        component={MyProductsScreen}
        options={{
          tabBarLabel: 'My Products',
          tabBarIcon: ({color, focused}) => (
            <Text style={{fontSize: 20, color}}>📦</Text>
          ),
        }}
      />
      <Tab.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{
          tabBarLabel: 'Add',
          tabBarIcon: ({color, focused}) => (
            <Text style={{fontSize: 22, color}}>➕</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({color, focused}) => (
            <Text style={{fontSize: 20, color}}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
