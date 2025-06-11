// AdminPanel.js
// Admin interface for moderating hazard reports

import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

// Simple password for prototype demo
const ADMIN_PASSWORD = 'admin123';

const hazardTypes = [
  { value: 'crime', label: 'Crime', icon: '🚨' },
  { value: 'load_shedding', label: 'Load Shedding', icon: '⚡' },
  { value: 'pothole', label: 'Pothole', icon: '🕳️' },
  { value: 'dumping', label: 'Illegal Dumping', icon: '🗑️' },
  { value: 'water_leak', label: 'Water Leak', icon: '💧' },
  { value: 'sewerage_leak', label: 'Sewerage Leak', icon: '🚰' },
  { value: 'flooding', label: 'Flooding', icon: '🌊' },
];

const EditHazardModal = ({ hazard, onClose, onSave }) => {
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
      setError('Failed to save changes. Please try again.');
      console.error('Error saving hazard:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Hazard</h2>
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
              Hazard Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {hazardTypes.map(({ value, label, icon }) => (
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
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
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
              Duration (days)
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
              Cancel
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
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [editHazard, setEditHazard] = useState(null);
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
      setError('Error loading hazards');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [authenticated]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Login</h2>
          <p className="text-sm text-gray-500 mb-6">
            For demo purposes, use password: {ADMIN_PASSWORD}
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
                placeholder="Enter admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    if (password === ADMIN_PASSWORD) setAuthenticated(true);
                    else alert('Incorrect password');
                  }
                }}
              />
            </div>
            <button
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              onClick={() => {
                if (password === ADMIN_PASSWORD) setAuthenticated(true);
                else alert('Incorrect password');
              }}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleApprove = async (hazardId) => {
    try {
      const hazardRef = doc(db, 'hazards', hazardId);
      await updateDoc(hazardRef, {
        isApproved: true,
        isRejected: false,
        isDeleted: false,
        approvedAt: new Date(),
        rejectedAt: null,
        deletedAt: null
      });
    } catch (err) {
      console.error('Error approving hazard:', err);
      alert('Failed to approve hazard. Please try again.');
    }
  };

  const handleReject = async (reportId) => {
    try {
      await updateDoc(doc(db, 'hazards', reportId), {
        isRejected: true,
        isApproved: false,
        isDeleted: false,
        rejectedAt: new Date(),
        approvedAt: null,
        deletedAt: null
      });
    } catch (err) {
      setError('Error rejecting report');
      console.error('Reject error:', err);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action can be undone from the Deleted tab.')) return;
    try {
      await updateDoc(doc(db, 'hazards', reportId), {
        isDeleted: true,
        deletedAt: new Date()
      });
    } catch (err) {
      setError('Error deleting report');
      console.error('Delete error:', err);
    }
  };

  const handleRestore = async (reportId) => {
    try {
      await updateDoc(doc(db, 'hazards', reportId), {
        isDeleted: false,
        isApproved: false,
        isRejected: false,
        deletedAt: null,
        rejectedAt: null,
        approvedAt: null
      });
    } catch (err) {
      setError('Error restoring report');
      console.error('Restore error:', err);
    }
  };

  const handleEditSave = async (reportId, newData) => {
    try {
      await updateDoc(doc(db, 'hazards', reportId), {
        ...newData,
        updatedAt: new Date()
      });
    } catch (err) {
      setError('Error updating report');
      console.error('Update error:', err);
    }
  };

  const handlePermanentDelete = async (hazardId) => {
    if (!window.confirm('Are you sure you want to permanently delete this hazard? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'hazards', hazardId));
      setHazards(hazards.filter(h => h.id !== hazardId));
    } catch (error) {
      console.error('Error permanently deleting hazard:', error);
      setError('Failed to permanently delete hazard. Please try again.');
    }
  };

  const getTabCount = (tab) => {
    return hazards.filter(hazard => {
      if (tab === 'pending') return !hazard.isApproved && !hazard.isRejected && !hazard.isDeleted;
      if (tab === 'approved') return hazard.isApproved && !hazard.isDeleted;
      if (tab === 'rejected') return hazard.isRejected && !hazard.isDeleted;
      return hazard.isDeleted;
    }).length;
  };

  const filteredHazards = hazards.filter(hazard => {
    switch (activeTab) {
      case 'pending':
        return !hazard.isApproved && !hazard.isRejected && !hazard.isDeleted;
      case 'approved':
        return hazard.isApproved && !hazard.isDeleted;
      case 'rejected':
        return hazard.isRejected && !hazard.isDeleted;
      case 'deleted':
        return hazard.isDeleted;
      default:
        return true;
    }
  });

  const getTabStyles = (tab) => {
    const baseStyles = 'px-6 py-4 text-sm font-medium border-b-2';
    const activeStyles = {
      pending: 'border-yellow-500 text-yellow-600',
      approved: 'border-green-500 text-green-600',
      rejected: 'border-red-500 text-red-600',
      deleted: 'border-purple-500 text-purple-600'
    };
    const inactiveStyles = {
      pending: 'border-transparent text-gray-500 hover:text-yellow-600 hover:border-yellow-300',
      approved: 'border-transparent text-gray-500 hover:text-green-600 hover:border-green-300',
      rejected: 'border-transparent text-gray-500 hover:text-red-600 hover:border-red-300',
      deleted: 'border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300'
    };

    return `${baseStyles} ${activeTab === tab ? activeStyles[tab] : inactiveStyles[tab]}`;
  };

  const getStatusBadge = (hazard) => {
    if (hazard.isDeleted) {
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
          Deleted
        </span>
      );
    }
    if (hazard.isApproved) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
          Approved
        </span>
      );
    }
    if (hazard.isRejected) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
          Rejected
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
        Pending
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {['pending', 'approved', 'rejected', 'deleted'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={getTabStyles(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="ml-2 px-2 py-1 rounded text-xs font-medium" style={{
                    backgroundColor: tab === 'pending' ? '#FEF3C7' : 
                                   tab === 'approved' ? '#D1FAE5' :
                                   tab === 'rejected' ? '#FEE2E2' :
                                   '#F3E8FF',
                    color: tab === 'pending' ? '#92400E' :
                          tab === 'approved' ? '#065F46' :
                          tab === 'rejected' ? '#991B1B' :
                          '#6B21A8'
                  }}>
                    {getTabCount(tab)}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
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

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : filteredHazards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No {activeTab} reports found.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredHazards.map((hazard) => (
                  <div
                    key={hazard.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {hazardTypes.find(t => t.value === hazard.type)?.icon || '⚠️'}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {hazardTypes.find(t => t.value === hazard.type)?.label || 'Unknown Hazard'}
                            </h3>
                            {getStatusBadge(hazard)}
                          </div>
                          <p className="text-sm text-gray-500">
                            Reported {new Date(hazard.createdAt?.seconds * 1000).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {activeTab === 'deleted' ? (
                          <>
                            <button
                              onClick={() => handleRestore(hazard.id)}
                              className="p-2 text-green-600 hover:text-green-700 focus:outline-none"
                              title="Restore"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setEditHazard(hazard)}
                              className="p-2 text-blue-600 hover:text-blue-700 focus:outline-none"
                              title="Edit"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(hazard.id)}
                              className="p-2 text-red-600 hover:text-red-700 focus:outline-none"
                              title="Permanently Delete"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            {activeTab === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(hazard.id)}
                                  className="p-2 text-green-600 hover:text-green-700 focus:outline-none"
                                  title="Approve"
                                >
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleReject(hazard.id)}
                                  className="p-2 text-yellow-600 hover:text-yellow-700 focus:outline-none"
                                  title="Reject"
                                >
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            )}
                            {activeTab === 'rejected' && (
                              <button
                                onClick={() => handleApprove(hazard.id)}
                                className="p-2 text-green-600 hover:text-green-700 focus:outline-none"
                                title="Approve"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            {activeTab === 'approved' && (
                              <button
                                onClick={() => handleReject(hazard.id)}
                                className="p-2 text-yellow-600 hover:text-yellow-700 focus:outline-none"
                                title="Reject"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => setEditHazard(hazard)}
                              className="p-2 text-blue-600 hover:text-blue-700 focus:outline-none"
                              title="Edit"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(hazard.id)}
                              className="p-2 text-red-600 hover:text-red-700 focus:outline-none"
                              title="Delete"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-gray-700">{hazard.description}</p>
                    </div>
                    <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Duration: {hazard.duration} days</span>
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
          onSave={(newData) => handleEditSave(editHazard.id, newData)}
        />
      )}
    </div>
  );
};

export default AdminPanel; 