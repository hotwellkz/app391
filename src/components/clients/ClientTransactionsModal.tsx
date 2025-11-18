import React from 'react';
import { X } from 'lucide-react';
import { Transaction } from '../transactions/types';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ClientTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  totalAmount: number;
}

const formatAmount = (amount: number) => {
  return Math.round(amount).toLocaleString('ru-RU', { maximumFractionDigits: 0 });
};

const formatDate = (date: Timestamp | Date | string): string => {
  let dateObj: Date;
  
  if (date instanceof Timestamp) {
    dateObj = date.toDate();
  } else if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    return '';
  }
  
  return format(dateObj, 'dd.MM.yyyy', { locale: ru });
};

export const ClientTransactionsModal: React.FC<ClientTransactionsModalProps> = ({
  isOpen,
  onClose,
  transactions,
  totalAmount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Расшифровка общей суммы по транзакциям
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Общая сумма */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Общая сумма:</span>
            <span className="text-lg font-semibold text-red-600">
              {formatAmount(totalAmount)} ₸
            </span>
          </div>
        </div>

        {/* Список транзакций */}
        <div className="flex-1 overflow-y-auto p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Транзакции не найдены
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 min-w-[100px]">
                        {formatDate(transaction.date)}
                      </span>
                      <span className="text-sm font-medium text-gray-900 flex-1">
                        {transaction.fromUser || transaction.toUser || '—'}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatAmount(Math.abs(transaction.amount))} ₸
                      </span>
                    </div>
                    {transaction.description && (
                      <div className="mt-1 ml-[108px]">
                        <span className="text-xs text-gray-500">{transaction.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Футер */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

