import React from 'react';
import { ArrowUpRight, ArrowDownRight, FileText, ImageIcon } from 'lucide-react';
import { formatTime } from '../../../utils/dateUtils';
import { formatAmount } from '../../../utils/formatUtils';

interface TransactionHistoryItemProps {
  transaction: {
    id: string;
    type: 'income' | 'expense';
    fromUser: string;
    toUser: string;
    amount: number;
    description: string;
    date: any;
    isSalary?: boolean;
    isCashless?: boolean;
    files?: Array<{
      name: string;
      url: string;
      type: string;
      size: number;
      path: string;
    }>;
    waybillData?: {
      files?: Array<{
        name: string;
        url: string;
        type: string;
        size: number;
        path: string;
      }>;
    };
  };
  swipedTransactionId: string | null;
  onDelete: () => void;
}

export const TransactionHistoryItem: React.FC<TransactionHistoryItemProps> = ({
  transaction,
  swipedTransactionId,
  onDelete
}) => {
  const isExpanded = false; // Add this variable if needed
  const amountColor = transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600';

  return (
    <div className={`relative overflow-hidden ${
      transaction.isSalary ? 'bg-emerald-50' :
      transaction.isCashless ? 'bg-purple-50' :
      'bg-white'
    }`}>
      <div
        className={`absolute inset-y-0 right-0 w-16 bg-red-500 flex items-center justify-center transition-opacity duration-200 ${
          swipedTransactionId === transaction.id ? 'opacity-100' : 'opacity-0'
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
        className={`p-4 bg-white rounded-lg shadow-sm ${isExpanded ? 'mb-2' : ''} transition-transform ${
          swipedTransactionId === transaction.id ? '-translate-x-16' : 'translate-x-0'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${amountColor}`}>
                {formatAmount(transaction.amount)} ₸
              </span>
              {transaction.waybillData?.files?.length > 0 && (
                <div className="flex items-center gap-1">
                  {transaction.waybillData.files.map((file, index) => (
                    <a
                      key={index}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative group"
                    >
                      {file.type.startsWith('image/') ? (
                        <>
                          <div className="w-8 h-8 rounded overflow-hidden border border-gray-200">
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Увеличенное превью при наведении */}
                          <div className="hidden group-hover:block absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
                            <div className="bg-white rounded-lg shadow-lg p-1">
                              <img
                                src={file.url}
                                alt={file.name}
                                className="max-w-[200px] max-h-[200px] rounded"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
                          <FileText className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className={`font-medium ${
              transaction.isSalary ? 'text-emerald-600' :
              transaction.isCashless ? 'text-purple-600' :
              transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {transaction.type === 'income' ? '+' : '-'} {formatAmount(transaction.amount)}
            </div>
            <div className="text-sm text-gray-500 mt-1 text-right">
              {transaction.description}
            </div>
            <div className="flex gap-1 mt-1">
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
              {transaction.files && transaction.files.length > 0 && (
                <div className="text-xs text-blue-600 font-medium px-1.5 py-0.5 bg-blue-50 rounded flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {transaction.files.length}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};