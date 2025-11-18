import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product, Transaction } from '../../types/warehouse';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TransactionHistoryProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  product,
  isOpen,
  onClose
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'productMovements'),
      where('productId', '==', product.id),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      
      setTransactions(transactionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [product.id]);

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    return format(timestamp.toDate(), 'd MMMM yyyy, HH:mm', { locale: ru });
  };

  const formatAmount = (amount: number): string => {
    if (!amount || typeof amount !== 'number') return '0 ₸';
    return amount.toLocaleString('ru-RU') + ' ₸';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4" style={{ maxHeight: '90vh' }}>
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">История транзакций</p>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                Склад {product.warehouse}
              </span>
            </div>
          </div>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 83px)' }}>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">История операций пуста</h3>
              <p className="text-gray-500">
                Здесь будут отображаться все операции с товаром
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`p-4 rounded-lg ${
                    transaction.type === 'in' ? 'bg-emerald-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      {transaction.type === 'in' ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-500 mr-3" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-500 mr-3" />
                      )}
                      <div>
                        <p className="font-medium">
                          {transaction.type === 'in' ? 'Приход' : 'Расход'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {transaction.warehouse}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === 'in' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'in' ? '+' : '-'} {transaction.quantity} {product.unit}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatAmount(transaction.price)} / {product.unit}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(transaction.date)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};