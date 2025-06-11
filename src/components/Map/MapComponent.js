// MapComponent.js
// Displays the static map, handles map clicks, and visualizes hazards as markers and translucent circles

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import './MapComponent.css';

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

// Component to handle map clicks and bounds restriction
function MapController({ onMapClick }) {
  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      if (
        lat >= bounds[0][0] && lat <= bounds[1][0] &&
        lng >= bounds[0][1] && lng <= bounds[1][1]
      ) {
        if (onMapClick) onMapClick(e);
      }
    },
  });

  // Restrict map movement to bounds
  useEffect(() => {
    if (!map) return;

    // Set max bounds to prevent dragging outside the map area
    const maxBounds = L.latLngBounds(bounds);
    map.setMaxBounds(maxBounds);

    // Set view to center of bounds
    const center = [
      (bounds[0][0] + bounds[1][0]) / 2,
      (bounds[0][1] + bounds[1][1]) / 2
    ];
    map.setView(center, map.getZoom());

    // Add bounds padding
    const padding = L.point(50, 50);
    map.setMaxBounds(maxBounds.pad(0.1));

    return () => {
      map.setMaxBounds(null);
    };
  }, [map]);

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
  const [mapBounds, setMapBounds] = useState(null);
  const containerRef = useRef();

  useEffect(() => {
    if (!map) return;
    
    function updateMapBounds() {
      const container = map.getContainer();
      const sw = map.latLngToContainerPoint(bounds[0]);
      const ne = map.latLngToContainerPoint(bounds[1]);
      
      setMapBounds({
        left: Math.min(sw.x, ne.x),
        right: Math.max(sw.x, ne.x),
        top: Math.min(sw.y, ne.y),
        bottom: Math.max(sw.y, ne.y),
        width: container.offsetWidth,
        height: container.offsetHeight
      });
    }

    updateMapBounds();
    map.on('move zoom resize', updateMapBounds);
    return () => {
      map.off('move zoom resize', updateMapBounds);
    };
  }, [map, bounds]);

  if (!mapBounds) return null;

  return (
    <div 
      ref={containerRef}
      className="map-interaction-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 400
      }}
    >
      {/* Top area */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: mapBounds.top,
        pointerEvents: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.1)'
      }} />
      {/* Bottom area */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: `calc(100% - ${mapBounds.bottom}px)`,
        pointerEvents: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.1)'
      }} />
      {/* Left area */}
      <div style={{
        position: 'absolute',
        top: mapBounds.top,
        left: 0,
        width: mapBounds.left,
        height: mapBounds.bottom - mapBounds.top,
        pointerEvents: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.1)'
      }} />
      {/* Right area */}
      <div style={{
        position: 'absolute',
        top: mapBounds.top,
        right: 0,
        width: `calc(100% - ${mapBounds.right}px)`,
        height: mapBounds.bottom - mapBounds.top,
        pointerEvents: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.1)'
      }} />
    </div>
  );
}

const MapComponent = ({ onMapClick, selectedTravelMode }) => {
  const [hazards, setHazards] = useState([]);
  const [map, setMap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef();

  React.useEffect(() => {
    setIsLoading(false);
  }, []);

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

  // Replace filterHazardsByTravelMode with the new logic
  const hazardVisibility = {
    walking: ['crime', 'load_shedding', 'dumping', 'water_leak', 'sewerage_leak', 'flooding'],
    cycling: ['crime', 'load_shedding', 'pothole', 'dumping', 'water_leak', 'sewerage_leak', 'flooding'],
    car: ['crime', 'load_shedding', 'pothole', 'flooding'],
    taxi: ['crime', 'load_shedding', 'pothole', 'flooding'],
    all: ['crime', 'load_shedding', 'pothole', 'dumping', 'water_leak', 'sewerage_leak', 'flooding'],
  };

  const filterHazardsByTravelMode = (hazard) => {
    if (selectedTravelMode === 'all') return true;
    const allowed = hazardVisibility[selectedTravelMode] || hazardVisibility['all'];
    return allowed.includes(hazard.type);
  };

  // Filter out hazards whose duration has expired
  const now = new Date();
  const visibleHazards = hazards.filter(hazard => {
    if (!hazard.createdAt || !hazard.duration) return true;
    const created = hazard.createdAt.seconds ? new Date(hazard.createdAt.seconds * 1000) : new Date(hazard.createdAt);
    const expires = new Date(created.getTime() + hazard.duration * 24 * 60 * 60 * 1000);
    return now < expires;
  });

  // Enhanced marker creation with animations
  const createMarker = (hazard) => {
    const icon = getHazardIcon(hazard.type);
    return new L.Marker([hazard.location.lat, hazard.location.lng], {
      icon,
      className: 'marker-icon',
      riseOnHover: true,
      autoPan: true,
      autoPanSpeed: 10,
      autoPanPadding: [50, 50]
    });
  };

  return (
    <div className="w-full h-[70vh] relative" style={{ backgroundColor: 'transparent' }}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* Map container with enhanced styling */}
      <div className="relative w-full h-full rounded-lg shadow-xl overflow-hidden">
        <MapContainer
          center={[(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2]}
          zoom={15}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          minZoom={14}
          maxZoom={18}
          zoomControl={true}
          whenCreated={setMap}
          maxBounds={L.latLngBounds(bounds).pad(0.1)}
          maxBoundsViscosity={1.0}
          ref={mapRef}
          attributionControl={false}
          zoomDelta={0.2}
          zoomSnap={0.05}
        >
          {/* Static image overlay with enhanced styling */}
          <ImageOverlay 
            url={imageUrl} 
            bounds={bounds} 
            interactive={true}
            opacity={0.9}
            className="map-overlay"
          />
          
          {/* Map interaction overlay */}
          {map && <MapInteractionOverlay map={map} bounds={bounds} />}
          
          {/* Handle map clicks */}
          <MapController onMapClick={onMapClick} />

          {/* Add a subtle map overlay for better contrast */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.1))',
              zIndex: 2
            }}
          />

          {/* Render hazard markers */}
          {visibleHazards.filter(filterHazardsByTravelMode).map((hazard) => (
            <React.Fragment key={hazard.id}>
              <Marker
                position={[hazard.location.lat, hazard.location.lng]}
                icon={getHazardIcon(hazard.type)}
                eventHandlers={{
                  mouseover: (e) => {
                    e.target.openPopup();
                  },
                  mouseout: (e) => {
                    e.target.closePopup();
                  }
                }}
              >
                <Popup
                  className="custom-popup"
                  closeButton={false}
                  autoPan={false}
                >
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-800">{hazard.type.replace('_', ' ').toUpperCase()}</h3>
                    <p className="text-sm text-gray-600">{hazard.description}</p>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapComponent; 