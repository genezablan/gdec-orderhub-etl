import React from 'react';

const LoadingCard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center fade-in">
      <div className="loading-spinner mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Checking Order Status</h3>
      <p className="text-gray-600">Please wait while we fetch your order details from TikTok...</p>
    </div>
  );
};

export default LoadingCard;
