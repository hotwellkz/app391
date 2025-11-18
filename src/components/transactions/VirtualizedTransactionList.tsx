import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Transaction } from './types';
import OptimizedTransactionCard from './OptimizedTransactionCard';
import { formatAmount } from '../../utils/formatUtils';
import clsx from 'clsx';

interface GroupedTransactions {
  [key: string]: {
    date: Date;
    totalAmount: number;
    transactions: Transaction[];
  };
}

interface OptimizedTransactionListProps {
  transactions: Transaction[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  swipedTransactionId: string | null;
  swipeDirection: 'left' | 'right' | null;
  onDeleteClick: (transaction: Transaction) => void;
  onWaybillClick: (transaction: Transaction) => void;
}

const ITEMS_PER_PAGE = 20;

const OptimizedTransactionList: React.FC<OptimizedTransactionListProps> = memo(({
  transactions,
  hasMore,
  isLoading,
  onLoadMore,
  swipedTransactionId,
  swipeDirection,
  onDeleteClick,
  onWaybillClick
}) => {
  const [displayedItems, setDisplayedItems] = useState(ITEMS_PER_PAGE);
  const containerRef = useRef<HTMLDivElement>(null);

  // Группируем транзакции по дате с мемоизацией
  const groupedTransactions = useMemo(() => {
    return transactions.reduce((groups: GroupedTransactions, transaction) => {
      if (!transaction.date) return groups;

      const date = transaction.date.toDate ? transaction.date.toDate() : new Date(transaction.date);
      const dateKey = format(date, 'yyyy-MM-dd');

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date,
          totalAmount: 0,
          transactions: []
        };
      }

      groups[dateKey].totalAmount += transaction.amount;
      groups[dateKey].transactions.push(transaction);

      return groups;
    }, {});
  }, [transactions]);

  // Функция для форматирования заголовка дня
  const formatDayHeader = useCallback((date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Сегодня';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Вчера';
    } else {
      return format(date, 'EEE, d MMMM yyyy', { locale: ru });
    }
  }, []);

  // Обработчик скролла для подгрузки
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 100; // px до конца

    if (scrollHeight - scrollTop - clientHeight < threshold) {
      if (hasMore && !isLoading && displayedItems < transactions.length) {
        setDisplayedItems(prev => prev + ITEMS_PER_PAGE);
      } else if (hasMore && !isLoading) {
        onLoadMore();
      }
    }
  }, [hasMore, isLoading, onLoadMore, displayedItems, transactions.length]);

  // Debounced scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeoutId: NodeJS.Timeout;
    const debouncedScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 50);
    };

    container.addEventListener('scroll', debouncedScroll);
    return () => {
      container.removeEventListener('scroll', debouncedScroll);
      clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  // Получаем отображаемые транзакции
  const displayedTransactions = useMemo(() => {
    return transactions.slice(0, displayedItems);
  }, [transactions, displayedItems]);

  // Компонент заголовка дня
  const DayHeader = memo(({ date, totalAmount }: { date: Date; totalAmount: number }) => (
    <div className="bg-gray-100 px-4 py-2 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-600">
          {formatDayHeader(date)}
        </h3>
        <span className={clsx(
          "text-sm font-medium",
          totalAmount < 0 ? "text-red-600" : "text-emerald-600"
        )}>
          {totalAmount < 0 ? '- ' : '+ '}
          {formatAmount(Math.abs(totalAmount))}
        </span>
      </div>
    </div>
  ));

  DayHeader.displayName = 'DayHeader';

  // Компонент транзакции с мемоизацией
  const TransactionItem = memo(({ transaction }: { transaction: Transaction }) => (
    <OptimizedTransactionCard
      transaction={transaction}
      isExpanded={swipedTransactionId === transaction.id}
      swipeDirection={swipeDirection}
      onDelete={() => onDeleteClick(transaction)}
      onWaybill={() => onWaybillClick(transaction)}
    />
  ));

  TransactionItem.displayName = 'TransactionItem';

  if (displayedTransactions.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Транзакции не найдены</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="max-h-screen overflow-y-auto"
      style={{ height: 'calc(100vh - 200px)' }}
    >
      <div className="space-y-3 sm:space-y-4 py-4">
        {Object.entries(groupedTransactions)
          .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
          .map(([dateKey, group]) => (
            <div key={dateKey} className="space-y-2">
              <DayHeader date={group.date} totalAmount={group.totalAmount} />
              
              <div className="space-y-2">
                {group.transactions
                  .filter(transaction => displayedTransactions.includes(transaction))
                  .map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                    />
                  ))}
              </div>
            </div>
          ))}

        {/* Индикатор загрузки */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        )}

        {/* Кнопка "Загрузить ещё" если есть ещё элементы в памяти */}
        {displayedItems < transactions.length && !isLoading && (
          <div className="flex justify-center py-4">
            <button
              onClick={() => setDisplayedItems(prev => prev + ITEMS_PER_PAGE)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Показать ещё
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

OptimizedTransactionList.displayName = 'OptimizedTransactionList';

export default OptimizedTransactionList; 