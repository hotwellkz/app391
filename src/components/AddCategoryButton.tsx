import React from 'react';
import { Plus } from 'lucide-react';

interface AddCategoryButtonProps {
  onClick: () => void;
}

export const AddCategoryButton: React.FC<AddCategoryButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="h-full flex items-center justify-center cursor-pointer group"
    >
      <div className="w-10 h-10 bg-gray-100 group-hover:bg-gray-200 rounded-full flex items-center justify-center shadow-sm transition-colors">
        <Plus className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
      </div>
    </button>
  );
};