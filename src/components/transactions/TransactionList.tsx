import React from 'react';
import { GroupedTransactions } from '../../types/transaction';
import { TransactionItem } from './TransactionItem';
import { formatDateHeader } from '../../utils/dateUtils';
import { formatAmount } from '../../utils/formatUtils';

interface TransactionListProps {
  transactions: GroupedTransactions;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const calculateDailyTotal = (dayTransactions: any[]) => {
    return dayTransactions.reduce((total, transaction) => {
      return total + Math.abs(transaction.amount);
    }, 0);
  };

  return (
    <div className="divide-y divide-gray-100">
      {Object.entries(transactions).map(([date, dayTransactions]) => {
        const dailyTotal = calculateDailyTotal(dayTransactions);
        
        return (
          <div key={date} className="bg-gray-50">
            <div className="px-4 py-2 bg-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-600">
                  {formatDateHeader(date)}
                </h3>
                <span className="text-sm font-medium text-gray-900">
                  {formatAmount(dailyTotal)}
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {dayTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-end">
                <span className="text-sm font-medium text-gray-500">
                  Итого за день: {formatAmount(dailyTotal)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};