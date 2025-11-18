import React from 'react';
import { X } from 'lucide-react';

interface WaybillModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    documentNumber: string;
    date: any;
    supplier: string;
    note: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      unit: string;
    }>;
  };
  type: 'income' | 'expense';
}

export const WaybillModal: React.FC<WaybillModalProps> = ({ isOpen, onClose, data, type }) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: { seconds: number; nanoseconds: number }) => {
    return new Date(timestamp.seconds * 1000).toLocaleDateString('ru-RU');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {type === 'income' ? 'Приходная' : 'Расходная'} накладная №{data.documentNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Дата</p>
              <p className="text-sm font-medium">{formatDate(data.date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Поставщик</p>
              <p className="text-sm font-medium">{data.supplier}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">Примечание</p>
            <p className="text-sm">{data.note}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Наименование</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Кол-во</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ед. изм.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Цена</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Сумма</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {Math.round(item.price).toLocaleString('ru-RU')} ₸
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {Math.round(item.price * item.quantity).toLocaleString('ru-RU')} ₸
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={4} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                    Итого:
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                    {Math.round(
                      data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
                    ).toLocaleString('ru-RU')} ₸
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
