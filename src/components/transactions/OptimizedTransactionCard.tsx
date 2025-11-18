import React, { memo, lazy, Suspense, useCallback } from 'react';
import { ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import { formatTime } from '../../utils/dateUtils';
import { formatAmount } from '../../utils/formatUtils';
import { Transaction } from './types';

interface TransactionCardProps {
  transaction: Transaction;
  isExpanded?: boolean;
  swipeDirection?: 'left' | 'right' | null;
  onDelete: () => void;
  onWaybill: () => void;
  renderAttachments?: () => React.ReactNode;
}

// Lazy loading для компонента изображений
const LazyImagePreview = lazy(() => import('./LazyImagePreview'));

const OptimizedTransactionCard: React.FC<TransactionCardProps> = memo(({
  transaction,
  isExpanded = false,
  swipeDirection = null,
  onDelete,
  onWaybill,
  renderAttachments
}) => {
  // Мемоизируем обработчики
  const handleDelete = useCallback(() => {
    onDelete();
  }, [onDelete]);

  const handleWaybill = useCallback(() => {
    onWaybill();
  }, [onWaybill]);

  // Мемоизируем проверку типа файла
  const isImageFile = useCallback((type: string) => {
    return type.startsWith('image/');
  }, []);

  // Мемоизируем цвета и стили
  const cardStyles = React.useMemo(() => {
    if (transaction.isSalary) return 'bg-emerald-50';
    if (transaction.isCashless) return 'bg-purple-50';
    return 'bg-white';
  }, [transaction.isSalary, transaction.isCashless]);

  const iconColor = React.useMemo(() => {
    if (transaction.isSalary) return 'text-emerald-600';
    if (transaction.isCashless) return 'text-purple-600';
    return transaction.type === 'income' ? 'text-emerald-500' : 'text-red-500';
  }, [transaction.isSalary, transaction.isCashless, transaction.type]);

  const amountColor = React.useMemo(() => {
    if (transaction.isSalary) return 'text-emerald-600';
    if (transaction.isCashless) return 'text-purple-600';
    return transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600';
  }, [transaction.isSalary, transaction.isCashless, transaction.type]);

  return (
    <div 
      data-transaction-id={transaction.id}
      className={`relative overflow-hidden rounded-lg ${cardStyles}`}
    >
      {/* Кнопка удаления (справа) */}
      <div
        className={`absolute inset-y-0 right-0 w-16 bg-red-500 flex items-center justify-center transition-opacity duration-200 ${
          isExpanded && swipeDirection === 'left' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={handleDelete}
          className="w-full h-full flex items-center justify-center"
          aria-label="Удалить транзакцию"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div
        className={`p-4 transition-transform duration-200 ${
          isExpanded && swipeDirection === 'left' ? '-translate-x-16' : 'translate-x-0'
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <div className="mt-1">
              {transaction.type === 'income' ? (
                <ArrowUpRight className={`w-5 h-5 ${iconColor}`} />
              ) : (
                <ArrowDownRight className={`w-5 h-5 ${iconColor}`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="font-medium text-gray-900">{transaction.fromUser}</div>
                
                {/* Рендерим файлы из waybillData */}
                {renderAttachments && renderAttachments()}
                
                {/* Отображение прикрепленных файлов с lazy loading */}
                {transaction.attachments && transaction.attachments.length > 0 && (
                  <div className="flex gap-1">
                    {transaction.attachments.slice(0, 3).map((attachment, index) => (
                      <div key={index} className="group relative">
                        {isImageFile(attachment.type) ? (
                          <Suspense fallback={
                            <div className="w-8 h-8 rounded border border-gray-200 animate-pulse bg-gray-100" />
                          }>
                            <LazyImagePreview
                              src={attachment.url}
                              alt={attachment.name}
                              className="w-8 h-8 rounded border border-gray-200"
                            />
                          </Suspense>
                        ) : (
                          <div className="w-8 h-8 rounded border border-gray-200 group-hover:border-blue-500 transition-colors flex items-center justify-center bg-gray-50">
                            <FileText className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="absolute top-full left-0 mt-1 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {attachment.name}
                        </div>
                      </div>
                    ))}
                    {transaction.attachments.length > 3 && (
                      <div className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center bg-gray-100 text-xs font-medium text-gray-500">
                        +{transaction.attachments.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-500">{transaction.toUser}</div>
              
              {transaction.waybillNumber && (
                <button
                  onClick={handleWaybill}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Накладная №{transaction.waybillNumber}
                </button>
              )}
              
              <div className="text-xs text-gray-400 mt-1">
                {formatTime(transaction.date)}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`font-medium ${amountColor}`}>
              {transaction.type === 'income' ? '+' : '-'} {formatAmount(transaction.amount)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {transaction.description}
            </div>
            <div className="flex gap-1 mt-1 justify-end">
              {transaction.isSalary && (
                <div className="text-xs text-emerald-600 font-medium px-1.5 py-0.5 bg-emerald-50 rounded">
                  ЗП
                </div>
              )}
              {transaction.isCashless && (
                <div className="text-xs text-purple-600 font-medium px-1.5 py-0.5 bg-purple-50 rounded">
                  Безнал
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

OptimizedTransactionCard.displayName = 'OptimizedTransactionCard';

export default OptimizedTransactionCard; 