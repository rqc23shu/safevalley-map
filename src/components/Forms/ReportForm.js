// ReportForm.js
// Modal form for reporting hazards on the map

import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { validateHazardReport, sanitizeInput } from '../../utils/validation';

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
    duration: 1,
  });
  // State for submission status and errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Handle input changes for all form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user makes changes
    setErrors([]);
  };

  // Handle form submission: add report to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);

    // Validate form data
    const validationErrors = validateHazardReport({ ...formData, location });
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    // Sanitize input
    const sanitizedData = {
      ...formData,
      description: sanitizeInput(formData.description),
    };

    try {
      await addDoc(collection(db, 'hazards'), {
        ...sanitizedData,
        location,
        isApproved: false,
        isRejected: false,
        createdAt: new Date(),
        status: 'pending',
        retryCount: 0
      });
      onClose();
    } catch (err) {
      console.error('Error submitting report:', err);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setErrors(['Failed to submit report. Retrying...']);
        // Retry after a short delay
        setTimeout(() => handleSubmit(e), 1000);
      } else {
        setErrors(['Failed to submit report after multiple attempts. Please try again later.']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Report a Hazard</h2>
        {/* Show error messages if any */}
        {errors.length > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
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
              <option value="water_leak">Water Leak</option>
              <option value="sewerage_leak">Sewerage Leak</option>
              <option value="flooding">Flooding</option>
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
              maxLength={500}
              placeholder="Please provide a detailed description (10-500 characters)"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Photo upload placeholder (disabled) */}
          <div className="mb-4">
            <label className="label" htmlFor="photo">
              Photo (Coming Soon)
            </label>
            <input
              type="file"
              id="photo"
              name="photo"
              className="input"
              disabled
              placeholder="Photo upload coming soon"
            />
            <p className="text-sm text-gray-500 mt-1">
              Photo upload functionality will be available in a future update
            </p>
          </div>

          <div className="mb-4">
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
              disabled={isSubmitting}
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