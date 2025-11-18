import React, { useState } from 'react';
import { X } from 'lucide-react';
import { IconSelector } from '../IconSelector';
import { ColorSelector } from '../ColorSelector';
import { addCategory } from '../../lib/firebase';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose
}) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('User');
  const [selectedColor, setSelectedColor] = useState('bg-amber-400');
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
        row: 2 // Ряд сотрудников
      });
      onClose();
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Ошибка при добавлении сотрудника');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Добавить сотрудника</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ФИО сотрудника
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>

          <IconSelector
            selectedIcon={selectedIcon}
            onSelectIcon={setSelectedIcon}
            categoryRow={2}
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
              className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
            >
              {loading ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};