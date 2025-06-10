// AdminPanel.js
// Admin interface for moderating hazard reports

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy, limit, startAfter } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../../services/firebase';

const ITEMS_PER_PAGE = 10;

const EditHazardModal = ({ hazard, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    type: hazard.type || '',
    description: hazard.description || '',
    radius: hazard.radius || 100,
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
        <button 
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" 
          onClick={onClose}
          disabled={isSaving}
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">Edit Hazard</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="type">Hazard Type</label>
            <select 
              id="type" 
              name="type" 
              value={formData.type} 
              onChange={handleChange} 
              className="input" 
              required
            >
              <option value="">Select a type</option>
              <option value="crime">Crime</option>
              <option value="load_shedding">Load Shedding</option>
              <option value="pothole">Pothole</option>
              <option value="dumping">Illegal Dumping</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea 
              id="description" 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              className="input" 
              rows="3" 
              required 
              maxLength={500}
            />
          </div>
          <div>
            <label className="label" htmlFor="radius">
              Radius (meters) <span className="text-xs text-gray-500">(max 500)</span>
            </label>
            <input 
              type="number" 
              id="radius" 
              name="radius" 
              value={formData.radius} 
              onChange={handleChange} 
              className="input" 
              min="10" 
              max="500" 
              required 
            />
          </div>
          <div>
            <label className="label" htmlFor="duration">Duration (days)</label>
            <input 
              type="number" 
              id="duration" 
              name="duration" 
              value={formData.duration} 
              onChange={handleChange} 
              className="input" 
              min="1" 
              max="30" 
              required 
            />
          </div>
          <div className="flex justify-end gap-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * AdminPanel - Admin interface for reviewing and moderating hazard reports
 * - Requires password authentication for access
 * - Fetches pending reports from Firestore (isApproved: false, isRejected: false)
 * - Allows admin to approve or reject reports
 * - Shows report details for moderation
 */
const AdminPanel = () => {
  // State for all hazards
  const [hazards, setHazards] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  // State for loading and error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // State for authentication
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [editHazard, setEditHazard] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  // Effect: fetch hazards if authenticated
  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchHazards = async () => {
      try {
        const q = query(
          collection(db, 'hazards'),
          orderBy('createdAt', 'desc'),
          limit(ITEMS_PER_PAGE)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const allHazards = [];
          querySnapshot.forEach((doc) => {
            allHazards.push({ id: doc.id, ...doc.data() });
          });
          setHazards(allHazards);
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
          setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);
          setLoading(false);
        }, (err) => {
          setError('Error loading hazards');
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        setError('Error setting up hazards listener');
        setLoading(false);
      }
    };

    fetchHazards();
  }, [auth.currentUser]);

  // Handle admin login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError('Invalid email or password');
      console.error('Login error:', err);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      setError('Error signing out');
      console.error('Logout error:', err);
    }
  };

  // Load more hazards
  const loadMore = async () => {
    if (!lastVisible || !hasMore) return;

    try {
      const q = query(
        collection(db, 'hazards'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(ITEMS_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      const newHazards = [];
      snapshot.forEach((doc) => {
        newHazards.push({ id: doc.id, ...doc.data() });
      });

      setHazards(prev => [...prev, ...newHazards]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
    } catch (err) {
      setError('Error loading more hazards');
      console.error('Load more error:', err);
    }
  };

  // Handle report approval
  const handleApprove = async (reportId) => {
    try {
      await updateDoc(doc(db, 'hazards', reportId), {
        isApproved: true,
        approvedAt: new Date(),
        status: 'approved'
      });
    } catch (err) {
      setError('Error approving report');
      console.error('Approve error:', err);
    }
  };

  // Handle report rejection
  const handleReject = async (reportId) => {
    try {
      await updateDoc(doc(db, 'hazards', reportId), {
        isRejected: true,
        rejectedAt: new Date(),
        status: 'rejected'
      });
    } catch (err) {
      setError('Error rejecting report');
      console.error('Reject error:', err);
    }
  };

  // Handle report deletion
  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'hazards', reportId));
    } catch (err) {
      setError('Error deleting report');
      console.error('Delete error:', err);
    }
  };

  // Handle hazard edit/save
  const handleEditSave = async (reportId, newData) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'hazards', reportId), {
        ...newData,
        updatedAt: new Date()
      });
      setEditHazard(null);
    } catch (err) {
      setError('Error saving changes');
      console.error('Edit save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Categorize hazards
  const pendingReports = hazards.filter(h => !h.isApproved && !h.isRejected);
  const approvedReports = hazards.filter(h => h.isApproved && !h.isRejected);
  const rejectedReports = hazards.filter(h => h.isRejected);

  // Show login form if not authenticated
  if (!auth.currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-white p-6 rounded shadow max-w-xs w-full">
          <h2 className="text-xl font-bold mb-4">Admin Login</h2>
          {authError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {authError}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="label" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="label" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Main admin panel UI
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>

      {/* Show error message if needed */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-8 border-b">
        <button
          className={`px-4 py-2 -mb-px font-semibold border-b-2 transition-colors duration-200 ${
            activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          Pending <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">{pendingReports.length}</span>
        </button>
        <button
          className={`px-4 py-2 -mb-px font-semibold border-b-2 transition-colors duration-200 ${
            activeTab === 'approved' ? 'border-green-500 text-green-700' : 'border-transparent text-gray-500 hover:text-green-700'
          }`}
          onClick={() => setActiveTab('approved')}
        >
          Approved <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{approvedReports.length}</span>
        </button>
        <button
          className={`px-4 py-2 -mb-px font-semibold border-b-2 transition-colors duration-200 ${
            activeTab === 'rejected' ? 'border-red-500 text-red-700' : 'border-transparent text-gray-500 hover:text-red-700'
          }`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">{rejectedReports.length}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'pending' && (
          <section>
            {pendingReports.length === 0 ? (
              <p className="text-gray-500">No pending reports</p>
            ) : (
              <div className="grid gap-6">
                {pendingReports.map((report) => (
                  <div key={report.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold capitalize flex items-center gap-2">
                          {report.type.replace('_', ' ')}
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Pending</span>
                        </h3>
                        <p className="text-gray-500">
                          Reported {report.createdAt && report.createdAt.toDate ? new Date(report.createdAt.toDate()).toLocaleString() : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditHazard(report)}
                          className="btn btn-secondary flex items-center gap-1"
                          title="Edit report"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M3 17v4h4l10.293-10.293a1 1 0 00-1.414-1.414L3 17z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleApprove(report.id)}
                          className="btn btn-success flex items-center gap-1"
                          title="Approve report"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(report.id)}
                          className="btn btn-danger flex items-center gap-1"
                          title="Reject report"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">{report.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-semibold">Radius:</span> {report.radius}m
                      </div>
                      <div>
                        <span className="font-semibold">Duration:</span> {report.duration} days
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'approved' && (
          <section>
            {approvedReports.length === 0 ? (
              <p className="text-gray-500">No existing pins</p>
            ) : (
              <div className="grid gap-6">
                {approvedReports.map((report) => (
                  <div key={report.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold capitalize flex items-center gap-2">
                          {report.type.replace('_', ' ')}
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Approved</span>
                        </h3>
                        <p className="text-gray-500">
                          Approved {report.approvedAt && report.approvedAt.toDate ? new Date(report.approvedAt.toDate()).toLocaleString() : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditHazard(report)}
                          className="btn btn-secondary flex items-center gap-1"
                          title="Edit pin"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M3 17v4h4l10.293-10.293a1 1 0 00-1.414-1.414L3 17z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="btn btn-danger flex items-center gap-1"
                          title="Delete pin"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">Description</h4>
                        <p className="text-gray-600">{report.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium">Location</h4>
                          <p className="text-gray-600">
                            Lat: {report.location.lat.toFixed(6)}<br />
                            Lng: {report.location.lng.toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium">Details</h4>
                          <p className="text-gray-600">
                            Radius: {report.radius}m<br />
                            Duration: {report.duration} days
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'rejected' && (
          <section>
            {rejectedReports.length === 0 ? (
              <p className="text-gray-500">No rejected reports</p>
            ) : (
              <div className="grid gap-6">
                {rejectedReports.map((report) => (
                  <div key={report.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold capitalize flex items-center gap-2">
                          {report.type.replace('_', ' ')}
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Rejected</span>
                        </h3>
                        <p className="text-gray-500">
                          Rejected {report.rejectedAt && report.rejectedAt.toDate ? new Date(report.rejectedAt.toDate()).toLocaleString() : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="btn btn-danger flex items-center gap-1"
                          title="Delete report"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">Description</h4>
                        <p className="text-gray-600">{report.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium">Location</h4>
                          <p className="text-gray-600">
                            Lat: {report.location.lat.toFixed(6)}<br />
                            Lng: {report.location.lng.toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium">Details</h4>
                          <p className="text-gray-600">
                            Radius: {report.radius}m<br />
                            Duration: {report.duration} days
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              className="btn btn-secondary"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
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