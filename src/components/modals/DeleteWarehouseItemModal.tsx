import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteWarehouseItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteWithHistory: () => void;
  onDeleteIconOnly: () => void;
  itemName: string;
}

export const DeleteWarehouseItemModal: React.FC<DeleteWarehouseItemModalProps> = ({
  isOpen,
  onClose,
  onDeleteWithHistory,
  onDeleteIconOnly,
  itemName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Удаление категории</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            Вы собираетесь удалить категорию <span className="font-medium">{itemName}</span>.
            Выберите действие:
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onDeleteIconOnly}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-left"
          >
            Убрать только иконку
            <div className="text-sm text-gray-500 mt-1">
              Категория будет удалена, но история транзакций сохранится
            </div>
          </button>

          <button
            onClick={onDeleteWithHistory}
            className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-left"
          >
            Стереть все операции
            <div className="text-sm text-red-500 mt-1">
              Будут удалены все данные, включая историю транзакций
            </div>
          </button>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};