import React, { useRef, useEffect } from 'react';

interface TransferFormProps {
  amount: number;
  description: string;
  isSalary: boolean;
  isCashless: boolean;
  showEmployeeOptions?: boolean;
  onAmountChange: (amount: number) => void;
  onDescriptionChange: (description: string) => void;
  onSalaryChange: (isSalary: boolean) => void;
  onCashlessChange: (isCashless: boolean) => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  amount,
  description,
  isSalary,
  isCashless,
  showEmployeeOptions = true,
  onAmountChange,
  onDescriptionChange,
  onSalaryChange,
  onCashlessChange,
}) => {
  const amountRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('ru-RU').format(value);
  };

  const parseFormattedNumber = (value: string): number => {
    return Number(value.replace(/[^\d.-]/g, ''));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d.-]/g, '');
    const numValue = parseFloat(rawValue);
    if (!isNaN(numValue)) {
      onAmountChange(numValue);
    }
  };

  const scrollToField = (element: HTMLElement) => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      setTimeout(() => {
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const middle = absoluteElementTop - (window.innerHeight / 2);
        window.scrollTo({
          top: middle,
          behavior: 'smooth'
        });
      }, 100);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Сумма
        </label>
        <input
          ref={amountRef}
          type="text"
          value={formatNumber(amount)}
          onChange={handleAmountChange}
          onFocus={() => amountRef.current && scrollToField(amountRef.current)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="0"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Описание
        </label>
        <textarea
          ref={descriptionRef}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onFocus={() => descriptionRef.current && scrollToField(descriptionRef.current)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Введите описание транзакции"
          rows={3}
        />
      </div>

      {showEmployeeOptions && (
        <div className="flex items-center gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isSalary}
              onChange={(e) => onSalaryChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">ЗП</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isCashless}
              onChange={(e) => onCashlessChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Безнал</span>
          </label>
        </div>
      )}
    </div>
  );
};