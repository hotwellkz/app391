import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Product, NewProduct, PREDEFINED_UNITS } from '../../types/product';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: NewProduct) => Promise<void>;
  product?: Product;
  isEditMode?: boolean;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  isEditMode = false
}) => {
  const [formData, setFormData] = useState<NewProduct>({
    name: product?.name || '',
    unit: product?.unit || PREDEFINED_UNITS[0].value,
    price: product?.price || 0,
    order: product?.order || 0
  });
  const [customUnit, setCustomUnit] = useState('');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [loading, setLoading] = useState(false);

  // При инициализации проверяем, является ли текущая единица измерения предопределенной
  React.useEffect(() => {
    if (product?.unit) {
      const isPredefined = PREDEFINED_UNITS.some(u => u.value === product.unit);
      setIsCustomUnit(!isPredefined);
      if (!isPredefined) {
        setCustomUnit(product.unit);
      }
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        unit: isCustomUnit ? customUnit : formData.unit
      };
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Ошибка при сохранении товара');
    } finally {
      setLoading(false);
    }
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'custom') {
      setIsCustomUnit(true);
    } else {
      setIsCustomUnit(false);
      setFormData({ ...formData, unit: value });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isEditMode ? 'Редактировать товар' : 'Добавить товар'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Наименование
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              required
              disabled={isEditMode}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Единица измерения
            </label>
            <select
              value={isCustomUnit ? 'custom' : formData.unit}
              onChange={handleUnitChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 mb-2"
            >
              {PREDEFINED_UNITS.map(unit => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
              <option value="custom">Другое</option>
            </select>

            {isCustomUnit && (
              <input
                type="text"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="Введите единицу измерения"
                className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Цена (₸)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => {
                console.log('New price:', Number(e.target.value));
                setFormData({ ...formData, price: Number(e.target.value) });
              }}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              required
              min="0"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Сохранение...' : isEditMode ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};