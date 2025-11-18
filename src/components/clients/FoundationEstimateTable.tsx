import React, { useState } from 'react';
import { FoundationEstimateItem } from '../../types/estimate';
import { FoundationEstimateTooltip } from './estimate/FoundationEstimateTooltip';

interface FoundationEstimateTableProps {
  items: FoundationEstimateItem[];
  totalMaterialsCost: number;
  foundationWorkCost: number;
  totalCost: number;
  onUpdateItem: (index: number, field: keyof FoundationEstimateItem, value: number) => void;
  onUpdateWorkCost: (value: number) => void;
  isEditing: boolean;
}

export const FoundationEstimateTable: React.FC<FoundationEstimateTableProps> = ({
  items,
  totalMaterialsCost,
  foundationWorkCost,
  totalCost,
  onUpdateItem,
  onUpdateWorkCost,
  isEditing
}) => {
  const [showTooltip, setShowTooltip] = useState<number | null>(null);
  const [showPriceTooltip, setShowPriceTooltip] = useState<number | null>(null);
  const [showTotalMaterialsTooltip, setShowTotalMaterialsTooltip] = useState(false);
  const [showTotalCostTooltip, setShowTotalCostTooltip] = useState(false);

  const formatAmount = (amount: number): string => {
    return Math.round(amount).toLocaleString('ru-RU') + ' ₸';
  };

  const getTooltipContent = (item: FoundationEstimateItem): string => {
    switch (item.name) {
      case 'Бетон М250 Для Фундамента':
        return `Количество бетона для фундамента рассчитывается по формуле:
──────────────────────────────────
(0.09 × количество свай) + (0.18 × периметр фундамента) + 4.5 м³
──────────────────────────────────
Где:
- 0.09 м³ - объем бетона на одну сваю
- 0.18 м³ - объем бетона на 1 метр периметра
- 4.5 м³ - запас на непредвиденные расходы`;
      
      case 'Бетон М250 для стяжки':
        return `Количество бетона для стяжки рассчитывается по формуле:
──────────────────────────────────
(0.06 × площадь засыпки) + 3 м³
──────────────────────────────────
Где:
- 0.06 м³ - объем бетона на 1 м² площади
- 3 м³ - запас на непредвиденные расходы`;
      
      case 'Арматура 12 мм (Для армирования фундамента)':
        return `Количество арматуры рассчитывается по формуле:
──────────────────────────────────
(6 × количество свай) + (4 × периметр фундамента) + 60 м
──────────────────────────────────
Где:
- 6 м - арматура на одну сваю
- 4 м - арматура на 1 метр периметра
- 60 м - запас на непредвиденные расходы`;
      
      case 'Сетка 15x15 (Для теплого пола в стяжку)':
        return `Количество сетки рассчитывается по формуле:
──────────────────────────────────
(площадь засыпки × 1.3) ÷ 1.92
──────────────────────────────────
Где:
- 1.3 - коэффициент запаса (30%)
- 1.92 м² - площадь одной сетки (0.8 м × 2.4 м)`;
      
      case 'Проволока 6мм (Для хомутов при армировании арматуры)':
        return `Количество проволоки рассчитывается по формуле:
──────────────────────────────────
количество арматуры × 0.13
──────────────────────────────────
Где:
- 0.13 - коэффициент (13% от количества арматуры)`;
      
      case 'ПГС Howo (Для засыпки внутри фундамента) (15м3)':
        return `Количество ПГС рассчитывается по формуле:
──────────────────────────────────
площадь засыпки × 0.3
──────────────────────────────────
Где:
- 0.3 м³ - объем ПГС на 1 м² площади`;
      
      case 'Вязальная проволока 3мм (Для крепления опалубки)':
        return `Количество вязальной проволоки рассчитывается по формуле:
──────────────────────────────────
периметр фундамента × 0.087
──────────────────────────────────
Где:
- 0.087 кг - количество проволоки на 1 метр периметра`;
      
      case 'Вязальная проволока (Для связки арматуры и монтажа теплого пола)':
        return `Количество вязальной проволоки рассчитывается по формуле:
──────────────────────────────────
периметр фундамента × 0.15
──────────────────────────────────
Где:
- 0.15 кг - количество проволоки на 1 метр периметра`;
      
      case 'Гвозди 120':
        return `Количество гвоздей рассчитывается по формуле:
──────────────────────────────────
периметр фундамента × 0.5
──────────────────────────────────
Где:
- 0.5 кг - количество гвоздей на 1 метр периметра`;
      
      case 'Подложка под теплый пол Рулон 60м2':
        return `Количество подложки рассчитывается по формуле:
──────────────────────────────────
площадь засыпки ÷ 60
──────────────────────────────────
Где:
- 60 м² - площадь одного рулона`;
      
      case 'Теплый пол (для монтажа в стяжку) в 1 бухте 200м':
        return `Количество теплого пола рассчитывается по формуле:
──────────────────────────────────
площадь засыпки ÷ 5
──────────────────────────────────
Где:
- 5 м² - площадь обогрева на 1 метр трубы`;
      
      default:
        return '';
    }
  };

  const getPriceTooltipContent = (item: FoundationEstimateItem): string => {
    switch (item.name) {
      case 'Бетон М250 Для Фундамента':
        return `Цена бетона М250:
──────────────────────────────────
Цена берется из прайс-листа поставщика
Страница: /settings/prices
──────────────────────────────────
Текущая цена: ${formatAmount(item.price)} за м³`;
      
      case 'Бетон М250 для стяжки':
        return `Цена бетона М250:
──────────────────────────────────
Цена берется из прайс-листа поставщика
Страница: /settings/prices
──────────────────────────────────
Текущая цена: ${formatAmount(item.price)} за м³`;
      
      case 'Арматура 12 мм (Для армирования фундамента)':
        return `Цена арматуры 12 мм:
──────────────────────────────────
Цена берется из прайс-листа поставщика
Страница: /settings/prices
──────────────────────────────────
Текущая цена: ${formatAmount(item.price)} за м/п`;
      
      case 'Сетка 15x15 (Для теплого пола в стяжку)':
        return `Цена сетки 15x15:
──────────────────────────────────
Цена берется из прайс-листа поставщика
Страница: /settings/prices
──────────────────────────────────
Текущая цена: ${formatAmount(item.price)} за шт`;
      
      case 'Проволока 6мм (Для хомутов при армировании арматуры)':
        return `Цена проволоки 6мм:
──────────────────────────────────
Цена берется из прайс-листа поставщика
Страница: /settings/prices
──────────────────────────────────
Текущая цена: ${formatAmount(item.price)} за м`;
      
      case 'ПГС Howo (Для засыпки внутри фундамента) (15м3)':
        return `Цена ПГС Howo:
──────────────────────────────────
Цена берется из прайс-листа поставщика
Страница: /settings/prices
──────────────────────────────────
Текущая цена: ${formatAmount(item.price)} за машину (15м³)`;
      
      case 'Вязальная проволока 3мм (Для крепления опалубки)':
        return `Цена вязальной проволоки 3мм:
──────────────────────────────────
Цена берется из прайс-листа поставщика
Страница: /settings/prices
──────────────────────────────────
Текущая цена: ${formatAmount(item.price)} за кг`;
      
      case 'Вязальная проволока (Для связки арматуры и монтажа теплого пола)':
        return `Цена вязальной проволоки:
──────────────────────────────────
Цена берется из прайс-листа поставщика
Страница: /settings/prices
──────────────────────────────────
Текущая цена: ${formatAmount(item.price)} за кг`;
      
      case 'Гвозди 120':
        return `Цена гвоздей 120:
──────────────────────────────────
Цена берется из прайс-листа поставщика
Страница: /settings/prices
──────────────────────────────────
Текущая цена: ${formatAmount(item.price)} за кг`;
      
      case 'Подложка под теплый пол Рулон 60м2':
        return `Цена подложки под теплый пол:
──────────────────────────────────
Цена берется из прайс-листа поставщика
Страница: /settings/prices
──────────────────────────────────
Текущая цена: ${formatAmount(item.price)} за рулон (60м²)`;
      
      case 'Теплый пол (для монтажа в стяжку) в 1 бухте 200м':
        return `Цена теплого пола:
──────────────────────────────────
Цена берется из прайс-листа поставщика
Страница: /settings/prices
──────────────────────────────────
Текущая цена: ${formatAmount(item.price)} за бухту (200м)`;
      
      case 'Канализация, водопровод (Все материалы) См. доп смету':
        return `Цена материалов для канализации и водопровода:
──────────────────────────────────
Цена берется из дополнительной сметы
Страница: /clients/[clientId]/additional-works
──────────────────────────────────
Текущая цена: ${formatAmount(item.price)} за комплект`;
      
      default:
        return '';
    }
  };

  const getTotalMaterialsTooltipContent = () => {
    const materialsList = items.map(item => 
      `${item.name}: ${formatAmount(item.total)}`
    ).join('\n');

    return `Итого, стоимость материалов - сумма всех материалов:
──────────────────────────────────
${materialsList}
──────────────────────────────────
Общая сумма: ${formatAmount(totalMaterialsCost)}`;
  };

  const getTotalCostTooltipContent = () => {
    return `Итого, стоимость материалов + стоимость работ + доставка:
──────────────────────────────────
Стоимость материалов: ${formatAmount(totalMaterialsCost)}
Стоимость работ:     ${formatAmount(foundationWorkCost)}
──────────────────────────────────
Общая сумма:         ${formatAmount(totalCost)}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left">Наименование</th>
            <th className="px-4 py-2 text-center">Ед.изм</th>
            <th className="px-4 py-2 text-center">Кол-во</th>
            <th className="px-4 py-2 text-center">Цена ₸</th>
            <th className="px-4 py-2 text-center">Сумма ₸</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2 relative">
                <div
                  className="cursor-help"
                  onMouseEnter={() => setShowTooltip(index)}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  {item.name}
                </div>
                <FoundationEstimateTooltip
                  show={showTooltip === index}
                  content={getTooltipContent(item)}
                />
              </td>
              <td className="px-4 py-2 text-center">{item.unit}</td>
              <td className="px-4 py-2 text-center">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => onUpdateItem(index, 'quantity', Number(e.target.value))}
                  className="w-24 px-2 py-1 text-right border rounded"
                  disabled={!isEditing}
                  step="0.1"
                />
              </td>
              <td className="px-4 py-2 text-center relative">
                <div
                  className="cursor-help"
                  onMouseEnter={() => setShowPriceTooltip(index)}
                  onMouseLeave={() => setShowPriceTooltip(null)}
                >
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => onUpdateItem(index, 'price', Number(e.target.value))}
                    className="w-24 px-2 py-1 text-right border rounded"
                    disabled={!isEditing}
                  />
                </div>
                <FoundationEstimateTooltip
                  show={showPriceTooltip === index}
                  content={getPriceTooltipContent(item)}
                />
              </td>
              <td className="px-4 py-2 text-right">{formatAmount(item.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold">
            <td colSpan={4} className="px-4 py-2 text-right relative">
              <div
                className="cursor-help"
                onMouseEnter={() => setShowTotalMaterialsTooltip(true)}
                onMouseLeave={() => setShowTotalMaterialsTooltip(false)}
              >
                Итого, стоимость материалов
              </div>
              <FoundationEstimateTooltip
                show={showTotalMaterialsTooltip}
                content={getTotalMaterialsTooltipContent()}
                position="top"
              />
            </td>
            <td className="px-4 py-2 text-right">{formatAmount(totalMaterialsCost)}</td>
          </tr>
          <tr>
            <td colSpan={4} className="px-4 py-2 text-right">Доставка + аренда опалубки + Амортизация</td>
            <td className="px-4 py-2 text-right">
              {isEditing ? (
                <input
                  type="number"
                  value={foundationWorkCost}
                  onChange={(e) => onUpdateWorkCost(Number(e.target.value))}
                  className="w-24 px-2 py-1 text-right border rounded"
                />
              ) : (
                formatAmount(foundationWorkCost)
              )}
            </td>
          </tr>
          <tr className="bg-gray-200 font-bold">
            <td colSpan={4} className="px-4 py-2 text-right relative">
              <div
                className="cursor-help"
                onMouseEnter={() => setShowTotalCostTooltip(true)}
                onMouseLeave={() => setShowTotalCostTooltip(false)}
              >
                Итого, стоим. материалов + стоим. работ по фунд. + дост.
              </div>
              <FoundationEstimateTooltip
                show={showTotalCostTooltip}
                content={getTotalCostTooltipContent()}
                position="top"
              />
            </td>
            <td className="px-4 py-2 text-right">{formatAmount(totalCost)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};