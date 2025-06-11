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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full relative overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{t('common.viewPhoto')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 flex items-center justify-center">
          <img src={photoUrl} alt="Hazard" className="max-w-full max-h-[70vh] object-contain" />
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
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
          <h2 className="text-xl font-bold text-gray-900">{t('admin.hazards.editTitle')}</h2>
          <button 
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
            disabled={isSaving}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.hazards.type')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {hazardTypes.map(({ value, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChange({ target: { name: 'type', value } })}
                  className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.type === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-xl mr-2">{icon}</span>
                  <span className="text-sm font-medium">{t(`admin.hazardTypes.${value}`)}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.hazards.description')}
            </label>
            <div className="relative">
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                required
                maxLength={500}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {formData.description.length}/500
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.hazards.duration')}
            </label>
            <div className="relative">
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="1"
                max="30"
                required
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm">days</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              disabled={isSaving}
            >
              {t('admin.hazards.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

  useEffect(() => {
    if (!authenticated) return;
    const q = query(collection(db, 'hazards'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allHazards = [];
      querySnapshot.forEach((doc) => {
        allHazards.push({ id: doc.id, ...doc.data() });
      });
      setHazards(allHazards);
      setLoading(false);
    }, (err) => {
      setError(t('admin.errors.loading'));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [authenticated, t]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('admin.login.title')}</h2>
          <p className="text-sm text-gray-500 mb-6">
            {t('admin.login.demoNote', { password: ADMIN_PASSWORD })}
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.login.password')}
              </label>
              <input
                id="password"
                type="password"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
                placeholder={t('admin.login.passwordPlaceholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    if (password === ADMIN_PASSWORD) setAuthenticated(true);
                    else alert(t('admin.errors.incorrectPassword'));
                  }
                }}
              />
            </div>
            <button
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              onClick={() => {
                if (password === ADMIN_PASSWORD) setAuthenticated(true);
                else alert(t('admin.errors.incorrectPassword'));
              }}
            >
              {t('admin.login.loginButton')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleApprove = async (hazardId) => {
    try {
      await updateDoc(doc(db, 'hazards', hazardId), { isApproved: true, status: 'approved' });
    } catch (err) {
      console.error('Error approving hazard:', err);
    }
  };

  const handleReject = async (reportId) => {
    try {
      await updateDoc(doc(db, 'hazards', reportId), { isRejected: true, status: 'rejected' });
    } catch (err) {
      console.error('Error rejecting hazard:', err);
    }
  };

  const handleDelete = async (reportId) => {
    try {
      await updateDoc(doc(db, 'hazards', reportId), { isDeleted: true, status: 'deleted' });
    } catch (err) {
      console.error('Error deleting hazard:', err);
    }
  };

  const handleRestore = async (reportId) => {
    try {
      await updateDoc(doc(db, 'hazards', reportId), { isDeleted: false, isRejected: false, isApproved: false, status: 'pending' });
    } catch (err) {
      console.error('Error restoring hazard:', err);
    }
  };

  const handleEditSave = async (reportId, newData) => {
    try {
      await updateDoc(doc(db, 'hazards', reportId), newData);
      setEditHazard(null);
    } catch (err) {
      console.error('Error updating hazard:', err);
      throw err; // Re-throw to be caught by EditHazardModal
    }
  };

  const handlePermanentDelete = async (hazardId) => {
    if (window.confirm('Are you sure you want to permanently delete this report?')) {
      try {
        await deleteDoc(doc(db, 'hazards', hazardId));
      } catch (err) {
        console.error('Error permanently deleting hazard:', err);
      }
    }
  };

  const getTabCount = (tab) => {
    switch (tab) {
      case 'pending':
        return hazards.filter(h => !h.isApproved && !h.isRejected && !h.isDeleted).length;
      case 'approved':
        return hazards.filter(h => h.isApproved && !h.isDeleted).length;
      case 'rejected':
        return hazards.filter(h => h.isRejected && !h.isDeleted).length;
      case 'deleted':
        return hazards.filter(h => h.isDeleted).length;
      default:
        return 0;
    }
  };

  const getTabStyles = (tab) => {
    const base = "px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200";
    return activeTab === tab
      ? `${base} border-blue-500 text-blue-600`
      : `${base} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
  };

  const getStatusBadge = (hazard) => {
    const status = hazard.status || 'pending';
    let colorClass = 'bg-gray-200 text-gray-800';
    switch (status) {
      case 'pending': colorClass = 'bg-yellow-100 text-yellow-800'; break;
      case 'approved': colorClass = 'bg-green-100 text-green-800'; break;
      case 'rejected': colorClass = 'bg-red-100 text-red-800'; break;
      case 'deleted': colorClass = 'bg-purple-100 text-purple-800'; break;
      default: colorClass = 'bg-gray-100 text-gray-800';
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
        {t(`admin.status.${status}`)}
      </span>
    );
  };

  const filteredHazards = hazards.filter(hazard => {
    const now = new Date();
    const created = hazard.createdAt?.seconds ? new Date(hazard.createdAt.seconds * 1000) : new Date(hazard.createdAt);
    const expires = new Date(created.getTime() + hazard.duration * 24 * 60 * 60 * 1000);
    const isExpired = now >= expires;

    switch (activeTab) {
      case 'pending':
        return !hazard.isApproved && !hazard.isRejected && !hazard.isDeleted && !isExpired;
      case 'approved':
        return hazard.isApproved && !hazard.isDeleted && !isExpired;
      case 'rejected':
        return hazard.isRejected && !hazard.isDeleted && !isExpired;
      case 'deleted':
        return hazard.isDeleted;
      default:
        return false;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {['pending', 'approved', 'rejected', 'deleted'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={getTabStyles(tab)}
                >
                  {t(`admin.tabs.${tab}`)}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {getTabCount(tab)}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('common.loading')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : filteredHazards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('admin.hazards.noReportsFound')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredHazards.map((hazard) => (
                <li key={hazard.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <span className="text-3xl">{hazardTypes.find(t => t.value === hazard.type)?.icon || '❓'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {t(`admin.hazardTypes.${hazard.type}`, t('admin.hazards.unknownHazard'))}
                        </h3>
                        {getStatusBadge(hazard)}
                      </div>
                      <p className="text-sm text-gray-500">
                        {t('admin.hazards.reportedAt', { date: new Date(hazard.createdAt?.seconds * 1000).toLocaleString() })}
                      </p>
                      <p className="mt-2 text-gray-700 text-sm break-words whitespace-pre-wrap">{hazard.description}</p>

                      {/* Photo Display & View Button */}
                      <div className="mt-2">
                        {hazard.photoUrl ? (
                          <button
                            onClick={() => setSelectedPhotoUrl(hazard.photoUrl)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {t('common.viewPhoto')}
                          </button>
                        ) : (
                          <p className="text-sm text-gray-500">{t('common.noPhotoAvailable')}</p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                        <span>{t('admin.hazards.duration')}: {hazard.duration} days</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      {activeTab === 'deleted' ? (
                        <>
                          <button
                            onClick={() => handleRestore(hazard.id)}
                            className="p-2 text-green-600 hover:text-green-700 focus:outline-none"
                            title={t('admin.actions.restore')}
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 0020 13a8 8 0 00-15.356-2m0 0v5h.582" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditHazard(hazard)}
                            className="p-2 text-blue-600 hover:text-blue-700 focus:outline-none"
                            title={t('admin.actions.edit')}
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(hazard.id)}
                            className="p-2 text-red-600 hover:text-red-700 focus:outline-none"
                            title={t('admin.actions.permanentDelete')}
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleApprove(hazard.id)}
                            className="p-2 text-green-600 hover:text-green-700 focus:outline-none"
                            title={t('admin.actions.approve')}
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleReject(hazard.id)}
                            className="p-2 text-yellow-600 hover:text-yellow-700 focus:outline-none"
                            title={t('admin.actions.reject')}
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditHazard(hazard)}
                            className="p-2 text-blue-600 hover:text-blue-700 focus:outline-none"
                            title={t('admin.actions.edit')}
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(hazard.id)}
                            className="p-2 text-red-600 hover:text-red-700 focus:outline-none"
                            title={t('admin.actions.delete')}
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
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