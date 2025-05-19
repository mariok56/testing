import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  PermissionsAndroid,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import {RootStackParamList} from '../../types/navigation';
import Header from '../../components/molecules/Header';
import Button from '../../components/atoms/Button';
import {useTheme} from '../../contexts/ThemeContext';
import {getResponsiveValue} from '../../utils/responsive';
import fontVariants from '../../utils/fonts';

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

type Props = NativeStackScreenProps<RootStackParamList, 'MapScreen'>;

const MapScreen: React.FC<Props> = ({navigation, route}) => {
  const {initialLocation, onLocationSelected} = route.params;
  const [location, setLocation] = useState<Location>(
    initialLocation || {
      name: '',
      latitude: 33.8938,
      longitude: 35.5018, // Default to Beirut coordinates
    },
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const mapRef = useRef<MapView | null>(null);
  const {colors} = useTheme();

  useEffect(() => {
    // Request location permission and get current position
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        Geolocation.requestAuthorization('whenInUse');
        getCurrentLocation();
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const newLocation = {
          ...location,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(newLocation);
        animateToRegion(newLocation.latitude, newLocation.longitude);
      },

      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const animateToRegion = (latitude: number, longitude: number) => {
    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      1000,
    );
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      // Using the Nominatim OpenStreetMap API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery,
        )}&format=json&limit=5`,
      );
      const data = await response.json();
      setSearchResults(data);
      setLoading(false);

      if (data.length > 0) {
        const firstResult = data[0];
        const newLocation = {
          name: firstResult.display_name,
          latitude: parseFloat(firstResult.lat),
          longitude: parseFloat(firstResult.lon),
        };
        setLocation(newLocation);
        animateToRegion(newLocation.latitude, newLocation.longitude);
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      setLoading(false);
    }
  };

  const handleMapPress = (event: any) => {
    const {coordinate} = event.nativeEvent;

    // Reverse geocode to get the place name
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${coordinate.latitude}&lon=${coordinate.longitude}&format=json`,
    )
      .then(response => response.json())
      .then(data => {
        const newLocation = {
          name: data.display_name || 'Unknown location',
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        };
        setLocation(newLocation);
      })
      .catch(error => {
        console.error('Error reverse geocoding:', error);
        setLocation({
          name: 'Selected location',
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        });
      });
  };

  const handleSelectLocation = () => {
    if (onLocationSelected) {
      onLocationSelected(location);
    }
    navigation.goBack();
  };

  const selectSearchResult = (result: any) => {
    const selectedLocation = {
      name: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
    setLocation(selectedLocation);
    animateToRegion(selectedLocation.latitude, selectedLocation.longitude);
    setSearchResults([]);
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}
      edges={['top']}>
      <Header showBackButton />

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="Search location..."
          placeholderTextColor={colors.border}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={searchLocation}
        />
        <TouchableOpacity
          style={[styles.searchButton, {backgroundColor: colors.primary}]}
          onPress={searchLocation}
          disabled={loading}>
          <Text style={[styles.searchButtonText, {color: '#fff'}]}>
            {loading ? 'Searching...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      {searchResults.length > 0 && (
        <View
          style={[
            styles.resultsContainer,
            {backgroundColor: colors.card, borderColor: colors.border},
          ]}>
          {searchResults.map((result, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.resultItem,
                index < searchResults.length - 1 && {
                  borderBottomColor: colors.border,
                  borderBottomWidth: 1,
                },
              ]}
              onPress={() => selectSearchResult(result)}>
              <Text
                style={[styles.resultText, {color: colors.text}]}
                numberOfLines={2}>
                {result.display_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          onPress={handleMapPress}>
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.name}
            draggable
            onDragEnd={e => {
              const coordinate = e.nativeEvent.coordinate;
              setLocation({
                ...location,
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
              });
            }}
          />
        </MapView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomContainer}>
        <View
          style={[
            styles.locationInfo,
            {backgroundColor: colors.card, borderColor: colors.border},
          ]}>
          <Text
            style={[
              styles.locationTitle,
              {color: colors.text},
              fontVariants.bodyBold,
            ]}>
            Selected Location
          </Text>
          <Text
            style={[
              styles.locationName,
              {color: colors.text},
              fontVariants.body,
            ]}
            numberOfLines={2}>
            {location.name || 'No location selected'}
          </Text>
          <Text
            style={[
              styles.coordinates,
              {color: colors.border},
              fontVariants.caption,
            ]}>
            Lat: {location.latitude.toFixed(6)}, Lng:{' '}
            {location.longitude.toFixed(6)}
          </Text>
        </View>

        <Button
          title="Confirm Location"
          onPress={handleSelectLocation}
          disabled={!location.name}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: getResponsiveValue(16),
    paddingVertical: getResponsiveValue(8),
    zIndex: 2,
  },
  searchInput: {
    flex: 1,
    height: getResponsiveValue(40),
    paddingHorizontal: getResponsiveValue(12),
    borderRadius: getResponsiveValue(8),
    borderWidth: 1,
    marginRight: getResponsiveValue(8),
  },
  searchButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: getResponsiveValue(8),
    paddingHorizontal: getResponsiveValue(12),
  },
  searchButtonText: {
    fontWeight: 'bold',
  },
  resultsContainer: {
    position: 'absolute',
    top: getResponsiveValue(108), // Below header and search input
    left: getResponsiveValue(16),
    right: getResponsiveValue(16),
    borderWidth: 1,
    borderRadius: getResponsiveValue(8),
    maxHeight: getResponsiveValue(200),
    zIndex: 3,
  },
  resultItem: {
    padding: getResponsiveValue(12),
  },
  resultText: {
    fontSize: getResponsiveValue(14),
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomContainer: {
    padding: getResponsiveValue(16),
  },
  locationInfo: {
    padding: getResponsiveValue(16),
    borderRadius: getResponsiveValue(8),
    borderWidth: 1,
    marginBottom: getResponsiveValue(16),
  },
  locationTitle: {
    marginBottom: getResponsiveValue(4),
  },
  locationName: {
    marginBottom: getResponsiveValue(4),
  },
  coordinates: {},
});

export default MapScreen;
