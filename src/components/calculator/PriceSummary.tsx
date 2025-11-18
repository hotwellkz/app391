import React from 'react';
import { CalculationResult } from '../../types/calculator';

interface PriceSummaryProps {
  result: CalculationResult;
  area: number;
  options?: {
    isVatIncluded?: boolean;
    isInstallment?: boolean;
    installmentAmount?: number;
    hideFundamentCost?: boolean;
    hideKitCost?: boolean;
    hideAssemblyCost?: boolean;
    hideDeliveryCost?: boolean;
  };
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ru-RU').format(price);
};

export const PriceSummary: React.FC<PriceSummaryProps> = ({ result, area, options = {} }) => {
  const { fundamentCost, kitCost, assemblyCost, total, pricePerSqm, deliveryCost } = result;
  const { 
    hideFundamentCost = false, 
    hideKitCost = false, 
    hideAssemblyCost = false,
    hideDeliveryCost = false
  } = options;

  if (total === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Расчет стоимости
        </h3>
        <p className="text-sm sm:text-base text-gray-500">
          Введите площадь дома от 10 до 1500 м² для расчета стоимости
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 sm:p-6 border border-emerald-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Расчет стоимости
      </h3>
      
      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-gray-600">Площадь дома:</span>
          <span className="text-sm sm:text-base font-medium">{area} м²</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-gray-600">Цена за м²:</span>
          <span className="text-sm sm:text-base font-medium">{formatPrice(pricePerSqm)} ₸</span>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
        {!hideFundamentCost && (
          <div className="flex justify-between items-center py-2 border-b border-emerald-200">
            <span className="text-xs sm:text-sm text-gray-700">
              {/* Мобильная версия */}
              <span className="block sm:hidden">🏗️ Фундамент</span>
              {/* Десктопная версия */}
              <span className="hidden sm:block">🏗️ Фундамент (14%)</span>
            </span>
            <span className="text-sm sm:text-base font-medium">{formatPrice(fundamentCost)} ₸</span>
          </div>
        )}
        {!hideKitCost && (
          <div className="flex justify-between items-center py-2 border-b border-emerald-200">
            <span className="text-xs sm:text-sm text-gray-700">
              {/* Мобильная версия */}
              <span className="block sm:hidden">🏠 Домокомпл.</span>
              {/* Десктопная версия */}
              <span className="hidden sm:block">🏠 Домокомпл. (71%)</span>
            </span>
            <span className="text-sm sm:text-base font-medium">{formatPrice(kitCost)} ₸</span>
          </div>
        )}
        {!hideAssemblyCost && (
          <div className="flex justify-between items-center py-2 border-b border-emerald-200">
            <span className="text-xs sm:text-sm text-gray-700">
              {/* Мобильная версия */}
              <span className="block sm:hidden">⚒️ Сборка</span>
              {/* Десктопная версия */}
              <span className="hidden sm:block">⚒️ Сборка (15%)</span>
            </span>
            <span className="text-sm sm:text-base font-medium">{formatPrice(assemblyCost)} ₸</span>
          </div>
        )}
        {!hideDeliveryCost && deliveryCost && deliveryCost > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-emerald-200">
            <span className="text-xs sm:text-sm text-gray-700">
              {/* Мобильная версия */}
              <span className="block sm:hidden">🚚 Доставка</span>
              {/* Десктопная версия */}
              <span className="hidden sm:block">🚚 Доставка</span>
            </span>
            <span className="text-sm sm:text-base font-medium">{formatPrice(deliveryCost)} ₸</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg p-3 sm:p-4 border border-emerald-300">
        <div className="flex justify-between items-center">
          <span className="text-base sm:text-lg font-semibold text-gray-900">Итого:</span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-600">
            {formatPrice(total)} ₸
          </span>
        </div>
      </div>
    </div>
  );
}; 