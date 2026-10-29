import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function GojekMapView({
  userCoords = { latitude: -6.2255, longitude: 106.8120 },
  mechanics = [],
  assignedMechanic = null,
  orderStatus = 'idle', // 'idle' | 'searching' | 'assigned' | 'arrived' | 'repairing' | 'billing' | 'completed'
  showRadar = false,
  height = '100%',
  googleMapsApiKey = '',
}) {
  const webViewRef = useRef(null);

  const lat = userCoords?.latitude || -6.2255;
  const lng = userCoords?.longitude || 106.8120;

  // Generate HTML for Leaflet + Google Maps styled vector tiles
  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; background: #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

    /* Custom Leaflet Pin Styling */
    .pin-container { position: relative; width: 44px; height: 44px; }
    
    /* Driver Car Pin */
    .driver-pin {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%);
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      z-index: 500;
      position: relative;
    }

    .driver-tag {
      position: absolute;
      bottom: -22px;
      left: 50%;
      transform: translateX(-50%);
      background: #1E293B;
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 10px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.2);
      letter-spacing: 0.3px;
    }

    /* Radar Pulse Rings ala Gojek */
    .radar-wrapper {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      pointer-events: none;
      z-index: 100;
    }

    .radar-ring {
      position: absolute;
      top: -90px;
      left: -90px;
      width: 180px;
      height: 180px;
      border-radius: 50%;
      border: 2px solid rgba(220, 38, 38, 0.7);
      background: radial-gradient(circle, rgba(220, 38, 38, 0.25) 0%, rgba(220, 38, 38, 0.05) 70%, transparent 100%);
      animation: radar-pulse 2.2s infinite ease-out;
      transform-origin: center center;
    }

    .radar-ring:nth-child(2) { animation-delay: 0.7s; }
    .radar-ring:nth-child(3) { animation-delay: 1.4s; }

    @keyframes radar-pulse {
      0% { transform: scale(0.2); opacity: 0.9; }
      100% { transform: scale(3.2); opacity: 0; }
    }

    /* Mechanic Motorcycle Pin */
    .mechanic-pin {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      border: 2.5px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FACC15;
      font-size: 18px;
      position: relative;
      z-index: 450;
      transition: transform 0.3s ease;
    }

    .mechanic-pin.active {
      background: linear-gradient(135deg, #16A34A 0%, #15803D 100%);
      color: #FFFFFF;
      box-shadow: 0 4px 16px rgba(22, 163, 74, 0.6);
      transform: scale(1.15);
    }

    .mechanic-tag {
      position: absolute;
      bottom: -20px;
      left: 50%;
      transform: translateX(-50%);
      background: #FFFFFF;
      color: #0F172A;
      font-size: 9.5px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 8px;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      border: 1px solid #CBD5E1;
    }

    /* Recenter Button */
    .map-recenter-btn {
      position: absolute;
      right: 16px;
      bottom: 24px;
      width: 44px;
      height: 44px;
      background: #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: 1px solid #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      cursor: pointer;
      font-size: 20px;
      color: #DC2626;
    }

    /* Clean Map Tile filter to look crisp & seamless ala Gojek */
    .leaflet-tile {
      filter: contrast(104%) brightness(101%);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="map-recenter-btn" onclick="recenterMap()">🎯</div>

  <script>
    const userLat = ${lat};
    const userLng = ${lng};
    const isSearching = ${showRadar || orderStatus === 'searching'};
    const hasAssigned = ${!!assignedMechanic || ['assigned', 'arrived', 'repairing'].includes(orderStatus)};
    
    // Default mechanics coordinates
    const mechanicsList = ${JSON.stringify(
      mechanics.length > 0
        ? mechanics
        : [
            { id: 'm1', name: 'Pak Agus (3 mnt)', coords: { latitude: lat + 0.0035, longitude: lng + 0.0042 } },
            { id: 'm2', name: 'Bambang (5 mnt)', coords: { latitude: lat - 0.0048, longitude: lng - 0.0031 } },
            { id: 'm3', name: 'Dedi (7 mnt)', coords: { latitude: lat + 0.0055, longitude: lng - 0.0045 } },
          ]
    )};

    // Initialize Leaflet Map
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
    }).setView([userLat, userLng], isSearching ? 15 : 16);

    // Google Maps / CartoDB Voyager Tile Layer (Looks identical to Gojek's Google Maps skin)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Driver Marker with Car Icon & Radar
    const radarHtml = isSearching ? \`
      <div class="radar-wrapper">
        <div class="radar-ring"></div>
        <div class="radar-ring"></div>
        <div class="radar-ring"></div>
      </div>
    \` : '';

    const driverIcon = L.divIcon({
      className: 'custom-driver-icon',
      html: \`
        <div class="pin-container">
          \${radarHtml}
          <div class="driver-pin">
            🚗
            <div class="driver-tag">MOBIL ANDA</div>
          </div>
        </div>
      \`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const driverMarker = L.marker([userLat, userLng], { icon: driverIcon, zIndexOffset: 1000 }).addTo(map);

    // Add Mechanics
    const mechMarkers = [];
    mechanicsList.forEach(m => {
      const isThisAssigned = ${assignedMechanic ? JSON.stringify(assignedMechanic.id) : 'null'} === m.id || hasAssigned;
      const mIcon = L.divIcon({
        className: 'custom-mech-icon',
        html: \`
          <div class="mechanic-pin \${isThisAssigned ? 'active' : ''}">
            🛵
            <div class="mechanic-tag">\${m.name || 'Montir Siaga'}</div>
          </div>
        \`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const mMarker = L.marker([m.coords.latitude, m.coords.longitude], { icon: mIcon }).addTo(map);
      mechMarkers.push({ id: m.id, marker: mMarker, coords: m.coords });
    });

    // If Assigned: Draw Route Polyline from Mechanic to Driver & Animate!
    if (hasAssigned) {
      const targetMech = mechMarkers[0];
      if (targetMech) {
        // Waypoints along streets
        const midLat = (userLat + targetMech.coords.latitude) / 2;
        const midLng = (userLng + targetMech.coords.longitude) / 2;
        
        const routePoints = [
          [targetMech.coords.latitude, targetMech.coords.longitude],
          [midLat + 0.001, targetMech.coords.longitude],
          [midLat, midLng],
          [userLat, midLng],
          [userLat, userLng]
        ];

        // Draw animated route line
        const polyline = L.polyline(routePoints, {
          color: '#DC2626',
          weight: 6,
          opacity: 0.85,
          dashArray: '8, 8',
          lineJoin: 'round'
        }).addTo(map);

        // Fit bounds to show both mechanic and driver
        map.fitBounds(L.latLngBounds(routePoints), { padding: [50, 50] });

        // Simulate mechanic driving along the line towards driver
        let step = 0;
        const totalSteps = routePoints.length;
        const interval = setInterval(() => {
          if (step < totalSteps) {
            targetMech.marker.setLatLng(routePoints[step]);
            step++;
          } else {
            clearInterval(interval);
          }
        }, 3000);
      }
    }

    function recenterMap() {
      map.setView([userLat, userLng], 16, { animate: true });
    }
  </script>
</body>
</html>
`;

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webView}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  webView: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
});
