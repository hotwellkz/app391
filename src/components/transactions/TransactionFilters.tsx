import React from 'react';
import clsx from 'clsx';

interface TransactionFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedFilter: 'all' | 'salary' | 'cashless';
  onFilterChange: (filter: 'all' | 'salary' | 'cashless') => void;
  className?: string;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  className
}) => {
  return (
    <div className={clsx("flex flex-col sm:flex-row gap-2 sm:gap-4", className)}>
      {/* Поиск */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Поиск по описанию или сумме..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-all duration-300"
        />
      </div>

      {/* Фильтры */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        <button
          onClick={() => onFilterChange('all')}
          className={clsx(
            "px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300",
            selectedFilter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Все операции
        </button>
        <button
          onClick={() => onFilterChange('salary')}
          className={clsx(
            "px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300",
            selectedFilter === 'salary'
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
          )}
        >
          Только ЗП
        </button>
        <button
          onClick={() => onFilterChange('cashless')}
          className={clsx(
            "px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300",
            selectedFilter === 'cashless'
              ? 'bg-blue-500 text-white'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          )}
        >
          Безналичные
        </button>
      </div>
    </div>
  );
};
