import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Trash2, Image, FileText } from 'lucide-react';
import { Transaction } from '../../types/transaction';
import { formatAmount } from '../../utils/formatUtils';
import { formatTime } from '../../utils/dateUtils';
import { useSwipeable } from 'react-swipeable';
import { deleteTransaction } from '../../lib/firebase/transactions';
import { showErrorNotification } from '../../utils/notifications';
import { PasswordPrompt } from '../PasswordPrompt';
import { ExpenseWaybill } from '../warehouse/ExpenseWaybill'; 

interface TransactionItemProps {
  transaction: Transaction;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showWaybill, setShowWaybill] = useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => setIsDeleting(true),
    onSwipedRight: () => setIsDeleting(false),
    trackMouse: true,
    preventDefaultTouchmoveEvent: true,
    delta: 10
  });

  const handleDeleteClick = () => {
    if (window.confirm('Вы уверены, что хотите удалить эту операцию?')) {
      setShowPasswordPrompt(true);
    } else {
      setIsDeleting(false);
    }
  };

  const handleDelete = async (isAuthenticated: boolean) => {
    if (!isAuthenticated) {
      setIsDeleting(false);
      return;
    }

    if (!transaction.id) {
      showErrorNotification('Невозможно удалить транзакцию: отсутствует ID');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      await deleteTransaction(transaction.id);
      showSuccessNotification('Операция успешно удалена');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showErrorNotification('Ошибка при удалении операции');
    } finally {
      setIsLoading(false);
      setIsDeleting(false);
    }
  };

  // Определяем цвет фона для безналичных платежей
  const getBackgroundColor = () => {
    if (transaction.isCashless) {
      return 'bg-purple-50'; // Фиолетовый фон для безналичных платежей
    }
    if (transaction.isSalary) {
      return 'bg-emerald-50'; // Зеленый фон для зарплаты
    }
    return 'bg-white'; // Обычный белый фон для остальных транзакций
  };

  return (
    <div className="relative overflow-hidden">
      <div 
        className={`absolute inset-y-0 right-0 w-20 bg-red-500 flex items-center justify-center transition-opacity duration-200 ${
          isDeleting ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={handleDeleteClick}
          disabled={isLoading}
          className="w-full h-full flex items-center justify-center"
        >
          <Trash2 className={`w-5 h-5 text-white ${isLoading ? 'opacity-50' : ''}`} />
        </button>
      </div>

      <div
        {...handlers}
        className={`relative transform transition-transform duration-200 ease-out ${getBackgroundColor()} ${
          isDeleting ? '-translate-x-20' : 'translate-x-0'
        }`}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-3">
              {transaction.type === 'income' ? (
                <ArrowUpRight className="w-5 h-5 text-emerald-500 mt-1" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-red-500 mt-1" />
              )}
              <div>
                <div className="font-medium">{transaction.fromUser}</div>
                <div className="text-sm text-gray-600">{transaction.toUser}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatTime(transaction.date)}
                  {transaction.waybillNumber && (
                    <div className="mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowWaybill(true);
                        }}
                        className="inline-flex items-center text-blue-500 hover:text-blue-700 hover:underline"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        <span className="text-xs">Накладная №{transaction.waybillNumber}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className={`font-medium ${
                transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {transaction.type === 'income' ? '+' : '-'} {formatAmount(transaction.amount)}
              </div>
              {transaction.photos && transaction.photos.length > 0 && (
                <button
                  onClick={() => setShowPhotos(!showPhotos)}
                  className="flex items-center text-gray-500 hover:text-gray-700 mt-1"
                >
                  <Image className="w-4 h-4 mr-1" />
                  <span className="text-xs">{transaction.photos.length} фото</span>
                </button>
              )}
              <div className="text-sm text-gray-500 mt-1">
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
              </div>
            </div>
          </div>
          {showPhotos && transaction.photos && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {transaction.photos.map((photo, index) => (
                <a
                  key={index}
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-32 object-cover rounded-lg hover:opacity-75 transition-opacity"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPasswordPrompt && (
        <PasswordPrompt
          isOpen={showPasswordPrompt}
          onClose={() => {
            setShowPasswordPrompt(false);
            setIsDeleting(false);
          }}
          onSuccess={() => {
            setShowPasswordPrompt(false);
            handleDelete(true);
          }}
        />
      )}
      
      {showWaybill && transaction.waybillData && (
        <ExpenseWaybill
          isOpen={showWaybill}
          onClose={() => {
            setShowWaybill(false);
            setIsDeleting(false);
          }}
          data={transaction.waybillData}
        />
      )}
    </div>
  );
};