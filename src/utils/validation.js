// validation.js
// Utility functions for form validation

/**
 * Validates hazard report form data
 * @param {Object} data - The form data to validate
 * @returns {Array} Array of error messages, empty if valid
 */
export const validateHazardReport = (data) => {
  const errors = [];

  // Type validation
  if (!data.type || !['crime', 'load_shedding', 'pothole', 'dumping', 'water_leak', 'sewerage_leak', 'flooding'].includes(data.type)) {
    errors.push('Please select a valid hazard type');
  }

  // Description validation
  if (!data.description || data.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long');
  }
  if (data.description && data.description.trim().length > 500) {
    errors.push('Description must be less than 500 characters');
  }

  // Radius validation
  const radius = Number(data.radius);
  if (isNaN(radius) || radius <= 0 || radius > 500) {
    errors.push('Radius must be between 1 and 500 meters');
  }

  // Duration validation
  const duration = Number(data.duration);
  if (isNaN(duration) || duration < 1 || duration > 30) {
    errors.push('Duration must be between 1 and 30 days');
  }

  // Location validation
  if (!data.location || !data.location.lat || !data.location.lng) {
    errors.push('Invalid location data');
  }

  return errors;
};

/**
 * Sanitizes user input to prevent XSS and other attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}; 