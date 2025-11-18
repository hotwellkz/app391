import React from 'react';
import { Search } from 'lucide-react';

interface EmployeeSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const EmployeeSearchBar: React.FC<EmployeeSearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="flex-1 relative px-2 sm:px-0">
      <input
        type="text"
        placeholder="Поиск сотрудников..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 sm:h-12 px-4 py-2 pl-10 bg-white border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      <Search className="absolute left-5 sm:left-3 top-2.5 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
    </div>
  );
};