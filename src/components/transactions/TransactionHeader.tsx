import React from 'react';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

interface TransactionHeaderProps {
  onBack: () => void;
  title: string;
  subtitle: string;
  className?: string;
}

export const TransactionHeader: React.FC<TransactionHeaderProps> = ({
  onBack,
  title,
  subtitle,
  className
}) => {
  return (
    <div className={clsx("flex items-center justify-between h-14 sm:h-16 transition-all duration-300", className)}>
      <div className="flex items-center">
        <button onClick={onBack} className="mr-3 sm:mr-4 p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">{title}</h1>
          <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};
