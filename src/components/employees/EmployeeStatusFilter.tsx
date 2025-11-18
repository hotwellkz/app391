import React from 'react';
import { Filter } from 'lucide-react';

interface EmployeeStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const EmployeeStatusFilter: React.FC<EmployeeStatusFilterProps> = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 sm:h-12 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer min-w-[120px] sm:min-w-[140px]"
    >
      <option value="all">Все</option>
      <option value="active">Активные</option>
      <option value="inactive">Неактивные</option>
    </select>
  );
};