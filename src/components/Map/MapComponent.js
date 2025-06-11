// MapComponent.js
// Displays the static map, handles map clicks, and visualizes hazards as markers and translucent circles

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, useMapEvents, Circle } from 'react-leaflet';
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
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef();

  // Debug: log isLoading state
  console.log('isLoading:', isLoading);

  // Remove the direct setIsLoading(false) from the component body
  // Instead, set isLoading to false on mount
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

  // Enhanced circle creation with animations
  const createCircle = (hazard) => {
    return L.circle([hazard.location.lat, hazard.location.lng], {
      radius: 50,
      color: getHazardColor(hazard.type),
      fillColor: getHazardColor(hazard.type),
      fillOpacity: 0.5,
      className: 'hazard-circle',
      interactive: true,
      bubblingMouseEvents: false
    });
  };

  // Add log before rendering MapContainer
  console.log('Rendering MapContainer');

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
          center={[-26.189, 28.075]}
          zoom={14}
          minZoom={14}
          maxZoom={18}
          scrollWheelZoom={true}
          zoomSnap={0.05}
          zoomDelta={0.05}
          zoomAnimation={true}
          zoomAnimationThreshold={4}
          easeLinearity={0.35}
          wheelDebounceTime={40}
          wheelPxPerZoomLevel={60}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          crs={L.CRS.Simple}
          maxBounds={bounds}
          maxBoundsViscosity={1}
          whenCreated={(mapInstance) => {
            setMap(mapInstance);
            console.log('Map created, loading set to false');
          }}
          ref={mapRef}
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
          <MapInteractionOverlay map={map} bounds={bounds} />
          
          {/* Handle map clicks */}
          <MapClickHandler onMapClick={onMapClick} />

          {/* Add a subtle map overlay for better contrast */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.1))',
              zIndex: 2
            }}
          />

          {/* Return to center button */}
          <div className="absolute bottom-4 right-4 z-[1000]">
            <button
              onClick={() => map?.setView([-26.189, 28.075], 14)}
              className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>

          {/* Enhanced zoom controls */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button
              onClick={() => map?.zoomIn({ animate: true })}
              className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              onClick={() => map?.zoomOut({ animate: true })}
              className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          </div>

          {/* Render hazard markers and circles */}
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
              <Circle
                center={[hazard.location.lat, hazard.location.lng]}
                radius={50}
                pathOptions={{
                  color: getHazardColor(hazard.type),
                  fillColor: getHazardColor(hazard.type),
                  fillOpacity: 0.5,
                  className: 'hazard-circle'
                }}
              />
            </React.Fragment>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapComponent; 