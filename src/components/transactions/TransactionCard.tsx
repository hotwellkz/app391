import React from 'react';
import { ArrowUpRight, ArrowDownRight, Image as ImageIcon, FileText, Pencil } from 'lucide-react';
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

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  isExpanded = false,
  swipeDirection = null,
  onDelete,
  onWaybill,
  renderAttachments
}) => {
  // Функция для определения, является ли файл изображением
  const isImageFile = (type: string) => {
    return type.startsWith('image/');
  };

  return (
    <div 
      data-transaction-id={transaction.id}
      className={`relative overflow-hidden rounded-lg ${
        transaction.isSalary ? 'bg-emerald-50' :
        transaction.isCashless ? 'bg-purple-50' :
        'bg-white'
      }`}
    >
      {/* Кнопка удаления (справа) */}
      <div
        className={`absolute inset-y-0 right-0 w-16 bg-red-500 flex items-center justify-center transition-opacity duration-200 ${
          isExpanded && swipeDirection === 'left' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={onDelete}
          className="w-full h-full flex items-center justify-center"
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
                <ArrowUpRight className={`w-5 h-5 ${
                  transaction.isSalary ? 'text-emerald-600' :
                  transaction.isCashless ? 'text-purple-600' :
                  'text-emerald-500'
                }`} />
              ) : (
                <ArrowDownRight className={`w-5 h-5 ${
                  transaction.isSalary ? 'text-emerald-600' :
                  transaction.isCashless ? 'text-purple-600' :
                  'text-red-500'
                }`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="font-medium text-gray-900">{transaction.fromUser}</div>
                {/* Рендерим файлы из waybillData */}
                {renderAttachments && renderAttachments()}
                {/* Отображение прикрепленных файлов */}
                {transaction.attachments && transaction.attachments.length > 0 && (
                  <div className="flex gap-1">
                    {transaction.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative"
                      >
                        {isImageFile(attachment.type) ? (
                          <>
                            <div className="relative w-8 h-8 rounded overflow-hidden border border-gray-200 group-hover:border-blue-500 transition-colors">
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {/* Увеличенное превью при наведении */}
                            <div className="hidden group-hover:block fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                              <div className="bg-white rounded-lg shadow-2xl p-2">
                                <img
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded"
                                />
                              </div>
                              <div className="fixed inset-0 -z-10 bg-black/50 backdrop-blur-sm"></div>
                            </div>
                          </>
                        ) : (
                          <div className="w-8 h-8 rounded border border-gray-200 group-hover:border-blue-500 transition-colors flex items-center justify-center bg-gray-50">
                            <FileText className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-full left-0 mt-1 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {attachment.name}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-500">{transaction.toUser}</div>
              {transaction.waybillNumber && (
                <button
                  onClick={onWaybill}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
            <div className={`font-medium ${
              transaction.isSalary ? 'text-emerald-600' :
              transaction.isCashless ? 'text-purple-600' :
              transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
            }`}>
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
};
