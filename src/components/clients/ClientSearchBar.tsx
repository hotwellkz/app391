import React from 'react';
import { Search } from 'lucide-react';

interface ClientSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const ClientSearchBar: React.FC<ClientSearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="relative flex-1">
      <input
        type="text"
        placeholder="Поиск по ФИО, номеру клиента, адресу или названию объекта..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 pl-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-10"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    </div>
  );
};