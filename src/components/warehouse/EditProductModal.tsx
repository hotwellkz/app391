import React, { useState } from 'react';
import { X } from 'lucide-react';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types/warehouse';
import { ImageUpload } from './ImageUpload';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [formData, setFormData] = useState({
    name: product.name,
    category: product.category,
    minQuantity: product.minQuantity,
    unit: product.unit,
    image: product.image || null
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });

      // Добавляем запись в историю
      await addDoc(collection(db, 'productHistory'), {
        productId: product.id,
        type: 'update',
        date: serverTimestamp(),
        user: {
          id: 'current-user-id', // Заменить на реального пользователя
          name: 'Текущий пользователь'
        },
        description: 'Обновлена информация о товаре'
      });

      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Ошибка при обновлении товара');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Редактировать товар</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Минимальное количество
            </label>
            <input
              type="number"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Единица измерения
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="шт">шт</option>
              <option value="кг">кг</option>
              <option value="м">м</option>
              <option value="м²">м²</option>
              <option value="м³">м³</option>
              <option value="л">л</option>
            </select>
          </div>

          <ImageUpload
            image={formData.image}
            onImageUpload={(url) => setFormData({ ...formData, image: url })}
            onImageRemove={() => setFormData({ ...formData, image: null })}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};