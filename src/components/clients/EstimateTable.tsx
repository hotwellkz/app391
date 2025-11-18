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
  return (
    <div>
      <div className="bg-gray-600 text-white text-center py-2">
        {title}
      </div>
      <div className="border">
        {rows.map((row, index) => (
          <div
            key={index}
            className={`text-xs sm:text-base
              flex justify-between items-center px-2 py-1 border-b last:border-b-0
              ${row.isHeader ? 'bg-gray-600 text-white' : row.isChecked ? 'bg-green-100' : 'bg-gray-100'}
            `}
          >
            <span className="text-xs sm:text-sm">{row.label}</span>
            {!row.isHeader && (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  className={`
                    w-14 sm:w-16 px-1 sm:px-2 py-0.5 sm:py-1 border rounded text-right text-xs sm:text-sm
                    ${row.isRed ? 'text-red-600' : ''}
                  `}
                  value={row.value}
                  onChange={(e) => row.onChange?.(Number(e.target.value))}
                  disabled={!isEditing}
                  step="0.1"
                />
                {row.unit && <span className="ml-1">{row.unit}</span>}
                <input
                  type="checkbox"
                  checked={row.isChecked}
                  onChange={(e) => row.onCheckChange?.(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
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