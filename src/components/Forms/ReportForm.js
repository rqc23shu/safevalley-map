// ReportForm.js
// Modal form for reporting hazards on the map

import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

/**
 * ReportForm - Modal form for submitting a new hazard report
 * - Collects hazard type, description, radius, duration, and (placeholder) photo
 * - Submits the report to Firestore with isApproved: false
 * - Shows validation and error messages
 */
const ReportForm = ({ location, onClose }) => {
  // State for form fields
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    radius: 100,
    duration: 1,
  });
  // State for submission status and errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Handle input changes for all form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission: add report to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate radius
    if (Number(formData.radius) > 500) {
      setError('Radius too large. Please enter a value of 500 meters or less.');
      setIsSubmitting(false);
      return;
    }

    try {
      await addDoc(collection(db, 'hazards'), {
        ...formData,
        location,
        isApproved: false,
        isRejected: false,
        createdAt: new Date(),
      });
      onClose();
    } catch (err) {
      setError('Failed to submit report. Please try again.');
      console.error('Error submitting report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Report a Hazard</h2>
        {/* Show error message if submission fails */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {/* Hazard report form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="label" htmlFor="type">
              Hazard Type
            </label>
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

          <div className="mb-4">
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              rows="3"
              required
            />
          </div>

          {/* Photo upload placeholder (disabled) */}
          <div className="mb-4">
            <label className="label" htmlFor="photo">
              Photo (placeholder)
            </label>
            <input
              type="file"
              id="photo"
              name="photo"
              className="input"
              disabled
              placeholder="Photo upload coming soon"
            />
          </div>

          <div className="mb-4">
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

          <div className="mb-6">
            <label className="label" htmlFor="duration">
              Duration (days)
            </label>
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
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportForm; 