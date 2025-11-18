import React from 'react';
import { SipWallsEstimateItem } from '../../types/estimate';

interface SipWallsEstimateTableProps {
  items: SipWallsEstimateItem[];
  totalMaterialsCost: number;
  installationCost: number;
  deliveryCost: number;
  totalCost: number;
  onUpdateItem: (index: number, field: keyof SipWallsEstimateItem, value: number) => void;
  onUpdateCosts: (field: 'installationCost' | 'deliveryCost', value: number) => void;
  isEditing: boolean;
}

export const SipWallsEstimateTable: React.FC<SipWallsEstimateTableProps> = ({
  items,
  totalMaterialsCost,
  installationCost,
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
                {item.name === 'Шурупы 4 крупная резьба' ? (
                  <div className="group relative">
                    <span>{item.name}</span>
                    <div className="invisible group-hover:visible absolute left-0 top-full mt-2 p-2 bg-gray-800 text-white text-sm rounded shadow-lg z-10 w-64">
                      (Для монтажа СИП пан) 1 пач хват. на 2,5 СИП
                    </div>
                  </div>
                ) : item.name === 'Шурупы 10 крупная резьба' ? (
                  <div className="group relative">
                    <span>{item.name}</span>
                    <div className="invisible group-hover:visible absolute left-0 top-full mt-2 p-2 bg-gray-800 text-white text-sm rounded shadow-lg z-10 w-64">
                      (Для соединения углов дома)
                    </div>
                  </div>
                ) : item.name === 'Пена монтажная 70л' ? (
                  <div className="group relative">
                    <span>{item.name}</span>
                    <div className="invisible group-hover:visible absolute left-0 top-full mt-2 p-2 bg-gray-800 text-white text-sm rounded shadow-lg z-10 w-64">
                      (Для монтажа СИП) 1 пены хватает на 3 панели
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
            <td colSpan={4} className="px-4 py-2 text-right">Стоимость работы по монтажу СИП стен</td>
            <td className="px-4 py-2">
              <input
                type="number"
                value={installationCost}
                onChange={(e) => onUpdateCosts('installationCost', Number(e.target.value))}
                className="w-full px-2 py-1 text-right border rounded"
                disabled={!isEditing}
              />
            </td>
          </tr>
          <tr>
            <td colSpan={4} className="px-4 py-2 text-right">Доставка материала</td>
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
            <td colSpan={4} className="px-4 py-2 text-right">Итого, стоимость материалов + стоимость работ по монтажу SIP стен + доставка</td>
            <td className="px-4 py-2 text-right">{totalCost.toLocaleString()} ₸</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};