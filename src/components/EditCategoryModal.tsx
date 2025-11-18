import React, { useState } from 'react';
import { X } from 'lucide-react';
import { IconSelector } from './IconSelector';
import { ColorSelector } from './ColorSelector';
import { doc, collection, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CategoryCardType } from '../types';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';

interface EditCategoryModalProps {
  category: CategoryCardType;
  isOpen: boolean;
  onClose: () => void;
}

export const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  category,
  isOpen,
  onClose,
}) => {
  const [title, setTitle] = useState(category.title);
  const [amount, setAmount] = useState(category.amount.replace(/[^\d.-]/g, ''));
  const [selectedIcon, setSelectedIcon] = useState(category.iconName);
  const [selectedColor, setSelectedColor] = useState(category.color);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const batch = writeBatch(db);
      const categoryRef = doc(db, 'categories', category.id);

      // Обновляем категорию
      batch.update(categoryRef, {
        title,
        amount: amount ? `${parseFloat(amount).toLocaleString('ru-RU')} ₸` : '0 ₸',
        icon: selectedIcon,
        color: selectedColor,
        updatedAt: serverTimestamp()
      });

      // Если название изменилось, обновляем все связанные транзакции
      if (title !== category.title) {
        const [fromQuery, toQuery] = [
          query(collection(db, 'transactions'), where('fromUser', '==', category.title)),
          query(collection(db, 'transactions'), where('toUser', '==', category.title))
        ];

        const [fromSnapshots, toSnapshots] = await Promise.all([
          getDocs(fromQuery),
          getDocs(toQuery)
        ]);

        fromSnapshots.forEach((doc) => {
          batch.update(doc.ref, { fromUser: title });
        });

        toSnapshots.forEach((doc) => {
          batch.update(doc.ref, { toUser: title });
        });
      }

      await batch.commit();
      showSuccessNotification('Категория успешно обновлена');
      onClose();
    } catch (error) {
      console.error('Error updating category:', error);
      showErrorNotification('Ошибка при обновлении категории');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.-]/g, '');
    if (value === '' || !isNaN(Number(value))) {
      setAmount(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl transform transition-all">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold">Редактировать категорию</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Сумма
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d.-]/g, '');
                  if (value === '' || !isNaN(Number(value))) {
                    setAmount(value);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                ₸
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Будет сохранено как: {amount ? `${parseFloat(amount).toLocaleString('ru-RU')} ₸` : '0 ₸'}
            </p>
          </div>

          <IconSelector
            selectedIcon={selectedIcon}
            onSelectIcon={setSelectedIcon}
            categoryRow={category.row || 1}
          />

          <ColorSelector
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-lg text-white font-medium transition-all transform active:scale-95 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};