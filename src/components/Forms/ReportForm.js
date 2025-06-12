// ReportForm.js
// My form component for reporting hazards
// TODO: maybe add image compression before upload
// TODO: check if we need to add more validation rules

import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { validateHazardReport, sanitizeInput } from '../../utils/validation';
import { hazardTypes } from '../../utils/constants';
import { useTranslation } from 'react-i18next';

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
    location: location || null,
    photoUrl: null
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
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

    console.log('Starting form submission...');
    console.log('Form Data:', formData);
    console.log('Location:', location);

    // Minimum character validation (client-side display only)
    if (formData.description.trim().length < 10) {
      console.log('Description validation failed.');
      setErrors([t('report.minCharsHelper')]);
      setIsSubmitting(false);
      return;
    }

    // Validate form data
    const validationErrors = validateHazardReport({ ...formData, location });
    if (validationErrors.length > 0) {
      console.log('Frontend validation errors:', validationErrors);
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }
    console.log('Frontend validation passed.');

    // Sanitize input
    const sanitizedData = {
      ...formData,
      description: sanitizeInput(formData.description),
    };
    console.log('Sanitized Data:', sanitizedData);

    // Photo upload is disabled in this prototype due to Firebase billing limitations.
    // let photoUrl = '';
    // if (photo) {
    //   console.log('Photo detected, attempting upload...');
    //   try {
    //     const storageRef = ref(storage, `hazard_photos/${Date.now()}_${photo.name}`);
    //     const snapshot = await uploadBytes(storageRef, photo);
    //     photoUrl = await getDownloadURL(snapshot.ref);
    //     console.log('Photo uploaded successfully. URL:', photoUrl);
    //   } catch (uploadError) {
    //     console.error('Error uploading photo:', uploadError);
    //     setErrors([t('report.errorSubmit')]); // Use a generic submit error for photo upload failure
    //     setIsSubmitting(false);
    //     return;
    //   }
    // }
    // For demo purposes, use a mock photo URL
    const mockPhotoUrl = photoPreview ? 'https://via.placeholder.com/150' : null;

    try {
      console.log('Attempting to add document to Firestore...');
      await addDoc(collection(db, 'hazards'), {
        ...sanitizedData,
        location,
        isApproved: false,
        isRejected: false,
        createdAt: new Date(),
        status: 'pending',
        retryCount: 0,
        photoUrl: mockPhotoUrl // Use mock photo URL for admin tab
      });
      console.log('Document added successfully. Closing form.');
      onClose();
    } catch (err) {
      console.error('Error submitting report:', err);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setErrors([t('report.errorSubmit')]);
        console.log(`Retrying submission (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        // Retry after a short delay
        setTimeout(() => handleSubmit(e), 1000);
      } else {
        setErrors([t('report.errorSubmitFinal')]);
        console.log('Max retries reached. Final submission error.');
      }
    } finally {
      setIsSubmitting(false);
      console.log('Submission process finished.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-auto my-8 flex flex-col transform transition-all duration-300 ease-out sm:scale-100 opacity-100 scale-95">
        <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100">
          <h2 className="text-2xl font-extrabold text-gray-900">{t('report.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
            aria-label="Close Report Form"
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errors.length > 0 && (
          <div className="mx-6 mt-4 mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-3" role="alert">
            <svg className="h-5 w-5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold mb-1">{t('common.errors')}</h3>
              <ul className="list-disc list-inside text-sm leading-relaxed">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                {t('report.hazardType')}
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
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 p-3 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-offset-0"
                />
                <div className="absolute bottom-2 right-3 text-xs text-gray-500">
                  {formData.description.length}/500
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{t('report.minCharsHelper')}</div>
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-semibold text-gray-800 mb-2">
                {t('report.duration')}
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

            {/* Photo Upload Section */}
            <div>
              <label htmlFor="photo" className="block text-sm font-semibold text-gray-800 mb-2">
                {t('report.photoUpload')} <span className="text-gray-500 font-normal">{t('report.photoUploadOptional')}</span>
              </label>
              <input
                type="file"
                id="photo"
                name="photo"
                accept="image/*"
                onChange={handlePhotoChange}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {photoPreview && (
                <div className="mt-4 text-center p-2 border border-gray-200 rounded-lg bg-gray-50">
                  <img src={photoPreview} alt="Photo Preview" className="max-w-full max-h-48 object-contain mx-auto rounded-md shadow" />
                </div>
              )}
              {!photo && !photoPreview && (
                <p className="text-sm text-gray-500 mt-2">{t('report.noPhotoUploaded')}</p>
              )}
            </div>

            {/* Moved buttons inside the form */}
            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
              >
                {t('report.cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;