// ReportForm.js
// Modal form for reporting hazards on the map

import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { validateHazardReport, sanitizeInput } from '../../utils/validation';

const hazardTypes = [
  { value: 'crime', label: 'Crime', icon: '🚨' },
  { value: 'load_shedding', label: 'Load Shedding', icon: '⚡' },
  { value: 'pothole', label: 'Pothole', icon: '🕳️' },
  { value: 'dumping', label: 'Illegal Dumping', icon: '🗑️' },
  { value: 'water_leak', label: 'Water Leak', icon: '💧' },
  { value: 'sewerage_leak', label: 'Sewerage Leak', icon: '🚰' },
  { value: 'flooding', label: 'Flooding', icon: '🌊' },
];

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Report a Hazard</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <ul className="list-disc list-inside text-sm text-red-700">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
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
              placeholder="Please provide a detailed description of the hazard..."
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
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Report'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm; 