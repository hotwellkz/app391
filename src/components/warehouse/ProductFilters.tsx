import React from 'react';
import { Filter } from 'lucide-react';
import { Product } from '../../types/warehouse';

interface ProductFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  products: Product[];
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  selectedCategory,
  onCategoryChange,
  products
}) => {
  // Получаем уникальные категории и сортируем их
  const categories = Array.from(new Set(products.map(p => p.category)))
    .filter(Boolean)
    .sort();

  return (
    <div className="flex items-center gap-2">
      <Filter className="w-5 h-5 text-gray-400" />
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <option value="all">Все категории</option>
        {categories.map(category => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
};