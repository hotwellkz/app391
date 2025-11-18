import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      <span className="ml-3 text-xl font-medium text-gray-900">Загрузка...</span>
    </div>
  );
};