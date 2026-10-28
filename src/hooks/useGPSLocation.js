import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useGPSLocation() {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('Mendeteksi GPS smartphone Anda...');
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'denied' | 'error'
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchCurrentLocation = async () => {
    try {
      setStatus('loading');
      setAddress('Mencari sinyal GPS satelit...');

      // Request permission
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        setStatus('denied');
        setAddress('Jl. Jend. Sudirman Kav 52, Jakarta Selatan (Lokasi Default)');
        setErrorMsg('Izin lokasi tidak diberikan. Menampilkan titik default.');
        return;
      }

      // Get accurate GPS coordinates from smartphone hardware
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      setLocation({ latitude, longitude });

      // Reverse geocode to get street name, district, and city
      try {
        const reverseGeocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseGeocoded && reverseGeocoded.length > 0) {
          const item = reverseGeocoded[0];
          const parts = [
            item.street || item.name,
            item.district || item.subregion,
            item.city || item.region,
          ].filter(Boolean);

          const formatted = parts.length > 0 ? parts.join(', ') : `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`;
          setAddress(formatted);
        } else {
          setAddress(`Koordinat: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
      } catch (geoErr) {
        setAddress(`GPS Aktif: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }

      setStatus('ready');
      setErrorMsg(null);
    } catch (err) {
      console.warn('GPS Fetch error:', err);
      setStatus('error');
      setAddress('Jl. MH Thamrin No. 28, Jakarta Pusat (Simulasi)');
      setErrorMsg(err.message);
    }
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  return {
    location,
    address,
    setAddress,
    status,
    errorMsg,
    refreshLocation: fetchCurrentLocation,
  };
}
