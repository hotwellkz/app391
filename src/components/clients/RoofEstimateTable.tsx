import React from 'react';
import { RoofEstimateItem } from '../../types/estimate';

interface RoofEstimateTableProps {
  items: RoofEstimateItem[];
  totalMaterialsCost: number;
  roofWorkCost: number;
  deliveryCost: number;
  totalCost: number;
  onUpdateItem: (index: number, field: keyof RoofEstimateItem, value: number) => void;
  onUpdateCosts: (field: 'roofWorkCost' | 'deliveryCost', value: number) => void;
  isEditing: boolean;
}

export const RoofEstimateTable: React.FC<RoofEstimateTableProps> = ({
  items,
  totalMaterialsCost,
  roofWorkCost,
  deliveryCost,
  totalCost,
  onUpdateItem,
  onUpdateCosts,
  isEditing
}) => {
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
              <td className="px-4 py-2">
                {item.name === 'Брус 40x140x6000' ? (
                  <div className="group relative">
                    <span>{item.name}</span>
                    <div className="invisible group-hover:visible absolute left-0 top-full mt-2 p-2 bg-gray-800 text-white text-sm rounded shadow-lg z-10 w-64">
                      (Для устройства стропильной системы крыши)
                    </div>
                  </div>
                ) : item.name === 'Паро. пленка (Под обрешетку) и (Для обшивки потолок 2эт.)' ? (
                  <div className="group relative">
                    <span>{item.name}</span>
                    <div className="invisible group-hover:visible absolute left-0 top-full mt-2 p-2 bg-gray-800 text-white text-sm rounded shadow-lg z-10 w-64">
                      (Паро-гидро изоляция.) (Рулон-60м3) Класс D
                    </div>
                  </div>
                ) : item.name === 'Гвозди 120' ? (
                  <div className="group relative">
                    <span>{item.name}</span>
                    <div className="invisible group-hover:visible absolute left-0 top-full mt-2 p-2 bg-gray-800 text-white text-sm rounded shadow-lg z-10 w-64">
                      (Для устройства стропильной системы)
                    </div>
                  </div>
                ) : item.name === 'Пена монтажная 70л' ? (
                  <div className="group relative">
                    <span>{item.name}</span>
                    <div className="invisible group-hover:visible absolute left-0 top-full mt-2 p-2 bg-gray-800 text-white text-sm rounded shadow-lg z-10 w-64">
                      (Утеплен потолок 2 эт. + утеплен. перим перекр.)
                    </div>
                  </div>
                ) : item.name === 'Шурупы 4 крупная резьба' ? (
                  <div className="group relative">
                    <span>{item.name}</span>
                    <div className="invisible group-hover:visible absolute left-0 top-full mt-2 p-2 bg-gray-800 text-white text-sm rounded shadow-lg z-10 w-64">
                      (Для монтажа фронтонов) 1 пач хват. на 7 осб
                    </div>
                  </div>
                ) : (
                  item.name
                )}
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
              <td className="px-4 py-2 text-center">
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => onUpdateItem(index, 'price', Number(e.target.value))}
                  className="w-24 px-2 py-1 text-right border rounded"
                  disabled={!isEditing}
                />
              </td>
              <td className="px-4 py-2 text-right">{item.total.toLocaleString()} ₸</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold">
            <td colSpan={4} className="px-4 py-2 text-right">Итого, стоимость материалов</td>
            <td className="px-4 py-2 text-right">{totalMaterialsCost.toLocaleString()} ₸</td>
          </tr>
          <tr>
            <td colSpan={4} className="px-4 py-2 text-right">Стоимость кровельных работ с утеплением потолка второго этажа</td>
            <td className="px-4 py-2">
              <input
                type="number"
                value={roofWorkCost}
                onChange={(e) => onUpdateCosts('roofWorkCost', Number(e.target.value))}
                className="w-full px-2 py-1 text-right border rounded"
                disabled={!isEditing}
              />
            </td>
          </tr>
          <tr>
            <td colSpan={4} className="px-4 py-2 text-right">Доставка Черепицы, бруса, пенопласта потолок</td>
            <td className="px-4 py-2">
              <input
                type="number"
                value={deliveryCost}
                onChange={(e) => onUpdateCosts('deliveryCost', Number(e.target.value))}
                className="w-full px-2 py-1 text-right border rounded"
                disabled={!isEditing}
              />
            </td>
          </tr>
          <tr className="bg-gray-200 font-bold">
            <td colSpan={4} className="px-4 py-2 text-right">Итого, стоимость материалов + стоимость кровельных работ</td>
            <td className="px-4 py-2 text-right">{totalCost.toLocaleString()} ₸</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};