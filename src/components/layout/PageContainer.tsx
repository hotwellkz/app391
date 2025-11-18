import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <div className="h-8" /> {/* Фиксированный нижний отступ */}
    </div>
  );
};