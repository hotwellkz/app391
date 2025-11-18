import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { showErrorNotification } from '../../utils/notifications';

interface EditStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStats: {
    balance: string;
    expenses: string;
  };
  onUpdate: () => void;
}

export const EditStatsModal: React.FC<EditStatsModalProps> = ({
  isOpen,
  onClose,
  currentStats,
  onUpdate
}) => {
  const [balance, setBalance] = useState('');
  const [expenses, setExpenses] = useState('');

  // Обновляем значения при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      // Очищаем значения от форматирования и символов валюты
      const cleanBalance = currentStats.balance.replace(/[^\d.-]/g, '');
      const cleanExpenses = currentStats.expenses.replace(/[^\d.-]/g, '');
      setBalance(cleanBalance);
      setExpenses(cleanExpenses);
    }
  }, [isOpen, currentStats]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const balanceValue = parseFloat(balance || '0');
      const expensesValue = parseFloat(expenses || '0');

      // Создаем транзакцию для установки нового баланса
      await addDoc(collection(db, 'transactions'), {
        amount: balanceValue,
        categoryId: 'system_balance',
        type: 'system_adjustment',
        description: 'Установка баланса',
        date: Timestamp.now(),
        fromUser: 'Система',
        toUser: 'Система'
      });

      // Создаем транзакцию для установки новых расходов
      await addDoc(collection(db, 'transactions'), {
        amount: -Math.abs(expensesValue), // Всегда отрицательное значение для расходов
        categoryId: 'system_expenses',
        type: 'system_adjustment',
        description: 'Установка расходов',
        date: Timestamp.now(),
        fromUser: 'Система',
        toUser: 'Система'
      });

      onUpdate();
      onClose();
      showErrorNotification('Значения успешно обновлены', 'success');
    } catch (error) {
      console.error('Error updating stats:', error);
      showErrorNotification('Ошибка при обновлении данных');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Редактировать показатели</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Баланс
              </label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Введите баланс"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Расходы
              </label>
              <input
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Введите расходы"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
