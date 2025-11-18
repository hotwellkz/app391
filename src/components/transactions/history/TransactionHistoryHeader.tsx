import React, { useState } from 'react';
import { X, Search, Filter, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatAmount } from '../../../utils/formatUtils';

interface TransactionHistoryHeaderProps {
  title: string;
  onClose: () => void;
  totalAmount: number;
  salaryTotal: number;
  onSearch: (query: string) => void;
  onFilterChange: (filter: 'all' | 'salary' | 'cashless') => void;
  selectedFilter: 'all' | 'salary' | 'cashless';
}

export const TransactionHistoryHeader: React.FC<TransactionHistoryHeaderProps> = ({
  title,
  onClose,
  totalAmount,
  salaryTotal,
  onSearch,
  onFilterChange,
  selectedFilter
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="bg-white border-b">
      {/* Заголовок */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold truncate pr-2">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-gray-100 rounded-full sm:hidden"
            aria-label="Показать фильтры"
          >
            <Filter className="w-5 h-5 text-gray-500" />
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 sm:max-w-md sm:mx-auto">
        <div className="bg-white p-3 rounded-lg shadow-sm sm:w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <ArrowDownRight className="w-5 h-5 text-red-500" />
              <span className="text-sm text-gray-600">Общая сумма:</span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-red-600 ml-2 sm:ml-0">
              {formatAmount(totalAmount)}
            </span>
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm sm:w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-gray-600">Сумма ЗП:</span>
            </div>
            <span className="text-base sm:text-lg font-semibold text-emerald-600 ml-2 sm:ml-0">
              {formatAmount(salaryTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className={`${showFilters ? 'block' : 'hidden sm:block'} p-3 space-y-3 border-t`}>
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск по описанию или сумме..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-1 sm:flex-none ${
              selectedFilter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Все операции
          </button>
          <button
            onClick={() => onFilterChange('salary')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-1 sm:flex-none ${
              selectedFilter === 'salary'
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}
          >
            Только ЗП
          </button>
          <button
            onClick={() => onFilterChange('cashless')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-1 sm:flex-none ${
              selectedFilter === 'cashless'
                ? 'bg-purple-500 text-white'
                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
            }`}
          >
            Безналичные
          </button>
        </div>
      </div>
    </div>
  );
};