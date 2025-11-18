import React, { useState } from 'react';
import { X } from 'lucide-react';
import { IconSelector } from './IconSelector';
import { ColorSelector } from './ColorSelector';
import { addCategory } from '../lib/firebase';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRow: number;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ 
  isOpen, 
  onClose,
  selectedRow 
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-emerald-500');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addCategory({
        title,
        amount: amount + ' ₸',
        icon: selectedIcon,
        color: selectedColor,
        row: selectedRow
      });
      
      onClose();
      setTitle('');
      setAmount('');
      setSelectedIcon('');
      setSelectedColor('bg-emerald-500');
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Ошибка при добавлении категории');
    }
  };

  const getRowTitle = () => {
    switch (selectedRow) {
      case 1:
        return 'Клиенты';
      case 2:
        return 'Сотрудники';
      case 3:
        return 'Проекты';
      case 4:
        return 'Склад';
      default:
        return 'Новая категория';
    }
  };

  // Устанавливаем начальную иконку в зависимости от категории
  React.useEffect(() => {
    switch (selectedRow) {
      case 1:
        setSelectedIcon('User');
        setSelectedColor('bg-amber-400');
        break;
      case 2:
        setSelectedIcon('User');
        setSelectedColor('bg-emerald-500');
        break;
      case 3:
        setSelectedIcon('Building2');
        setSelectedColor('bg-blue-500');
        break;
      case 4:
        setSelectedIcon('Package');
        setSelectedColor('bg-purple-500');
        break;
    }
  }, [selectedRow]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Добавить в категорию: {getRowTitle()}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сумма
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <IconSelector
              selectedIcon={selectedIcon}
              onSelectIcon={setSelectedIcon}
              categoryRow={selectedRow}
            />

            <ColorSelector
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
            />

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};