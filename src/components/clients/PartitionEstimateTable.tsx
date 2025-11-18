import React from 'react';
import { PartitionEstimateItem } from '../../types/estimate';

interface PartitionEstimateTableProps {
  items: PartitionEstimateItem[];
  totalMaterialsCost: number;
  installationCost: number;
  deliveryCost: number;
  totalCost: number;
  onUpdateItem: (index: number, field: keyof PartitionEstimateItem, value: number) => void;
  onUpdateCosts: (field: 'installationCost' | 'deliveryCost', value: number) => void;
  isEditing: boolean;
}

export const PartitionEstimateTable: React.FC<PartitionEstimateTableProps> = ({
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
              <td className="px-4 py-2">{item.name}</td>
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
            <td colSpan={4} className="px-4 py-2 text-right">Стоимость работ по монтажу перегородок из гипсокартона</td>
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
            <td colSpan={4} className="px-4 py-2 text-right">Доставка перегородок</td>
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
            <td colSpan={4} className="px-4 py-2 text-right">Итого, стоимость материалов + стоимость работ по монтажу перегородок</td>
            <td className="px-4 py-2 text-right">{totalCost.toLocaleString()} ₸</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};