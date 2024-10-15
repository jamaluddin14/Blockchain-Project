import React from 'react';

const ErrorModal = ({ message, onClose }) => {
  return (
    <div
      className="fixed inset-32 flex items-center justify-center bg-black bg-opacity-0 z-100 transition-opacity duration-300 ease-in-out"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full transform transition-transform duration-300 ease-in-out scale-95">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Oops! Something went wrong.</h2>
        <p className="text-gray-700">{message}</p>
        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;
