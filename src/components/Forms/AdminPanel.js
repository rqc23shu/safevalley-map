// AdminPanel.js
// Admin interface for moderating hazard reports

import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../../services/firebase';

// Simple password for prototype demo
const ADMIN_PASSWORD = 'admin123';

const hazardTypes = [
  { value: 'crime', icon: '🚨' },
  { value: 'load_shedding', icon: '⚡' },
  { value: 'pothole', icon: '🕳️' },
  { value: 'dumping', icon: '🗑️' },
  { value: 'water_leak', icon: '💧' },
  { value: 'sewerage_leak', icon: '🚰' },
  { value: 'flooding', icon: '🌊' },
];

// Photo Viewer Modal Component
const PhotoViewerModal = ({ photoUrl, onClose }) => {
  const { t } = useTranslation();
  if (!photoUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[100] font-sans">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full relative overflow-hidden transform transition-all duration-300 ease-out sm:scale-100 opacity-100 scale-95">
        <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100">
          <h2 className="text-2xl font-extrabold text-gray-900">{t('common.viewPhoto')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
            aria-label="Close photo viewer"
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 flex items-center justify-center bg-gray-50">
          <img src={photoUrl} alt="Hazard Report" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md" />
        </div>
        <div className="p-6 pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditHazardModal = ({ hazard, onClose, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    type: hazard.type || '',
    description: hazard.description || '',
    duration: hazard.duration || 1,
  });
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(t('admin.hazards.error'));
      console.error('Error saving hazard:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900">{t('admin.hazards.editTitle')}</h2>
          <button
            className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close edit form"
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-3" role="alert">
            <svg className="h-5 w-5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold">{t('common.error')}</p>
              <p className="text-sm leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {t('admin.hazards.type')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {hazardTypes.map(({ value, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChange({ target: { name: 'type', value } })}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ease-in-out
                    ${formData.type === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-105'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700'
                  }`}
                >
                  <span className="text-3xl mb-1">{icon}</span>
                  <span className="text-xs font-medium text-center">{t(`admin.hazardTypes.${value}`)}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2">
              {t('admin.hazards.description')}
            </label>
            <div className="relative">
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                required
                maxLength={500}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 p-3 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-offset-0"
              />
              <div className="absolute bottom-2 right-3 text-xs text-gray-500">
                {formData.description.length}/500
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-semibold text-gray-800 mb-2">
              {t('admin.hazards.duration')}
            </label>
            <div className="flex items-stretch rounded-lg overflow-hidden border border-gray-300 shadow-sm">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, duration: Math.max(1, prev.duration - 1) }))}
                className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                aria-label="Decrease duration"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                </svg>
              </button>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="1"
                max="30"
                className="flex-1 text-center border-y border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 p-3 text-gray-800 font-medium focus:ring-2 focus:ring-offset-0"
                aria-label="Duration in days"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, duration: prev.duration + 1 }))}
                className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                aria-label="Increase duration"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m0 0H6" />
                </svg>
              </button>
              <span className="ml-2 self-center text-sm text-gray-700">{t('common.days')}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
              disabled={isSaving}
            >
              {t('admin.hazards.cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('admin.hazards.saving')}
                </span>
              ) : (
                t('admin.hazards.saveChanges')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const { t } = useTranslation();
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [editHazard, setEditHazard] = useState(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null); // New state for photo viewer
  const [activeTab, setActiveTab] = useState('pending');

  // Simple password-based authentication for prototype
  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) { // Replace with a secure authentication method
      setAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  // Fetch hazards from Firestore
  useEffect(() => {
    if (!authenticated) return;

    setLoading(true);
    const q = query(collection(db, 'hazards'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hazardsData = snapshot.docs.map(doc => ({
        id: doc.id,
        // Ensure isDeleted is always defined, default to false if not present
        isDeleted: doc.data().isDeleted || false,
        ...doc.data()
      }));
      setHazards(hazardsData);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
      console.error('Error fetching hazards:', err);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [authenticated]);

  const handleApprove = async (hazardId) => {
    try {
      const hazardRef = doc(db, 'hazards', hazardId);
      await updateDoc(hazardRef, {
        isApproved: true,
        isRejected: false,
        isDeleted: false,
        approvedAt: new Date(),
        rejectedAt: null,
        deletedAt: null,
        status: 'approved' // Update status field
      });
    } catch (err) {
      console.error('Error approving hazard:', err);
      alert('Failed to approve hazard. Please try again.');
    }
  };

  const handleReject = async (reportId) => {
    try {
      const hazardRef = doc(db, 'hazards', reportId);
      await updateDoc(hazardRef, {
        isRejected: true,
        isApproved: false,
        isDeleted: false,
        rejectedAt: new Date(),
        approvedAt: null,
        deletedAt: null,
        status: 'rejected' // Update status field
      });
    } catch (err) {
      setError('Error rejecting report');
      console.error('Reject error:', err);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action can be undone from the Deleted tab.')) return;
    try {
      const hazardRef = doc(db, 'hazards', reportId);
      await updateDoc(hazardRef, {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'deleted' // Update status field
      });
    } catch (err) {
      setError('Error deleting report');
      console.error('Delete error:', err);
    }
  };

  const handleRestore = async (reportId) => {
    try {
      const hazardRef = doc(db, 'hazards', reportId);
      await updateDoc(hazardRef, {
        isDeleted: false,
        isApproved: false,
        isRejected: false,
        deletedAt: null,
        rejectedAt: null,
        approvedAt: null,
        status: 'pending' // Restore to pending status
      });
    } catch (err) {
      setError('Error restoring report');
      console.error('Restore error:', err);
    }
  };

  const handleEditSave = async (reportId, newData) => {
    try {
      const hazardRef = doc(db, 'hazards', reportId);
      await updateDoc(hazardRef, {
        ...newData,
        updatedAt: new Date()
      });
      setEditHazard(null); // Close the modal
    } catch (err) {
      setError('Error updating report');
      console.error('Update error:', err);
      throw err; // Re-throw to be caught by EditHazardModal
    }
  };

  const handlePermanentDelete = async (hazardId) => {
    if (!window.confirm('Are you sure you want to permanently delete this hazard? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'hazards', hazardId));
      setHazards(hazards.filter(h => h.id !== hazardId)); // Optimistically update UI
    } catch (error) {
      console.error('Error permanently deleting hazard:', error);
      setError('Failed to permanently delete hazard. Please try again.');
    }
  };

  const getTabCount = (tab) => {
    return hazards.filter(hazard => {
      if (tab === 'pending') return hazard.status === 'pending' && !hazard.isDeleted;
      if (tab === 'approved') return hazard.status === 'approved' && !hazard.isDeleted;
      if (tab === 'rejected') return hazard.status === 'rejected' && !hazard.isDeleted;
      if (tab === 'deleted') return hazard.isDeleted;
      return false; // Should not happen
    }).length;
  };

  const getTabStyles = (tab) => {
    const baseClasses = 'group inline-flex items-center px-1 py-3 border-b-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-t-lg';
    const activeClasses = 'border-blue-500 text-blue-600';
    const inactiveClasses = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    return `${baseClasses} ${activeTab === tab ? activeClasses : inactiveClasses}`;
  };

  const getStatusBadge = (hazard) => {
    // Prioritize the isDeleted flag for deleted items
    if (hazard.isDeleted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
          {t(`admin.status.deleted`)}
        </span>
      );
    }

    // Ensure hazard.status is defined, default to 'pending' if not
    const status = hazard.status || 'pending';

    let colorClass = '';
    let textClass = '';
    switch (status) {
      case 'pending':
        colorClass = 'bg-yellow-100 text-yellow-800';
        textClass = 'pending';
        break;
      case 'approved':
        colorClass = 'bg-green-100 text-green-800';
        textClass = 'approved';
        break;
      case 'rejected':
        colorClass = 'bg-red-100 text-red-800';
        textClass = 'rejected';
        break;
      case 'deleted':
        // This case might still be hit if a hazard has status: 'deleted' but isDeleted: false
        // However, the prior check for isDeleted should prevent this for truly deleted items.
        colorClass = 'bg-purple-100 text-purple-800';
        textClass = 'deleted';
        break;
      default:
        // If status is not one of the predefined values, default to pending appearance
        colorClass = 'bg-yellow-100 text-yellow-800';
        textClass = 'pending';
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
        {t(`admin.status.${textClass}`)}
      </span>
    );
  };

  const filteredHazards = hazards.filter(hazard => {
    // Ensure hazard.status is defined, default to 'pending' if not
    const status = hazard.status || 'pending';

    switch (activeTab) {
      case 'pending':
        return status === 'pending' && !hazard.isDeleted;
      case 'approved':
        return status === 'approved' && !hazard.isDeleted;
      case 'rejected':
        return status === 'rejected' && !hazard.isDeleted;
      case 'deleted':
        return hazard.isDeleted === true;
      default:
        return false;
    }
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
          <h2 className="text-3xl font-extrabold mb-4 text-gray-900">{t('admin.login.title')}</h2>
          <p className="text-gray-600 mb-6 text-sm">{t('admin.login.demoNote', { password: ADMIN_PASSWORD })}</p>
          <input
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 mb-4 text-gray-800 placeholder-gray-400 shadow-sm"
            placeholder={t('admin.login.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') handleLogin(); }}
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md"
          >
            {t('admin.login.loginButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-100 p-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{t('admin.panelTitle')}</h1>
            <p className="text-gray-600">{t('admin.subtitle')}</p>
          </div>
          <div className="border-b border-gray-100 px-6 pt-4">
            <nav className="-mb-px flex space-x-6">
              {['pending', 'approved', 'rejected', 'deleted'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${getTabStyles(tab)} group inline-flex items-center px-1 py-3 border-b-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-t-lg`}
                >
                  {t(`admin.tabs.${tab}`)}
                  <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: tab === 'pending' ? '#FEF3C7' :
                                     tab === 'approved' ? '#D1FAE5' :
                                     tab === 'rejected' ? '#FEE2E2' :
                                     '#EDE9FE', // Light purple for deleted
                      color: tab === 'pending' ? '#92400E' :
                            tab === 'approved' ? '#065F46' :
                            tab === 'rejected' ? '#991B1B' :
                            '#6B46C1' // Deeper purple for deleted
                    }}
                  >
                    {getTabCount(tab)}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-3" role="alert">
                <svg className="h-5 w-5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold">{t('common.error')}</p>
                  <p className="text-sm leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : filteredHazards.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium">{t('admin.hazards.noReportsFound')}</p>
                <p className="text-sm">{t('admin.hazards.tryAnotherTab')}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredHazards.map((hazard) => (
                  <div
                    key={hazard.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-xl transition-shadow duration-200 flex flex-col md:flex-row md:items-start gap-5"
                  >
                    {/* Left Section: Icon, Type, Description, Duration, Date */}
                    <div className="flex-1 flex flex-col space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl flex-shrink-0">
                          {hazardTypes.find(t => t.value === hazard.type)?.icon || '⚠️'}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {t(`admin.hazardTypes.${hazard.type}`, t('admin.hazards.unknownHazard'))}
                            </h3>
                            {getStatusBadge(hazard)}
                          </div>
                          <p className="text-sm text-gray-500">
                            {t('admin.hazards.reportedAt', { date: new Date(hazard.createdAt?.seconds * 1000).toLocaleString() })}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{hazard.description}</p>
                      <span className="text-sm text-gray-500 font-medium">{t('admin.hazards.duration')}: {hazard.duration} {t('common.days')}</span>
                    </div>

                    {/* Right Section: Photo and Action Buttons */}
                    <div className="flex-shrink-0 flex flex-col items-end space-y-3">
                      {hazard.photoUrl && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center shadow-sm">
                          <img src={hazard.photoUrl} alt="Hazard Report Photo" className="max-w-xs max-h-32 object-contain rounded" />
                          <button
                            onClick={() => setSelectedPhotoUrl(hazard.photoUrl)}
                            className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                          >
                            <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {t('common.viewPhoto')}
                          </button>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap justify-end gap-2">
                        {activeTab === 'deleted' ? (
                          <>
                            <button
                              onClick={() => handleRestore(hazard.id)}
                              className="p-2 text-green-600 hover:text-green-700 focus:outline-none rounded-md hover:bg-gray-100 transition-colors duration-200"
                              title={t('admin.actions.restore')}
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setEditHazard(hazard)}
                              className="p-2 text-blue-600 hover:text-blue-700 focus:outline-none rounded-md hover:bg-gray-100 transition-colors duration-200"
                              title={t('admin.actions.edit')}
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(hazard.id)}
                              className="p-2 text-red-600 hover:text-red-700 focus:outline-none rounded-md hover:bg-gray-100 transition-colors duration-200"
                              title={t('admin.actions.permanentDelete')}
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprove(hazard.id)}
                              className="p-2 text-green-600 hover:text-green-700 focus:outline-none rounded-md hover:bg-gray-100 transition-colors duration-200"
                              title={t('admin.actions.approve')}
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleReject(hazard.id)}
                              className="p-2 text-yellow-600 hover:text-yellow-700 focus:outline-none rounded-md hover:bg-gray-100 transition-colors duration-200"
                              title={t('admin.actions.reject')}
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setEditHazard(hazard)}
                              className="p-2 text-blue-600 hover:text-blue-700 focus:outline-none rounded-md hover:bg-gray-100 transition-colors duration-200"
                              title={t('admin.actions.edit')}
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(hazard.id)}
                              className="p-2 text-red-600 hover:text-red-700 focus:outline-none rounded-md hover:bg-gray-100 transition-colors duration-200"
                              title={t('admin.actions.delete')}
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {editHazard && (
        <EditHazardModal
          hazard={editHazard}
          onClose={() => setEditHazard(null)}
          onSave={handleEditSave}
        />
      )}
      {selectedPhotoUrl && (
        <PhotoViewerModal
          photoUrl={selectedPhotoUrl}
          onClose={() => setSelectedPhotoUrl(null)}
        />
      )}
    </div>
  );
};

export default AdminPanel; 