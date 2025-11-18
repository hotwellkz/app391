import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';

interface TransactionStatsProps {
  totalAmount: number;
  salaryTotal: number;
  cashlessTotal: number;
  className?: string;
}

const formatAmount = (amount: number) => {
  return Math.round(amount).toLocaleString('ru-RU', { maximumFractionDigits: 0 });
};

export const TransactionStats: React.FC<TransactionStatsProps> = ({
  totalAmount,
  salaryTotal,
  cashlessTotal,
  className
}) => {
  return (
    <div className={clsx("grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-4 bg-white", className)}>
      <div className="bg-white rounded-lg shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            <span className="text-xs sm:text-sm text-gray-600">Общая сумма:</span>
          </div>
          <span className="text-base sm:text-lg font-semibold text-red-600">
            {formatAmount(Math.abs(totalAmount))} ₸
          </span>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            <span className="text-xs sm:text-sm text-gray-600">Сумма ЗП:</span>
          </div>
          <span className="text-base sm:text-lg font-semibold text-emerald-600">
            {formatAmount(Math.abs(salaryTotal))} ₸
          </span>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
            <span className="text-xs sm:text-sm text-gray-600">Безнал:</span>
          </div>
          <span className="text-base sm:text-lg font-semibold text-purple-600">
            {formatAmount(Math.abs(cashlessTotal))} ₸
          </span>
        </div>
      </div>
    </div>
  );
};
