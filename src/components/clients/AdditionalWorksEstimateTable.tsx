import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AdditionalWorksEstimateItem } from '../../types/estimate';

interface AdditionalWorksEstimateTableProps {
  items: AdditionalWorksEstimateItem[];
  totalCost: number;
  grandTotal: number;
  onUpdateItem: (index: number, field: keyof AdditionalWorksEstimateItem | 'name', value: number | string) => void;
  isEditing: boolean;
}

export const AdditionalWorksEstimateTable: React.FC<AdditionalWorksEstimateTableProps> = ({
  items,
  totalCost,
  grandTotal,
  onUpdateItem,
  isEditing
}) => {
  const [showExtraRows, setShowExtraRows] = useState(false);

  const mainRows = items.slice(0, 3);
  const extraRows = items.slice(3);

  const formatAmount = (amount: number) => {
    return `${Math.round(amount).toLocaleString('ru-RU')} тг`;
  };

  const parseAmount = (value: string): number => {
    return Number(value.replace(/\s/g, '').replace('тг', ''));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left w-[85%]">Наименование</th>
            <th className="px-4 py-2 text-center w-[15%]">Сумма</th>
          </tr>
        </thead>
        <tbody>
          {/* Main rows */}
          {mainRows.map((item, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => onUpdateItem(index, 'name', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                    placeholder="Введите наименование"
                  />
                ) : (
                  item.name
                )}
              </td>
              <td className="px-4 py-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={formatAmount(item.total)}
                    onChange={(e) => {
                      const value = parseAmount(e.target.value);
                      if (!isNaN(value)) {
                        onUpdateItem(index, 'total', value);
                      }
                    }}
                    className="w-full px-2 py-1 text-right border rounded"
                  />
                ) : (
                  <div className="text-right">{formatAmount(item.total)}</div>
                )}
              </td>
            </tr>
          ))}

          {/* Toggle button for extra rows */}
          <tr className="border-t">
            <td colSpan={2} className="px-4 py-2">
              <button
                type="button"
                onClick={() => setShowExtraRows(!showExtraRows)}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                {showExtraRows ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Скрыть дополнительные строки
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Показать дополнительные строки
                  </>
                )}
              </button>
            </td>
          </tr>

          {/* Extra rows */}
          {showExtraRows && extraRows.map((item, index) => (
            <tr key={index + 3} className="border-t">
              <td className="px-4 py-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => onUpdateItem(index + 3, 'name', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                    placeholder="Введите наименование"
                  />
                ) : (
                  item.name || '(Пусто)'
                )}
              </td>
              <td className="px-4 py-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={formatAmount(item.total)}
                    onChange={(e) => {
                      const value = parseAmount(e.target.value);
                      if (!isNaN(value)) {
                        onUpdateItem(index + 3, 'total', value);
                      }
                    }}
                    className="w-full px-2 py-1 text-right border rounded"
                  />
                ) : (
                  <div className="text-right">{formatAmount(item.total)}</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-200 font-bold">
            <td className="px-4 py-2 text-right">Итого, стоимость дополнительных работ</td>
            <td className="px-4 py-2 text-right">{formatAmount(totalCost)}</td>
          </tr>
          <tr className="bg-blue-100 font-bold">
            <td className="px-4 py-2 text-right text-blue-800">ИТОГО ОБЩАЯ:</td>
            <td className="px-4 py-2 text-right text-blue-800">{formatAmount(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};