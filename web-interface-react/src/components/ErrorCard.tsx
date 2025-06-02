import React from 'react';

interface ErrorCardProps {
  message: string;
  onDismiss: () => void;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-8 fade-in">
      <div className="flex items-center mb-4">
        <i className="fas fa-exclamation-triangle text-red-500 text-2xl mr-3"></i>
        <h3 className="text-xl font-semibold text-red-800">Error</h3>
        <button
          onClick={onDismiss}
          className="ml-auto text-red-500 hover:text-red-700 transition-colors"
          title="Dismiss error"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div className="text-red-700">{message}</div>
    </div>
  );
};

export default ErrorCard;
