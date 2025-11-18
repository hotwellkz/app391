import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FoundationEstimateTable } from './FoundationEstimateTable';
import { FoundationEstimateData } from '../../types/estimate';
import { useFoundationCalculations } from '../../hooks/useFoundationCalculations';
import { useFoundationPriceSync } from '../../hooks/useFoundationPriceSync';

interface FoundationEstimateProps {
  isEditing: boolean;
  clientId: string;
}

export const FoundationEstimate: React.FC<FoundationEstimateProps> = ({
  isEditing,
  clientId
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [estimateData, setEstimateData] = useState<FoundationEstimateData>({
    items: [
      { name: 'Бетон М250 Для Фундамента', unit: 'м3', quantity: 0, price: 25000, total: 0 },
      { name: 'Бетон М250 для стяжки', unit: 'м3', quantity: 0, price: 25000, total: 0 },
      { name: 'Арматура 12 мм (Для армирования фундамента)', unit: 'м/п', quantity: 0, price: 240, total: 0 },
      { name: 'Сетка 15x15 (Для теплого пола в стяжку) размер 80см на 2,4м = 1,92м2 1шт', unit: 'шт', quantity: 0, price: 550, total: 0 },
      { name: 'Труба квадратная 80x80 2,5 мм (Для стойки балкона, навеса, или террасы)', unit: 'метр', quantity: 0, price: 2500, total: 0 },
      { name: 'Проволока 6мм (Для хомутов при армировании арматуры)', unit: 'метр', quantity: 0, price: 120, total: 0 },
      { name: 'ПГС Howo (Для засыпки внутри фундамента) (15м3)', unit: 'маш', quantity: 0, price: 50000, total: 0 },
      { name: 'Вязальная проволока 3мм (Для крепления опалубки)', unit: 'кг', quantity: 0, price: 800, total: 0 },
      { name: 'Вязальная проволока (Для связки арматуры и монтажа теплого пола)', unit: 'кг', quantity: 0, price: 800, total: 0 },
      { name: 'Гвозди 120', unit: 'кг', quantity: 0, price: 700, total: 0 },
      { name: 'Подложка под теплый пол Рулон 60м2', unit: 'рулон', quantity: 0, price: 6000, total: 0 },
      { name: 'Теплый пол (для монтажа в стяжку) в 1 бухте 200м', unit: 'бухта', quantity: 0, price: 27000, total: 0 },
      { name: 'Канализация, водопровод (Все материалы) См. доп смету', unit: '', quantity: 1, price: 80000, total: 80000 }
    ],
    totalMaterialsCost: 80000,
    foundationWorkCost: 245000,
    totalCost: 325000
  });

  const calculations = useFoundationCalculations(clientId);
  
  // Сначала синхронизируем цены
  useFoundationPriceSync(setEstimateData);

  // Потом загружаем данные сметы
  useEffect(() => {
    const loadEstimateData = async () => {
      try {
        const estimateRef = doc(db, 'foundationEstimates', clientId);
        const estimateDoc = await getDoc(estimateRef);
        
        if (estimateDoc.exists()) {
          const data = estimateDoc.data() as FoundationEstimateData;
          
          // Обновляем только количества, сохраняя актуальные цены
          setEstimateData(prev => ({
            ...prev,
            items: prev.items.map((item, index) => ({
              ...item,
              quantity: data.items[index]?.quantity || 0,
              total: (data.items[index]?.quantity || 0) * item.price
            })),
            foundationWorkCost: data.foundationWorkCost || 0,
            totalMaterialsCost: prev.items.reduce((sum, item) => sum + item.total, 0),
          }));
        }
      } catch (error) {
        console.error('Error loading foundation estimate data:', error);
      }
    };

    loadEstimateData();
  }, [clientId]);

  useEffect(() => {
    if (!isEditing) return;

    const saveEstimateData = async () => {
      try {
        const estimateRef = doc(db, 'foundationEstimates', clientId);
        await setDoc(estimateRef, estimateData);
      } catch (error) {
        console.error('Error saving foundation estimate data:', error);
      }
    };

    const debounceTimer = setTimeout(saveEstimateData, 500);
    return () => clearTimeout(debounceTimer);
  }, [clientId, isEditing, estimateData]);

  useEffect(() => {
    setEstimateData(prev => {
      const newItems = prev.items.map(item => {
        switch (item.name) {
          case 'Бетон М250 Для Фундамента':
            return { ...item, quantity: calculations.foundationConcreteQuantity + 4.5 };
          case 'Бетон М250 для стяжки':
            return { ...item, quantity: calculations.screedConcreteQuantity + 3 };
          case 'Сетка 15x15 (Для теплого пола в стяжку) размер 80см на 2,4м = 1,92м2 1шт':
            return { ...item, quantity: calculations.meshQuantity };
          case 'Арматура 12 мм (Для армирования фундамента)':
            return { ...item, quantity: calculations.armatureQuantity };
          case 'Труба квадратная 80x80 2,5 мм (Для стойки балкона, навеса, или террасы)':
            return { ...item, quantity: calculations.pipeLength };
          case 'Проволока 6мм (Для хомутов при армировании арматуры)':
            return { ...item, quantity: calculations.wireQuantity };
          case 'ПГС Howo (Для засыпки внутри фундамента) (15м3)':
            return { ...item, quantity: calculations.pgsHowoQuantity };
          case 'Вязальная проволока 3мм (Для крепления опалубки)':
            return { ...item, quantity: calculations.bindingWireQuantity };
          case 'Вязальная проволока (Для связки арматуры и монтажа теплого пола)':
            return { ...item, quantity: calculations.tieWireQuantity };
          case 'Гвозди 120':
            return { ...item, quantity: calculations.nailsQuantity };
          case 'Подложка под теплый пол Рулон 60м2':
            return { ...item, quantity: calculations.underlayQuantity };
          case 'Теплый пол (для монтажа в стяжку) в 1 бухте 200м':
            return { ...item, quantity: calculations.heatedFloorQuantity };
          case 'Канализация, водопровод (Все материалы) См. доп смету':
            return { ...item, quantity: 1, price: 80000, total: 80000 };
          default:
            return item;
        }
      }).map(item => ({
        ...item,
        total: item.name === 'Канализация, водопровод (Все материалы) См. доп смету' 
          ? 80000 
          : item.quantity * item.price
      }));

      const totalMaterialsCost = newItems.reduce((sum, item) => sum + item.total, 0);
      return {
        ...prev,
        items: newItems,
        totalMaterialsCost,
        totalCost: totalMaterialsCost + prev.foundationWorkCost
      };
    });
  }, [calculations]);

  const handleUpdateItem = (index: number, field: keyof typeof estimateData.items[0], value: number) => {
    setEstimateData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
        total: field === 'quantity' ? value * newItems[index].price : 
               field === 'price' ? value * newItems[index].quantity :
               value
      };

      const totalMaterialsCost = newItems.reduce((sum, item) => sum + item.total, 0);
      return {
        ...prev,
        items: newItems,
        totalMaterialsCost,
        totalCost: totalMaterialsCost + prev.foundationWorkCost
      };
    });
  };

  const handleUpdateWorkCost = (value: number) => {
    setEstimateData(prev => ({
      ...prev,
      foundationWorkCost: value,
      totalCost: prev.totalMaterialsCost + value
    }));
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center text-gray-700 hover:text-gray-900 mb-4"
      >
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 mr-1" />
        ) : (
          <ChevronDown className="w-5 h-5 mr-1" />
        )}
        Смета фундамента
      </button>

      {isExpanded && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white text-center py-2">
            Фундамент + Засыпка фундамента + Стяжка
          </div>
          
          <FoundationEstimateTable
            items={estimateData.items}
            totalMaterialsCost={estimateData.totalMaterialsCost}
            foundationWorkCost={estimateData.foundationWorkCost}
            totalCost={estimateData.totalCost}
            onUpdateItem={handleUpdateItem}
            onUpdateWorkCost={handleUpdateWorkCost}
            isEditing={isEditing}
          />
        </div>
      )}
    </div>
  );
};