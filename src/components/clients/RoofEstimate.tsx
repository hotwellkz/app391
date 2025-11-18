import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, or, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { RoofEstimateTable } from './RoofEstimateTable';
import { RoofEstimateData } from '../../types/estimate';
import { Product } from '../../types/warehouse';
import { prepareEstimateForSave } from '../../utils/estimateUtils';

interface RoofEstimateProps {
  isEditing: boolean;
  clientId: string;
}

export const RoofEstimate: React.FC<RoofEstimateProps> = ({
  isEditing,
  clientId
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [estimateData, setEstimateData] = useState<RoofEstimateData>({
    items: [
      { name: 'Брус 40x140x6000', unit: 'шт', quantity: 15, price: 3800, total: 57000 },
      { name: 'Брус 25x100x6000 (Для обрешетки)', unit: 'шт', quantity: 15, price: 1700, total: 25500 },
      { name: 'Металлочерепица глянец (Сырье Россия) (Форм СуперМонтеррей толщ. 0,45мм)', unit: 'м2', quantity: 0, price: 3006, total: 0 },
      { name: 'Паро. пленка (Под обрешетку) и (Для обшивки потолок 2эт.)', unit: 'рул', quantity: 0, price: 7000, total: 0 },
      { name: 'Конек бочкообразный (Для металлочерепицы двухметровый)', unit: 'шт', quantity: 0, price: 2970, total: 0 },
      { name: 'Заглушка конусная (Для бочкообразного конька)', unit: 'шт', quantity: 0, price: 2200, total: 0 },
      { name: 'Тройник (Для стыков бочкообразных коньков)', unit: 'шт', quantity: 0, price: 2680, total: 0 },
      { name: 'Ендова внешняя 80x80мм (Для металлочерепицы двухметровая)', unit: 'шт', quantity: 0, price: 2754, total: 0 },
      { name: 'Ендова внутренняя 600x600мм (Под металлочереп 600x600 двухметровая)', unit: 'шт', quantity: 0, price: 11166, total: 0 },
      { name: 'Планка примыкания к стене 150x150мм (В местах примык. мет. чер. к стене)', unit: 'шт', quantity: 0, price: 2816, total: 0 },
      { name: 'Пенополистирол Толщ 145мм (Для Утепления пот. 2-го эт)', unit: 'лист', quantity: 0, price: 8640, total: 0 },
      { name: 'Гвозди 120', unit: 'кг', quantity: 2, price: 700, total: 1575 },
      { name: 'Гвозди 70 (Для монтажа обрешетки)', unit: 'кг', quantity: 2, price: 700, total: 1743 },
      { name: 'Шурупы 4 (Для монтажа металлочерепицы)', unit: 'пач', quantity: 0, price: 1800, total: 0 },
      { name: 'Пена монтажная 70л', unit: 'шт', quantity: 0, price: 3700, total: 0 },
      { name: 'Скобы (Для крепления паро пленки)', unit: 'пач', quantity: 0, price: 400, total: 0 },
      { name: 'Шурупы 4 крупная резьба', unit: 'пач', quantity: 0, price: 700, total: 280 },
      { name: 'OSB 9мм (Для фронтона. Только для двух или односкатных крыш)', unit: 'лист', quantity: 2, price: 5300, total: 10600 }
    ],
    totalMaterialsCost: 96698,
    roofWorkCost: 0,
    deliveryCost: 60000,
    totalCost: 156698
  });

  useEffect(() => {
    const estimateRef = doc(db, 'estimates', clientId);
    const unsubscribe = onSnapshot(estimateRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const roof40x14 = data.lumberValues?.roof40x14?.value || 0;
        const attic40x14 = data.lumberValues?.attic40x14?.value || 0;
        const lathing20x9 = data.lumberValues?.lathing20x9?.value || 0;
        const metalTileArea = data.roofValues?.metalTileArea?.value || 0;
        const atticArea = data.lumberValues?.atticArea?.value || 0;
        const ridgeLength = data.roofValues?.ridgeLength?.value || 0;
        const floorArea = data.lumberValues?.floorArea?.value || 0;
        const conicPlug = data.roofValues?.conicPlug?.value || 0;
        const tee = data.roofValues?.tee?.value || 0;
        const endowLength = data.roofValues?.endowLength?.value || 0;
        const wallPlank = data.roofValues?.wallPlank?.value || 0;
        const frontonArea = data.lumberValues?.frontonArea?.value || 0;
        
        setEstimateData(prev => {
          const newItems = [...prev.items];
          
          // Брус 40x140
          const brusIndex = newItems.findIndex(item => item.name === 'Брус 40x140x6000');
          if (brusIndex !== -1) {
            const quantity = Math.ceil(((roof40x14 + attic40x14) / 6) + 15);
            newItems[brusIndex] = {
              ...newItems[brusIndex],
              quantity,
              total: quantity * newItems[brusIndex].price
            };

            // Обновляем количество гвоздей 120 на основе количества бруса
            const nails120Index = newItems.findIndex(item => item.name === 'Гвозди 120');
            if (nails120Index !== -1) {
              const nailsQuantity = Math.ceil(quantity * 0.15);
              newItems[nails120Index] = {
                ...newItems[nails120Index],
                quantity: nailsQuantity,
                total: nailsQuantity * newItems[nails120Index].price
              };
            }
          }

          // Брус для обрешетки
          const lathingIndex = newItems.findIndex(item => item.name === 'Брус 25x100x6000 (Для обрешетки)');
          if (lathingIndex !== -1) {
            const quantity = Math.ceil((lathing20x9 / 6) + 15);
            newItems[lathingIndex] = {
              ...newItems[lathingIndex],
              quantity,
              total: quantity * newItems[lathingIndex].price
            };

            // Обновляем количество гвоздей 70 на основе количества бруса для обрешетки
            const nails70Index = newItems.findIndex(item => item.name === 'Гвозди 70 (Для монтажа обрешетки)');
            if (nails70Index !== -1) {
              const nailsQuantity = Math.ceil(quantity * 0.166);
              newItems[nails70Index] = {
                ...newItems[nails70Index],
                quantity: nailsQuantity,
                total: nailsQuantity * newItems[nails70Index].price
              };
            }
          }

          // Металлочерепица и шурупы
          const metalTileIndex = newItems.findIndex(item => 
            item.name === 'Металлочерепица глянец (Сырье Россия) (Форм СуперМонтеррей толщ. 0,45мм)'
          );
          if (metalTileIndex !== -1) {
            const quantity = metalTileArea;
            newItems[metalTileIndex] = {
              ...newItems[metalTileIndex],
              quantity,
              total: quantity * newItems[metalTileIndex].price
            };

            // Обновляем количество шурупов для металлочерепицы
            const screwsIndex = newItems.findIndex(item => 
              item.name === 'Шурупы 4 (Для монтажа металлочерепицы)'
            );
            if (screwsIndex !== -1) {
              const screwsQuantity = Math.ceil(quantity * 0.074);
              newItems[screwsIndex] = {
                ...newItems[screwsIndex],
                quantity: screwsQuantity,
                total: screwsQuantity * newItems[screwsIndex].price
              };
            }
          }

          // Пенополистирол и монтажная пена
          const polystyreneIndex = newItems.findIndex(item => 
            item.name === 'Пенополистирол Толщ 145мм (Для Утепления пот. 2-го эт)'
          );
          if (polystyreneIndex !== -1) {
            const quantity = Math.ceil(atticArea / 2.88);
            newItems[polystyreneIndex] = {
              ...newItems[polystyreneIndex],
              quantity,
              total: quantity * newItems[polystyreneIndex].price
            };

            // Обновляем количество монтажной пены
            const foamIndex = newItems.findIndex(item => item.name === 'Пена монтажная 70л');
            if (foamIndex !== -1) {
              const foamQuantity = Math.ceil(quantity * 0.5);
              newItems[foamIndex] = {
                ...newItems[foamIndex],
                quantity: foamQuantity,
                total: foamQuantity * newItems[foamIndex].price
              };
            }
          }

          // Паропленка и скобы
          const vaporBarrierIndex = newItems.findIndex(item => 
            item.name === 'Паро. пленка (Под обрешетку) и (Для обшивки потолок 2эт.)'
          );
          if (vaporBarrierIndex !== -1) {
            const quantity = Math.ceil((metalTileArea / 50) + (floorArea / 50));
            newItems[vaporBarrierIndex] = {
              ...newItems[vaporBarrierIndex],
              quantity,
              total: quantity * newItems[vaporBarrierIndex].price
            };

            // Обновляем количество скоб
            const staplesIndex = newItems.findIndex(item => 
              item.name === 'Скобы (Для крепления паро пленки)'
            );
            if (staplesIndex !== -1) {
              const staplesQuantity = Math.max(0, quantity - 1);
              newItems[staplesIndex] = {
                ...newItems[staplesIndex],
                quantity: staplesQuantity,
                total: staplesQuantity * newItems[staplesIndex].price
              };
            }
          }

          // Конек бочкообразный
          const barrelRidgeIndex = newItems.findIndex(item => 
            item.name === 'Конек бочкообразный (Для металлочерепицы двухметровый)'
          );
          if (barrelRidgeIndex !== -1) {
            const quantity = Math.ceil(ridgeLength / 1.85);
            newItems[barrelRidgeIndex] = {
              ...newItems[barrelRidgeIndex],
              quantity,
              total: quantity * newItems[barrelRidgeIndex].price
            };
          }

          // Заглушка конусная
          const conicPlugIndex = newItems.findIndex(item => 
            item.name === 'Заглушка конусная (Для бочкообразного конька)'
          );
          if (conicPlugIndex !== -1) {
            const quantity = conicPlug;
            newItems[conicPlugIndex] = {
              ...newItems[conicPlugIndex],
              quantity,
              total: quantity * newItems[conicPlugIndex].price
            };
          }

          // Тройник
          const teeIndex = newItems.findIndex(item => 
            item.name === 'Тройник (Для стыков бочкообразных коньков)'
          );
          if (teeIndex !== -1) {
            const quantity = tee;
            newItems[teeIndex] = {
              ...newItems[teeIndex],
              quantity,
              total: quantity * newItems[teeIndex].price
            };
          }

          // Ендова внешняя
          const externalEndowIndex = newItems.findIndex(item => 
            item.name === 'Ендова внешняя 80x80мм (Для металлочерепицы двухметровая)'
          );
          if (externalEndowIndex !== -1) {
            const quantity = Math.ceil(endowLength / 1.85);
            newItems[externalEndowIndex] = {
              ...newItems[externalEndowIndex],
              quantity,
              total: quantity * newItems[externalEndowIndex].price
            };
          }

          // Ендова внутренняя
          const internalEndowIndex = newItems.findIndex(item => 
            item.name === 'Ендова внутренняя 600x600мм (Под металлочереп 600x600 двухметровая)'
          );
          if (internalEndowIndex !== -1) {
            const quantity = Math.ceil(endowLength / 1.85);
            newItems[internalEndowIndex] = {
              ...newItems[internalEndowIndex],
              quantity,
              total: quantity * newItems[internalEndowIndex].price
            };
          }

          // Планка примыкания
          const wallPlankIndex = newItems.findIndex(item => 
            item.name === 'Планка примыкания к стене 150x150мм (В местах примык. мет. чер. к стене)'
          );
          if (wallPlankIndex !== -1) {
            const quantity = wallPlank;
            newItems[wallPlankIndex] = {
              ...newItems[wallPlankIndex],
              quantity,
              total: quantity * newItems[wallPlankIndex].price
            };
          }

          // OSB
          const osbIndex = newItems.findIndex(item => 
            item.name === 'OSB 9мм (Для фронтона. Только для двух или односкатных крыш)'
          );
          if (osbIndex !== -1) {
            const quantity = Math.ceil(frontonArea / 3.125) + 2;
            newItems[osbIndex] = {
              ...newItems[osbIndex],
              quantity,
              total: quantity * newItems[osbIndex].price
            };
          }

          const totalMaterialsCost = newItems.reduce((sum, item) => sum + item.total, 0);
          return {
            ...prev,
            items: newItems,
            totalMaterialsCost,
            totalCost: totalMaterialsCost + prev.roofWorkCost + prev.deliveryCost
          };
        });
      }
    });

    return () => unsubscribe();
  }, [clientId]);

  useEffect(() => {
    const loadEstimateData = async () => {
      try {
        const estimateRef = doc(db, 'roofEstimates', clientId);
        const estimateDoc = await getDoc(estimateRef);
        
        if (estimateDoc.exists()) {
          const data = estimateDoc.data() as RoofEstimateData;
          setEstimateData(data);
        }
      } catch (error) {
        console.error('Error loading roof estimate data:', error);
      }
    };

    loadEstimateData();
  }, [clientId]);

  useEffect(() => {
    const saveEstimateData = async () => {
      if (!isEditing) return;

      try {
        const estimateRef = doc(db, 'roofEstimates', clientId);
        const dataToSave = prepareEstimateForSave({
          ...estimateData,
          updatedAt: serverTimestamp()
        });
        await setDoc(estimateRef, dataToSave);
      } catch (error) {
        console.error('Error saving roof estimate data:', error);
      }
    };

    const debounceTimer = setTimeout(saveEstimateData, 500);
    return () => clearTimeout(debounceTimer);
  }, [clientId, isEditing, estimateData]);

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
        totalCost: totalMaterialsCost + prev.roofWorkCost + prev.deliveryCost
      };
    });
  };

  const handleUpdateCosts = (field: 'roofWorkCost' | 'deliveryCost', value: number) => {
    setEstimateData(prev => ({
      ...prev,
      [field]: value,
      totalCost: prev.totalMaterialsCost + (field === 'roofWorkCost' ? value : prev.roofWorkCost) + (field === 'deliveryCost' ? value : prev.deliveryCost)
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
        Смета Крыши
      </button>

      {isExpanded && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white text-center py-2">
            Крыша+навес
          </div>
          
          <RoofEstimateTable
            items={estimateData.items}
            totalMaterialsCost={estimateData.totalMaterialsCost}
            roofWorkCost={estimateData.roofWorkCost}
            deliveryCost={estimateData.deliveryCost}
            totalCost={estimateData.totalCost}
            onUpdateItem={handleUpdateItem}
            onUpdateCosts={handleUpdateCosts}
            isEditing={isEditing}
          />
        </div>
      )}
    </div>
  );
};