import React from 'react';
import { TransactionHistoryItem } from './TransactionHistoryItem';
import { TransactionHistoryEmpty } from './TransactionHistoryEmpty';
import { useSwipeable } from 'react-swipeable';

interface TransactionHistoryListProps {
  transactions: any[];
  swipedTransactionId: string | null;
  setSwipedTransactionId: (id: string | null) => void;
  onDeleteClick: (transaction: any) => void;
}

export const TransactionHistoryList: React.FC<TransactionHistoryListProps> = ({
  transactions,
  swipedTransactionId,
  setSwipedTransactionId,
  onDeleteClick
}) => {
  const handlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      const element = eventData.event.target as HTMLElement;
      const transactionElement = element.closest('[data-transaction-id]');
      if (transactionElement) {
        const transactionId = transactionElement.getAttribute('data-transaction-id');
        if (transactionId) {
          setSwipedTransactionId(transactionId === swipedTransactionId ? null : transactionId);
        }
      }
    },
    onSwipedRight: () => {
      setSwipedTransactionId(null);
    },
    trackMouse: true,
    delta: 10
  });

  if (transactions.length === 0) {
    return <TransactionHistoryEmpty />;
  }

  return (
    <div className="divide-y" {...handlers}>
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          data-transaction-id={transaction.id}
        >
          <TransactionHistoryItem
            transaction={transaction}
            swipedTransactionId={swipedTransactionId}
            onDelete={() => onDeleteClick(transaction)}
          />
        </div>
      ))}
    </div>
  );
};