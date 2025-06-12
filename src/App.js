// App.js
// My main app component for the SafeValley Map project
// TODO: maybe add dark mode support later?
// TODO: check if we need to optimize the map loading

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n/config';
import MapComponent from './components/Map/MapComponent';
import ReportForm from './components/Forms/ReportForm';
import AdminPanel from './components/Forms/AdminPanel';
import LanguageSwitcher from './components/LanguageSwitcher';
import IntroMessageModal from './components/Modals/IntroMessageModal';
import PrototypeLoginPage from './components/Forms/PrototypeLoginPage';

// Navigation component - moved this here to keep things simple for now
// might refactor into separate file later if it gets too big
const Navigation = ({ selectedTravelMode, setSelectedTravelMode }) => {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';
  const { t } = useTranslation();

  // temp debug log - remove later
  // console.log('Current travel mode:', selectedTravelMode);

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* App title and logo - might add a proper logo later */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {t('map.title')}
            </span>
          </Link>

          {/* Navigation items and filters - might need to add more options later */}
          <div className="flex items-center gap-6">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Travel mode filter - might add more options later */}
            <div className="relative">
              <select
                value={selectedTravelMode}
                onChange={(e) => setSelectedTravelMode(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">{t('common.allTravelModes')}</option>
                <option value="walking">{t('common.walking')}</option>
                <option value="cycling">{t('common.cycling')}</option>
                <option value="car">{t('common.car')}</option>
                <option value="taxi">{t('common.taxi')}</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>

            {/* Admin panel link - might need to add auth check later */}
            <Link
              to="/admin"
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                isAdmin
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {t('navigation.admin')}
            </Link>

            {/* Login link - temp solution for now */}
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors duration-200"
            >
              {t('navigation.login')}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Main App component
// TODO: Add error boundary
// TODO: Maybe add loading states
function App() {
  const { t } = useTranslation();
  // State for showing the report form modal
  const [showReportForm, setShowReportForm] = useState(false);
  // State for the location selected on the map
  const [selectedLocation, setSelectedLocation] = useState(null);
  // State for the selected travel mode filter
  const [selectedTravelMode, setSelectedTravelMode] = useState('all');
  // State for showing the introductory message modal
  const [showIntroModal, setShowIntroModal] = useState(false);

  // Check if user has seen the intro message
  // TODO: Maybe add a way to reset this for testing
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('hasSeenIntroMessage');
    if (!hasSeenIntro) {
      setShowIntroModal(true);
    }
  }, []);

  // Close intro modal and save to localStorage
  const handleCloseIntroModal = () => {
    setShowIntroModal(false);
    localStorage.setItem('hasSeenIntroMessage', 'true');
  };

  // Handle map click - opens report form at clicked location
  // TODO: Add validation for valid coordinates
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
        <Navigation
          selectedTravelMode={selectedTravelMode}
          setSelectedTravelMode={setSelectedTravelMode}
        />

        <main className="flex-1 flex flex-col min-h-0">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <div className="relative flex-1">
                    <MapComponent
                      onMapClick={handleMapClick}
                      selectedTravelMode={selectedTravelMode}
                    />
                    {showReportForm && selectedLocation && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                          <ReportForm
                            location={selectedLocation}
                            onClose={() => {
                              setShowReportForm(false);
                              setSelectedLocation(null);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              }
            />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/login" element={<PrototypeLoginPage />} />
          </Routes>
        </main>

        {/* Show intro modal if needed */}
        {showIntroModal && <IntroMessageModal onClose={handleCloseIntroModal} />}

        {/* Footer - might add more links later */}
        <footer className="bg-white border-t mt-auto">
          <div className="container mx-auto px-4 py-4">
            <p className="text-center text-gray-600">
              {t('common.footer')}
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
