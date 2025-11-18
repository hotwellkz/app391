import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CategoryCardType } from '../types';
import { collection, query, where, getDocs, Timestamp, or } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Transaction {
  id: string;
  fromUser: string;
  toUser: string;
  amount: number;
  description: string;
  date: Timestamp;
  type: 'income' | 'expense';
  categoryId: string;
}

interface TransactionHistoryModalProps {
  category: CategoryCardType;
  isOpen: boolean;
  onClose: () => void;
}

const formatAmount = (amount: number, type: 'income' | 'expense'): string => {
  const formatted = new Intl.NumberFormat('ru-RU').format(Math.abs(amount));
  return type === 'expense' ? `- ${formatted} ₸` : `${formatted} ₸`;
};

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  category,
  isOpen,
  onClose,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchTransactions = async () => {
        try {
          // Создаем запрос для получения всех транзакций, где categoryId совпадает
          const q = query(
            collection(db, 'transactions'),
            where('categoryId', '==', category.id)
          );
          
          const querySnapshot = await getDocs(q);
          const transactionsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Transaction[];
          
          // Сортируем транзакции по дате (сначала новые)
          transactionsData.sort((a, b) => b.date.seconds - a.date.seconds);
          
          setTransactions(transactionsData);
          setError(null);
        } catch (error) {
          console.error('Error fetching transactions:', error);
          setError('Ошибка при загрузке транзакций');
        } finally {
          setLoading(false);
        }
      };

      fetchTransactions();
    }
  }, [category.id, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-10 z-50">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl" style={{ minHeight: '600px', maxHeight: '80vh' }}>
        <div className="sticky top-0 bg-white rounded-t-lg border-b border-gray-200 z-10">
          <div className="flex items-center p-6">
            <button onClick={onClose} className="mr-4 hover:bg-gray-100 p-2 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-semibold">{category.title}</h2>
          </div>
        </div>

        <div className="overflow-auto" style={{ height: 'calc(100% - 82px)' }}>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">
              {error}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              История операций пуста
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-medium text-base">{transaction.fromUser}</span>
                      <span className="text-sm text-gray-500 mt-1">{transaction.toUser}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`font-medium text-base ${
                        transaction.type === 'income' ? 'text-gray-900' : 'text-red-600'
                      }`}>
                        {formatAmount(transaction.amount, transaction.type)}
                      </span>
                      <span className="text-sm text-gray-500 mt-1">{transaction.description}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};