// MapComponent.js
// Displays the static map, handles map clicks, and visualizes hazards as markers and translucent circles

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

// Map bounds for the Makers Valley static map image (real-world coordinates)
const bounds = [
  [-26.197, 28.064], // Southwest (lat, lng)
  [-26.181, 28.085], // Northeast (lat, lng)
];

// Static image URL (should be in public folder)
const imageUrl = process.env.PUBLIC_URL + '/map.png';

// Fix for default marker icon in React
// (Make sure marker-icon.png, marker-icon-2x.png, marker-shadow.png are in public/)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: process.env.PUBLIC_URL + '/marker-icon.png',
  iconRetinaUrl: process.env.PUBLIC_URL + '/marker-icon-2x.png',
  shadowUrl: process.env.PUBLIC_URL + '/marker-shadow.png',
});

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      // Check if click is within bounds
      const { lat, lng } = e.latlng;
      if (
        lat >= bounds[0][0] && lat <= bounds[1][0] &&
        lng >= bounds[0][1] && lng <= bounds[1][1]
      ) {
        if (onMapClick) onMapClick(e);
      }
    },
  });
  return null;
}

// Helper to get color for hazard type
const getHazardColor = (type) => {
  switch (type) {
    case 'crime':
      return 'rgba(239,68,68,0.5)'; // red
    case 'load_shedding':
      return 'rgba(251,191,36,0.5)'; // yellow
    case 'pothole':
      return 'rgba(59,130,246,0.5)'; // blue
    case 'dumping':
      return 'rgba(34,197,94,0.5)'; // green
    case 'water_leak':
      return 'rgba(0,191,255,0.5)'; // deep sky blue
    case 'sewerage_leak':
      return 'rgba(128,0,128,0.5)'; // purple
    case 'flooding':
      return 'rgba(30,64,175,0.5)'; // dark blue
    default:
      return 'rgba(59,130,246,0.5)';
  }
};

// Helper to get marker icon for hazard type
const getHazardIcon = (type) => {
  let iconUrl = '';
  switch (type) {
    case 'crime':
      iconUrl = process.env.PUBLIC_URL + '/marker-crime.png'; break;
    case 'load_shedding':
      iconUrl = process.env.PUBLIC_URL + '/marker-load-shedding.png'; break;
    case 'pothole':
      iconUrl = process.env.PUBLIC_URL + '/marker-pothole.png'; break;
    case 'dumping':
      iconUrl = process.env.PUBLIC_URL + '/marker-dumping.png'; break;
    case 'water_leak':
      iconUrl = process.env.PUBLIC_URL + '/marker-water-leak.png'; break;
    case 'sewerage_leak':
      iconUrl = process.env.PUBLIC_URL + '/marker-sewerage-leak.png'; break;
    case 'flooding':
      iconUrl = process.env.PUBLIC_URL + '/marker-flooding.png'; break;
    default:
      iconUrl = process.env.PUBLIC_URL + '/marker-pothole.png';
  }
  return new L.Icon({
    iconUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: process.env.PUBLIC_URL + '/marker-shadow.png',
    shadowSize: [41, 41],
  });
};

// Overlay component to block pointer events on the grey area
function MapInteractionOverlay({ map, bounds }) {
  const [overlayRects, setOverlayRects] = useState(null);
  const containerRef = useRef();

  useEffect(() => {
    if (!map) return;
    function updateOverlayRects() {
      // Get pixel positions of the image overlay corners
      const sw = map.latLngToContainerPoint(bounds[0]);
      const ne = map.latLngToContainerPoint(bounds[1]);
      // Calculate the rectangle for the image overlay
      const left = Math.min(sw.x, ne.x);
      const right = Math.max(sw.x, ne.x);
      const top = Math.min(sw.y, ne.y);
      const bottom = Math.max(sw.y, ne.y);
      // Get map container size
      const container = map.getContainer();
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      setOverlayRects({ left, right, top, bottom, width, height });
    }
    updateOverlayRects();
    map.on('move zoom resize', updateOverlayRects);
    return () => {
      map.off('move zoom resize', updateOverlayRects);
    };
  }, [map, bounds]);

  if (!overlayRects) return null;
  const { left, right, top, bottom, width, height } = overlayRects;
  // Render four overlay divs: top, left, right, bottom
  return (
    <>
      {/* Top overlay */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: top,
        pointerEvents: 'auto',
        zIndex: 1000,
      }} />
      {/* Bottom overlay */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: bottom,
        width: '100%',
        height: height - bottom,
        pointerEvents: 'auto',
        zIndex: 1000,
      }} />
      {/* Left overlay */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: top,
        width: left,
        height: bottom - top,
        pointerEvents: 'auto',
        zIndex: 1000,
      }} />
      {/* Right overlay */}
      <div style={{
        position: 'absolute',
        left: right,
        top: top,
        width: width - right,
        height: bottom - top,
        pointerEvents: 'auto',
        zIndex: 1000,
      }} />
    </>
  );
}

const MapComponent = ({ onMapClick, selectedTravelMode }) => {
  const [hazards, setHazards] = useState([]);
  const [map, setMap] = useState(null);
  const mapRef = useRef();

  useEffect(() => {
    const q = query(
      collection(db, 'hazards')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const hazardData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only add hazards that are approved, not rejected, and not deleted
        if (data.isApproved === true && data.isRejected !== true && data.isDeleted !== true) {
          hazardData.push({ id: doc.id, ...data });
        }
      });
      setHazards(hazardData);
    }, (error) => {
      console.error('Firestore query error:', error);
    });

    return () => unsubscribe();
  }, []);

  // Filter hazards by selected travel mode
  const filterHazardsByTravelMode = (hazard) => {
    const isVisible = (() => {
      switch (selectedTravelMode) {
        case 'walking':
          return ['crime', 'load_shedding', 'pothole', 'dumping'].includes(hazard.type);
        case 'cycling':
          return ['pothole', 'dumping', 'crime', 'load_shedding'].includes(hazard.type);
        case 'car':
          return ['dumping', 'load_shedding', 'crime'].includes(hazard.type);
        case 'taxi':
          return ['crime', 'load_shedding'].includes(hazard.type);
        default:
          return true;
      }
    })();
    return isVisible;
  };

  // Filter out hazards whose duration has expired
  const now = new Date();
  const visibleHazards = hazards.filter(hazard => {
    if (!hazard.createdAt || !hazard.duration) return true;
    const created = hazard.createdAt.seconds ? new Date(hazard.createdAt.seconds * 1000) : new Date(hazard.createdAt);
    const expires = new Date(created.getTime() + hazard.duration * 24 * 60 * 60 * 1000);
    return now < expires;
  });

  return (
    <div className="w-full h-[70vh] relative" style={{ backgroundColor: 'transparent' }}>
      <MapContainer
        center={[-26.189, 28.075]}
        zoom={14}
        minZoom={14}
        maxZoom={18}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        crs={L.CRS.Simple}
        maxBounds={bounds}
        maxBoundsViscosity={1}
        whenCreated={setMap}
        ref={mapRef}
      >
        {/* Static image overlay */}
        <ImageOverlay url={imageUrl} bounds={bounds} interactive={true} />
        {/* Handle map clicks */}
        <MapClickHandler onMapClick={onMapClick} />
        {/* Render hazard markers and circles */}
        {visibleHazards.filter(filterHazardsByTravelMode).map((hazard) => (
          <React.Fragment key={hazard.id}>
            <Marker position={[hazard.location.lat, hazard.location.lng]} icon={getHazardIcon(hazard.type)}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold capitalize">{hazard.type.replace('_', ' ')}</h3>
                  <p className="mt-1">{hazard.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Duration: {hazard.duration} days
                  </p>
                  {hazard.createdAt && (
                    <p className="text-sm text-gray-500">
                      Reported: {hazard.createdAt.seconds ? new Date(hazard.createdAt.seconds * 1000).toLocaleDateString() : ''}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
        {/* Overlay to block pointer events on the grey area */}
        {map && <MapInteractionOverlay map={map} bounds={bounds} />}
      </MapContainer>
    </div>
  );
};

export default MapComponent; 