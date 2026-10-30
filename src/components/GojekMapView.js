import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function GojekMapView({
  userCoords = { latitude: -6.2255, longitude: 106.8120 },
  mechanics = [],
  assignedMechanic = null,
  orderStatus = 'idle',
  showRadar = false,
  showRoute = true,
  height = '100%',
}) {
  const webViewRef = useRef(null);

  const lat = userCoords?.latitude || -6.2255;
  const lng = userCoords?.longitude || 106.8120;

  const mapHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; background: #eef2f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

    /* Crisp & Pastel map filter to look identical to Gojek Google Maps skin */
    .leaflet-tile {
      filter: saturate(112%) contrast(101%) brightness(101%);
    }

    .pin-container { position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }

    /* Gojek Green Origin Pin (with Arrow Up like user image) */
    .gojek-origin-pin {
      width: 40px;
      height: 40px;
      background: #00AA13;
      border: 3.5px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 4px 14px rgba(0, 170, 19, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-size: 20px;
      font-weight: 900;
      position: relative;
      z-index: 500;
    }

    .gojek-origin-halo {
      position: absolute;
      top: -16px;
      left: -16px;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(0, 170, 19, 0.22);
      pointer-events: none;
      z-index: 100;
      animation: halo-breathe 2.4s infinite ease-in-out;
    }

    @keyframes halo-breathe {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.15); opacity: 0.35; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }

    /* Gojek Orange Destination Pin */
    .gojek-dest-pin {
      width: 36px;
      height: 36px;
      background: #FA541C;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(250, 84, 28, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 500;
    }

    .gojek-dest-inner-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2.5px solid #FFFFFF;
      background: #FA541C;
    }

    /* Radar Pulse Rings for Searching State */
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
      border: 2px solid rgba(0, 170, 19, 0.7);
      background: radial-gradient(circle, rgba(0, 170, 19, 0.25) 0%, rgba(0, 170, 19, 0.05) 70%, transparent 100%);
      animation: radar-pulse 2.2s infinite ease-out;
      transform-origin: center center;
    }

    .radar-ring:nth-child(2) { animation-delay: 0.7s; }
    .radar-ring:nth-child(3) { animation-delay: 1.4s; }

    @keyframes radar-pulse {
      0% { transform: scale(0.2); opacity: 0.9; }
      100% { transform: scale(3.4); opacity: 0; }
    }

    .mechanic-pin {
      width: 36px;
      height: 36px;
      background: #FFFFFF;
      border: 2.5px solid #00AA13;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      position: relative;
      z-index: 450;
      transition: transform 0.3s ease;
    }

    .mechanic-pin.active {
      background: #00AA13;
      border-color: #FFFFFF;
      color: #FFFFFF;
      box-shadow: 0 4px 16px rgba(0, 170, 19, 0.6);
      transform: scale(1.15);
    }

    .mechanic-tag {
      position: absolute;
      bottom: -18px;
      left: 50%;
      transform: translateX(-50%);
      background: #1E293B;
      color: #FFFFFF;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }

    .map-recenter-btn {
      position: absolute;
      right: 16px;
      bottom: 24px;
      width: 44px;
      height: 44px;
      background: #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18);
      border: 1px solid #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      cursor: pointer;
      font-size: 20px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="map-recenter-btn" onclick="recenterMap()">🎯</div>

  <script>
    var userLat = ${lat};
    var userLng = ${lng};
    var isSearching = ${showRadar || orderStatus === 'searching'};
    var hasAssigned = ${!!assignedMechanic || ['assigned', 'arrived', 'repairing'].includes(orderStatus)};
    
    var mechanicsList = ${JSON.stringify(
      mechanics.length > 0
        ? mechanics
        : [
            { id: 'm1', name: 'Pak Agus (1.2 km)', coords: { latitude: lat + 0.0038, longitude: lng + 0.0045 } },
            { id: 'm2', name: 'Bambang (2.1 km)', coords: { latitude: lat - 0.0042, longitude: lng - 0.0035 } },
            { id: 'm3', name: 'Dedi (2.8 km)', coords: { latitude: lat + 0.0051, longitude: lng - 0.0042 } },
          ]
    )};

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
    }).setView([userLat, userLng], isSearching ? 15 : 15);

    // 100% Free & Open-Source OpenStreetMap Humanitarian (HOT)
    var hotTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: 'abc',
    });

    var osmStandardLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    });

    hotTileLayer.on('tileerror', function() {
      if (!map.hasLayer(osmStandardLayer)) {
        osmStandardLayer.addTo(map);
      }
    });

    hotTileLayer.addTo(map);

    var radarHtml = isSearching 
      ? '<div class="radar-wrapper"><div class="radar-ring"></div><div class="radar-ring"></div><div class="radar-ring"></div></div>'
      : '';

    var driverIcon = L.divIcon({
      className: 'custom-driver-icon',
      html: '<div class="pin-container"><div class="gojek-origin-halo"></div>' + radarHtml + '<div class="gojek-origin-pin">↑</div></div>',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    var driverMarker = L.marker([userLat, userLng], { icon: driverIcon, zIndexOffset: 1000 }).addTo(map);

    var destCoords = [userLat + 0.0038, userLng + 0.0045];
    var destIcon = L.divIcon({
      className: 'custom-dest-icon',
      html: '<div class="pin-container"><div class="gojek-dest-pin"><div class="gojek-dest-inner-dot"></div></div></div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    var destMarker = L.marker(destCoords, { icon: destIcon, zIndexOffset: 900 }).addTo(map);

    var midLat = (userLat + destCoords[0]) / 2;
    var midLng = (userLng + destCoords[1]) / 2;

    var routePoints = [
      [userLat, userLng],
      [userLat + 0.0012, userLng + 0.0006],
      [midLat, userLng + 0.0022],
      [midLat + 0.0010, destCoords[1] - 0.0015],
      [destCoords[0], destCoords[1]]
    ];

    var routeLine = L.polyline(routePoints, {
      color: '#00AA13',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    var mechMarkers = [];
    mechanicsList.forEach(function(m) {
      var isThisAssigned = (${assignedMechanic ? JSON.stringify(assignedMechanic.id) : 'null'} === m.id) || hasAssigned;
      var mIcon = L.divIcon({
        className: 'custom-mech-icon',
        html: '<div class="mechanic-pin' + (isThisAssigned ? ' active' : '') + '">🛵<div class="mechanic-tag">' + (m.name || 'Montir Siaga') + '</div></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      var mMarker = L.marker([m.coords.latitude, m.coords.longitude], { icon: mIcon }).addTo(map);
      mechMarkers.push({ id: m.id, marker: mMarker, coords: m.coords });
    });

    if (hasAssigned) {
      var targetMech = mechMarkers[0];
      if (targetMech) {
        var step = routePoints.length - 1;
        var interval = setInterval(function() {
          if (step >= 0) {
            targetMech.marker.setLatLng(routePoints[step]);
            step--;
          } else {
            clearInterval(interval);
          }
        }, 2500);
      }
    }

    window.recenterMap = function() {
      map.setView([userLat, userLng], 15, { animate: true });
    };
  </script>
</body>
</html>`;

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
    backgroundColor: '#EEF2F6',
  },
  webView: {
    flex: 1,
    backgroundColor: '#EEF2F6',
  },
});
