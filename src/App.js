// App.js
// Main application component for SafeValley Map
// Handles routing, navigation, travel mode filter, and integration of map, report form, and admin panel

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MapComponent from './components/Map/MapComponent';
import ReportForm from './components/Forms/ReportForm';
import AdminPanel from './components/Forms/AdminPanel';

/**
 * App - Main entry point for the SafeValley Map web app.
 * - Displays navigation bar with travel mode filter and admin panel link
 * - Handles showing the map, report form, and admin panel
 * - Uses React Router for page navigation
 */
function App() {
  // State for showing the report form modal
  const [showReportForm, setShowReportForm] = useState(false);
  // State for the location selected on the map
  const [selectedLocation, setSelectedLocation] = useState(null);
  // State for the selected travel mode filter
  const [selectedTravelMode, setSelectedTravelMode] = useState('all');

  // Handler for map click: opens the report form at the clicked location
  const handleMapClick = (e) => {
    setSelectedLocation({
      lat: e.latlng.lat,
      lng: e.latlng.lng
    });
    setShowReportForm(true);
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Navigation bar with app title, travel mode filter, and admin panel link */}
        <nav className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              {/* App title links to home */}
              <Link to="/" className="text-2xl font-bold text-primary">
                SafeValley Map
              </Link>
              <div className="flex items-center gap-4">
                {/* Travel mode filter dropdown */}
                <select
                  value={selectedTravelMode}
                  onChange={(e) => setSelectedTravelMode(e.target.value)}
                  className="input max-w-xs"
                >
                  <option value="all">All Travel Modes</option>
                  <option value="walking">Walking</option>
                  <option value="cycling">Cycling</option>
                  <option value="car">Car</option>
                  <option value="taxi">Taxi</option>
                </select>
                {/* Link to admin panel */}
                <Link
                  to="/admin"
                  className="btn btn-secondary"
                >
                  Admin Panel
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content: routes for map and admin panel */}
        <main className="flex-1 flex flex-col min-h-0">
          <Routes>
            {/* Home route: map and report form */}
            <Route
              path="/"
              element={
                <>
                  <MapComponent
                    onMapClick={handleMapClick}
                    selectedTravelMode={selectedTravelMode}
                  />
                  {/* Show report form modal if a location is selected */}
                  {showReportForm && selectedLocation && (
                    <ReportForm
                      location={selectedLocation}
                      onClose={() => {
                        setShowReportForm(false);
                        setSelectedLocation(null);
                      }}
                    />
                  )}
                </>
              }
            />
            {/* Admin panel route */}
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-auto">
          <div className="container mx-auto px-4 py-4">
            <p className="text-center text-gray-600">
              SafeValley Map - Making Makers Valley Safer
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
