import React from 'react';
import { X } from 'lucide-react';
import { CategoryCardType } from '../../../types';

interface TransferHeaderProps {
  sourceCategory: CategoryCardType;
  targetCategory: CategoryCardType;
  onClose: () => void;
}

export const TransferHeader: React.FC<TransferHeaderProps> = ({
  sourceCategory,
  targetCategory,
  onClose
}) => {
  return (
    <div className="relative">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
          Перевод средств
        </h2>
        <button 
          onClick={onClose}
          className="p-2 -mr-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-xl">
        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-gray-500">От:</span>
            <span className="ml-2 font-medium text-gray-900">{sourceCategory.title}</span>
          </div>
          <div>
            <span className="text-gray-500">Кому:</span>
            <span className="ml-2 font-medium text-gray-900">{targetCategory.title}</span>
          </div>
        </div>
        <div className="mt-2 text-sm">
          <span className="text-gray-500">Текущий баланс:</span>
          <span className="ml-2 font-medium text-gray-900">{sourceCategory.amount}</span>
        </div>
      </div>
    </div>
  );
};