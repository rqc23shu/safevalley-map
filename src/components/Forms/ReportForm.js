// ReportForm.js
// Modal form for reporting hazards on the map

import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { validateHazardReport, sanitizeInput } from '../../utils/validation';
import { useTranslation } from 'react-i18next';

const hazardTypes = [
  { value: 'crime', icon: '🚨' },
  { value: 'load_shedding', icon: '⚡' },
  { value: 'pothole', icon: '🕳️' },
  { value: 'dumping', icon: '🗑️' },
  { value: 'water_leak', icon: '💧' },
  { value: 'sewerage_leak', icon: '🚰' },
  { value: 'flooding', icon: '🌊' },
];

/**
 * ReportForm - Modal form for submitting a new hazard report
 * - Collects hazard type, description, radius, duration, and (placeholder) photo
 * - Submits the report to Firestore with isApproved: false
 * - Shows validation and error messages
 */
const ReportForm = ({ location, onClose }) => {
  const { t } = useTranslation();
  // State for form fields
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    duration: 1,
  });
  // State for photo upload
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
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

  // Handle photo file selection
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors([t('report.invalidFileType')]);
        setPhoto(null);
        setPhotoPreview(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors([t('report.fileTooLarge')]);
        setPhoto(null);
        setPhotoPreview(null);
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrors([]); // Clear errors when a valid file is selected
    } else {
      setPhoto(null);
      setPhotoPreview(null);
    }
  };

  // Handle form submission: add report to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);

    // Minimum character validation
    if (formData.description.trim().length < 5) {
      setErrors([t('report.minCharsHelper')]);
      setIsSubmitting(false);
      return;
    }

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

    let photoUrl = '';
    if (photo) {
      try {
        const storageRef = ref(storage, `hazard_photos/${Date.now()}_${photo.name}`);
        const snapshot = await uploadBytes(storageRef, photo);
        photoUrl = await getDownloadURL(snapshot.ref);
      } catch (uploadError) {
        console.error('Error uploading photo:', uploadError);
        setErrors([t('report.errorSubmit')]); // Use a generic submit error for photo upload failure
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await addDoc(collection(db, 'hazards'), {
        ...sanitizedData,
        location,
        isApproved: false,
        isRejected: false,
        createdAt: new Date(),
        status: 'pending',
        retryCount: 0,
        photoUrl: photoUrl || null // Add photoUrl to Firestore document
      });
      onClose();
    } catch (err) {
      console.error('Error submitting report:', err);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setErrors([t('report.errorSubmit')]);
        // Retry after a short delay
        setTimeout(() => handleSubmit(e), 1000);
      } else {
        setErrors([t('report.errorSubmitFinal')]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{t('report.title')}</h2>
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
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded mx-6 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <ul className="list-disc list-inside text-sm text-red-700">
                  {errors.map((error, index) => (
                    <li key={index}>{
                      error === t('report.minCharsHelper') // Check against translated error
                        ? t('report.minCharsHelper')
                        : error === t('report.invalidFileType')
                          ? t('report.invalidFileType')
                          : error === t('report.fileTooLarge')
                            ? t('report.fileTooLarge')
                            : error === t('report.errorSubmit')
                              ? t('report.errorSubmit')
                              : error === t('report.errorSubmitFinal')
                                ? t('report.errorSubmitFinal')
                                : error
                    }</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('report.hazardType')}
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
                {t('report.description')}
              </label>
              <div className="relative">
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="5"
                  required
                  maxLength={500}
                  placeholder={t('report.descriptionPlaceholder')}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 overflow-y-auto"
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {formData.description.length}/500
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{t('report.minCharsHelper')}</div>
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                {t('report.duration')}
              </label>
              <div className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, duration: Math.max(1, prev.duration - 1) }))}
                  className="p-3 rounded-l-md bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors duration-200 border border-gray-300 border-r-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                  </svg>
                </button>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="1"
                  className="flex-1 text-center border-y border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 w-24 px-2"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, duration: prev.duration + 1 }))}
                  className="p-3 rounded-r-md bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors duration-200 border border-gray-300 border-l-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0H6" />
                  </svg>
                </button>
                <span className="ml-2 self-center text-sm text-gray-700">{t('common.days')}</span>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
                {t('report.photoUpload')} <span className="text-gray-500">{t('report.photoUploadOptional')}</span>
              </label>
              <input
                type="file"
                id="photo"
                name="photo"
                accept="image/*"
                onChange={handlePhotoChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {photoPreview && (
                <div className="mt-4 text-center">
                  <img src={photoPreview} alt="Photo Preview" className="max-w-full max-h-48 object-contain mx-auto rounded-md shadow-md border border-gray-200" />
                </div>
              )}
              {!photo && !photoPreview && (
                <p className="text-sm text-gray-500 mt-2">{t('report.noPhotoUploaded')}</p>
              )}
            </div>
          </form>
        </div>

        <div className="p-6 pt-4 border-t border-gray-200 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            {t('report.cancel')}
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
                {t('common.submitting')}
              </span>
            ) : (
              t('report.submit')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportForm; 