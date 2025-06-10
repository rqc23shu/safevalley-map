// AdminPanel.js
// Admin interface for moderating hazard reports

import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

// Simple password for prototype demo
const ADMIN_PASSWORD = 'admin123';

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

const AdminPanel = () => {
  // State for all hazards
  const [hazards, setHazards] = useState([]);
  // State for loading and error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // State for authentication
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [editHazard, setEditHazard] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  // Effect: fetch all hazards if authenticated
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

  // Handle admin login
  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-white p-6 rounded shadow max-w-xs w-full">
          <h2 className="text-xl font-bold mb-4">Admin Login</h2>
          <p className="text-sm text-gray-500 mb-4">
            For demo purposes, use password: {ADMIN_PASSWORD}
          </p>
          <input
            type="password"
            className="input mb-4"
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            className="btn btn-primary w-full"
            onClick={() => {
              if (password === ADMIN_PASSWORD) setAuthenticated(true);
              else alert('Incorrect password');
            }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // Handle report approval
  const handleApprove = async (reportId) => {
    try {
      await updateDoc(doc(db, 'hazards', reportId), {
        isApproved: true,
        approvedAt: new Date()
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
        rejectedAt: new Date()
      });
    } catch (err) {
      setError('Error rejecting report');
      console.error('Reject error:', err);
    }
  };

  // Handle report deletion
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

  // Handle report restoration
  const handleRestore = async (reportId) => {
    try {
      await updateDoc(doc(db, 'hazards', reportId), {
        isDeleted: false,
        deletedAt: null
      });
    } catch (err) {
      setError('Error restoring report');
      console.error('Restore error:', err);
    }
  };

  // Handle hazard edit/save
  const handleEditSave = async (reportId, newData) => {
    try {
      await updateDoc(doc(db, 'hazards', reportId), {
        ...newData,
        updatedAt: new Date()
      });
      setEditHazard(null);
    } catch (err) {
      setError('Error saving changes');
      console.error('Edit save error:', err);
    }
  };

  // Categorize hazards
  const pendingReports = hazards.filter(h => !h.isApproved && !h.isRejected && !h.isDeleted);
  const approvedReports = hazards.filter(h => h.isApproved && !h.isRejected && !h.isDeleted);
  const rejectedReports = hazards.filter(h => h.isRejected && !h.isDeleted);
  const deletedReports = hazards.filter(h => h.isDeleted);

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
        <button onClick={() => setAuthenticated(false)} className="btn btn-secondary">
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
        <button
          className={`px-4 py-2 -mb-px font-semibold border-b-2 transition-colors duration-200 ${
            activeTab === 'deleted' ? 'border-purple-500 text-purple-700' : 'border-transparent text-gray-500 hover:text-purple-700'
          }`}
          onClick={() => setActiveTab('deleted')}
        >
          Deleted <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">{deletedReports.length}</span>
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
              <p className="text-gray-500">No approved reports</p>
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
                          title="Edit report"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M3 17v4h4l10.293-10.293a1 1 0 00-1.414-1.414L3 17z" />
                          </svg>
                          Edit
                        </button>
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

        {activeTab === 'deleted' && (
          <section>
            {deletedReports.length === 0 ? (
              <p className="text-gray-500">No deleted reports</p>
            ) : (
              <div className="grid gap-6">
                {deletedReports.map((report) => (
                  <div key={report.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold capitalize flex items-center gap-2">
                          {report.type.replace('_', ' ')}
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Deleted</span>
                        </h3>
                        <p className="text-gray-500">
                          Deleted {report.deletedAt && report.deletedAt.toDate ? new Date(report.deletedAt.toDate()).toLocaleString() : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestore(report.id)}
                          className="btn btn-secondary flex items-center gap-1"
                          title="Restore report"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Restore
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