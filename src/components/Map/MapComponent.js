// MapComponent.js
// Displays the static map, handles map clicks, and visualizes hazards as markers and translucent circles

import React, { useEffect, useState } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, useMapEvents, Circle } from 'react-leaflet';
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

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) onMapClick(e);
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
    default:
      return 'rgba(59,130,246,0.5)';
  }
};

const MapComponent = ({ onMapClick, selectedTravelMode }) => {
  const [hazards, setHazards] = useState([]);

  useEffect(() => {
    // Listen for approved, not rejected hazards
    const q = query(
      collection(db, 'hazards'),
      where('isApproved', '==', true),
      where('isRejected', '==', false)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const hazardData = [];
      querySnapshot.forEach((doc) => {
        hazardData.push({ id: doc.id, ...doc.data() });
      });
      setHazards(hazardData);
    });
    return () => unsubscribe();
  }, []);

  // Filter hazards by selected travel mode
  const filterHazardsByTravelMode = (hazard) => {
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
  };

  // Filter out hazards whose duration has expired
  const now = new Date();
  const visibleHazards = hazards.filter(hazard => {
    if (!hazard.createdAt || !hazard.duration) return true;
    const created = hazard.createdAt.seconds ? new Date(hazard.createdAt.seconds * 1000) : new Date(hazard.createdAt);
    const expires = new Date(created.getTime() + hazard.duration * 24 * 60 * 60 * 1000);
    return expires > now;
  });

  return (
    <div className="w-full h-[70vh] relative bg-gray-50" style={{ backgroundColor: 'transparent' }}>
      <MapContainer
        center={[-26.189, 28.075]}
        zoom={16}
        minZoom={15}
        maxZoom={18}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        crs={L.CRS.Simple}
        maxBounds={bounds}
      >
        {/* Static image overlay */}
        <ImageOverlay url={imageUrl} bounds={bounds} interactive={true} />
        {/* Handle map clicks */}
        <MapClickHandler onMapClick={onMapClick} />
        {/* Render hazard markers and circles */}
        {visibleHazards.filter(filterHazardsByTravelMode).map((hazard) => (
          <React.Fragment key={hazard.id}>
            <Circle
              center={[hazard.location.lat, hazard.location.lng]}
              radius={Math.min(Number(hazard.radius) || 100, 500)}
              pathOptions={{
                color: getHazardColor(hazard.type),
                fillColor: getHazardColor(hazard.type),
                fillOpacity: 0.5,
                weight: 2,
              }}
            />
            <Marker position={[hazard.location.lat, hazard.location.lng]}>
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
      </MapContainer>
    </div>
  );
};

export default MapComponent; 