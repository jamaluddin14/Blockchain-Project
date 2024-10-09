import React from 'react';

const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
    <div className="text-center">
      <div className="loader border-t-4 border-b-4 border-white rounded-full w-12 h-12 animate-spin"></div>
      <p className="mt-4 text-xl text-white">Please wait...</p>
    </div>
  </div>
);

export default LoadingOverlay;
