import React, { useState } from 'react';
import { X } from 'lucide-react';
import { IconSelector } from '../IconSelector';
import { ColorSelector } from '../ColorSelector';
import { addCategory } from '../../lib/firebase';

interface AddWarehouseItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddWarehouseItemModal: React.FC<AddWarehouseItemModalProps> = ({
  isOpen,
  onClose
}) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Package');
  const [selectedColor, setSelectedColor] = useState('bg-purple-500');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addCategory({
        title: name,
        icon: selectedIcon,
        color: selectedColor,
        row: 4 // Ряд склада
      });
      onClose();
    } catch (error) {
      console.error('Error adding warehouse item:', error);
      alert('Ошибка при добавлении категории склада');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Добавить категорию склада</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название категории
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-purple-500 focus:border-purple-500"
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
              {loading ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};