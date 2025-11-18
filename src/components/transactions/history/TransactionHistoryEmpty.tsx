import React from 'react';
import { FileText } from 'lucide-react';

export const TransactionHistoryEmpty: React.FC = () => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <FileText className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">История операций пуста</h3>
      <p className="text-gray-500">Здесь будут отображаться все операции</p>
    </div>
  );
};