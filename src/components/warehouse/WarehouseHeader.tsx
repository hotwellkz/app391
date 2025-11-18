import React from 'react';

interface WarehouseHeaderProps {
  title: string;
  subtitle: string;
}

export const WarehouseHeader: React.FC<WarehouseHeaderProps> = ({
  title,
  subtitle
}) => {
  return (
    <div className="bg-emerald-500 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="py-4">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <div className="mt-2 text-emerald-100">{subtitle}</div>
        </div>
      </div>
    </div>
  );
};