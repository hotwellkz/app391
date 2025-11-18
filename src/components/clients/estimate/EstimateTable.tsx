import React from 'react';

interface EstimateRow {
  label: string;
  value: number | string;
  unit?: string;
  isHeader?: boolean;
  isRed?: boolean;
  isChecked?: boolean;
  onChange?: (value: number) => void;
  onCheckChange?: (checked: boolean) => void;
}

interface EstimateTableProps {
  title: string;
  rows: EstimateRow[];
  isEditing: boolean;
}

export const EstimateTable: React.FC<EstimateTableProps> = ({
  title,
  rows,
  isEditing
}) => {
  const getInputWidth = (label: string) => {
    if (label === 'ЗП строителям' || label === 'Цена по договору' || label === 'Операционный расход') {
      return 'w-40'; // Увеличенная ширина для больших чисел
    }
    return 'w-16'; // Стандартная ширина для остальных полей
  };

  const formatValue = (value: number | string, label: string): string => {
    if (label === 'ЗП строителям' || label === 'Цена по договору' || label === 'Операционный расход') {
      return typeof value === 'number' ? value.toLocaleString('ru-RU') : value.toString();
    }
    return value.toString();
  };

  const parseValue = (value: string): number => {
    return Number(value.replace(/\s/g, ''));
  };

  return (
    <div>
      <div className="bg-gray-600 text-white text-center py-1 sm:py-2 text-[10px] sm:text-base">
        {title}
      </div>
      <div className="border">
        {rows.map((row, index) => (
          <div
            key={index}
            className={`text-[10px] sm:text-base
              flex justify-between items-center px-2 py-1 border-b last:border-b-0
              ${row.isHeader ? 'bg-gray-600 text-white' : row.isChecked ? 'bg-green-100' : 'bg-gray-100'}
            `}
          >
            <span className="text-[10px] sm:text-sm">{row.label}</span>
            {!row.isHeader && (
              <div className="flex items-center space-x-2">
                {row.label === 'ЗП строителям' || row.label === 'Цена по договору' ? (
                  <input
                    type="text"
                    className={`
                      ${getInputWidth(row.label)} px-2 py-1 border rounded text-right
                      ${row.isRed ? 'text-red-600' : ''}
                    `}
                    value={formatValue(row.value, row.label)}
                    onChange={(e) => {
                      const value = parseValue(e.target.value);
                      if (!isNaN(value)) {
                        row.onChange?.(value);
                      }
                    }}
                    disabled={!isEditing}
                  />
                ) : (
                  <input
                    type="number"
                    className={`
                      w-12 sm:w-16 px-1 sm:px-2 py-0.5 sm:py-1 border rounded text-right text-[10px] sm:text-sm
                      ${row.isRed ? 'text-red-600' : ''}
                    `}
                    value={row.value}
                    onChange={(e) => row.onChange?.(Number(e.target.value))}
                    disabled={!isEditing}
                    step="0.1"
                  />
                )}
                {row.unit && <span className="ml-1 text-[10px] sm:text-sm">{row.unit}</span>}
                <input
                  type="checkbox"
                  checked={row.isChecked}
                  onChange={(e) => row.onCheckChange?.(e.target.checked)}
                  className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  disabled={!isEditing}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};