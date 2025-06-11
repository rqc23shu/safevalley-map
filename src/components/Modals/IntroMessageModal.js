import React from 'react';
import { useTranslation } from 'react-i18next';

const IntroMessageModal = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 sm:p-8 text-center relative">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          {t('intro.title')}
        </h2>
        <p className="text-gray-700 mb-6 leading-relaxed">
          {t('intro.message1')}
        </p>
        <p className="text-gray-700 mb-8 leading-relaxed">
          {t('intro.message2')}
        </p>
        <button
          onClick={onClose}
          className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-full hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {t('intro.button')}
        </button>
      </div>
    </div>
  );
};

export default IntroMessageModal; 