import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import { formatAmount } from '../../utils/formatUtils';
import { generatePDFFromElement } from '../../utils/documentUtils';
import { shareContent } from '../../utils/shareUtils';
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';

interface IncomeWaybillProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    documentNumber: string;
    date: string;
    supplier: string;
    note: string;
    items: Array<{
      product: {
        name: string;
        unit: string;
      };
      quantity: number;
      price: number;
    }>;
  };
}

export const IncomeWaybill: React.FC<IncomeWaybillProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targetElement = modalRef.current;
    
    if (isOpen && targetElement) {
      disableBodyScroll(targetElement, {
        reserveScrollBarGap: true,
      });
    }

    return () => {
      clearAllBodyScrollLocks();
    };
  }, [isOpen]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    
    if (modalRef.current) {
      enableBodyScroll(modalRef.current);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  const handleShare = async () => {
    const content = `
Приходная накладная №${data.documentNumber}
Дата: ${data.date}
Поставщик: ${data.supplier}

Товары:
${data.items.map(item => `- ${item.product.name}: ${item.quantity} ${item.product.unit}`).join('\n')}

Общая сумма: ${calculateTotal().toLocaleString()} ₸
    `;

    await shareContent('Приходная накладная', content);
  };

  const handleDownload = async () => {
    await generatePDFFromElement('waybill-content', `Накладная_${data.documentNumber}.pdf`);
  };

  const calculateTotal = () => {
    return data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        ref={modalRef}
        className="bg-white w-full max-w-4xl rounded-lg shadow-xl mx-4" 
        style={{ maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="sticky top-0 bg-white rounded-t-lg border-b border-gray-200 z-10">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-xl font-semibold">Приходная накладная №{data.documentNumber}</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                title="Поделиться"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                title="Скачать PDF"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={handleClose}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                title="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div id="waybill-content" className="p-6 overflow-auto space-y-6">
          {/* Шапка накладной */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Дата документа:</p>
              <p className="font-medium">{data.date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Номер документа:</p>
              <p className="font-medium">{data.documentNumber}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600">Поставщик:</p>
            <p className="font-medium">{data.supplier}</p>
          </div>

          {data.note && (
            <div>
              <p className="text-sm text-gray-600">Примечание:</p>
              <p className="font-medium">{data.note}</p>
            </div>
          )}

          {/* Таблица товаров */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    №
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Наименование
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ед.изм
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Кол-во
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Цена
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сумма
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {item.product.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatAmount(item.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatAmount(item.quantity * item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={5} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                    Итого:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    {formatAmount(calculateTotal())}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Подписи */}
          <div className="grid grid-cols-2 gap-8 pt-8">
            <div>
              <p className="text-sm text-gray-600 mb-8">Отпустил_________________</p>
              <p className="text-sm text-gray-600">Дата_________________</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-8">Получил_________________</p>
              <p className="text-sm text-gray-600">Дата_________________</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};