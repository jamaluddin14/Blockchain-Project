import React from 'react';

const ErrorModal = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <h2 className="text-xl font-bold text-red-500 mb-4">Oops! Something went wrong.</h2>
        <p className="text-gray-700">{message}</p>
        <button onClick={onClose} className="mt-6 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all duration-300">
          Close
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;
