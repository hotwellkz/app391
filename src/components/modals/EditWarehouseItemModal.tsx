import React, { useState } from 'react';
import { X } from 'lucide-react';
import { IconSelector } from '../IconSelector';
import { ColorSelector } from '../ColorSelector';
import { CategoryCardType } from '../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { showErrorNotification } from '../../utils/notifications';

interface EditWarehouseItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryCardType;
}

export const EditWarehouseItemModal: React.FC<EditWarehouseItemModalProps> = ({
  isOpen,
  onClose,
  category
}) => {
  const [title, setTitle] = useState(category.title);
  const [selectedIcon, setSelectedIcon] = useState(category.iconName);
  const [selectedColor, setSelectedColor] = useState(category.color);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const categoryRef = doc(db, 'categories', category.id);
      await updateDoc(categoryRef, {
        title,
        icon: selectedIcon,
        color: selectedColor
      });

      showErrorNotification('Категория успешно обновлена');
      onClose();
    } catch (error) {
      console.error('Error updating category:', error);
      showErrorNotification('Ошибка при обновлении категории');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Редактировать категорию</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <IconSelector
            selectedIcon={selectedIcon}
            onSelectIcon={setSelectedIcon}
            categoryRow={4}
          />

          <ColorSelector
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
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
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};