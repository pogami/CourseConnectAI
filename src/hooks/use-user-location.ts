"use client";

import { useState, useEffect } from 'react';

interface UseUserLocationReturn {
  currentTime: Date;
  timezone: string;
  city: string | null;
  country: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function useUserLocation(): UseUserLocationReturn {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timezone, setTimezone] = useState('UTC');
  const [city, setCity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Get timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(tz);
    } catch (err) {
      console.warn('Could not detect timezone:', err);
      setTimezone('UTC');
    }

    // Try to get location (optional - may require user permission)
    const getLocation = async () => {
      try {
        // Try to get location from browser (requires permission)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                // Use a reverse geocoding service (you can replace with your preferred service)
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
                );
                if (response.ok) {
                  const data = await response.json();
                  setCity(data.city || null);
                  setCountry(data.countryName || null);
                }
              } catch (err) {
                console.warn('Could not fetch location details:', err);
              } finally {
                setIsLoading(false);
              }
            },
            () => {
              // User denied or error getting location
              setIsLoading(false);
            },
            { timeout: 5000 }
          );
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Error getting location:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    getLocation();

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  return {
    currentTime,
    timezone,
    city,
    country,
    isLoading,
    error,
  };
}


