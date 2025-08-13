import React, { createContext, useContext, useState, useCallback } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface GeolocationContextType {
  currentLocation: LocationData | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestLocation: () => Promise<LocationData | null>;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined);

export const useGeolocation = () => {
  const context = useContext(GeolocationContext);
  if (context === undefined) {
    throw new Error('useGeolocation must be used within a GeolocationProvider');
  }
  return context;
};

export const GeolocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const requestLocation = useCallback(async (): Promise<LocationData | null> => {
    setLoading(true);
    setError(null);

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      // Request permission
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'denied') {
        throw new Error('Location permission denied. Please enable location access to mark attendance.');
      }

      // Get current position with high accuracy
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000
          }
        );
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now()
      };

      // Check accuracy (reject if accuracy > 500 meters for geofence logic)
      if (locationData.accuracy > 500) {
        throw new Error(`Location accuracy too low (${Math.round(locationData.accuracy)}m). Please move to an area with better GPS signal.`);
      }

      setCurrentLocation(locationData);
      setHasPermission(true);
      return locationData;

    } catch (err: any) {
      let errorMessage = 'Failed to get location';
      
      if (err.code === 1) {
        errorMessage = 'Location access denied. Please enable location permissions.';
      } else if (err.code === 2) {
        errorMessage = 'Location unavailable. Please check your GPS settings.';
      } else if (err.code === 3) {
        errorMessage = 'Location request timeout. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setHasPermission(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Haversine formula to calculate distance between two coordinates
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  return (
    <GeolocationContext.Provider value={{
      currentLocation,
      loading,
      error,
      hasPermission,
      requestLocation,
      calculateDistance
    }}>
      {children}
    </GeolocationContext.Provider>
  );
};