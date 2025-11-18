import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, or, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PartitionEstimateTable } from './PartitionEstimateTable';
import { PartitionEstimateData } from '../../types/estimate';
import { Product } from '../../types/warehouse';
import { prepareEstimateForSave } from '../../utils/estimateUtils';

interface PartitionEstimateProps {
  isEditing: boolean;
  clientId: string;
}

export const PartitionEstimate: React.FC<PartitionEstimateProps> = ({
  isEditing,
  clientId
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [estimateData, setEstimateData] = useState<PartitionEstimateData>({
    items: [
      { name: 'Гипсокартон 12,5мм стеновой (Для межкомнатных перегородок) пр-ва Knauf', unit: 'лист', quantity: 10, price: 2700, total: 26100 },
      { name: 'Гипсокартон 12,5мм влагостойкий стеновой (Для межком перег) пр-ва Knauf', unit: 'лист', quantity: 12, price: 3000, total: 35000 },
      { name: 'Профиль для перегородок 75x50x3000 пр-ва Stynergy', unit: 'шт', quantity: 850, price: 1700, total: 1445000 },
      { name: 'Направляющие для перегородочного проф. 75x40x3000 пр-ва Stynergy', unit: 'шт', quantity: 11, price: 1500, total: 16000 },
      { name: 'Мин вата Экотерм (Для заполнения меж-комнатных перегородок) (1рул-12м2)', unit: 'рул', quantity: 3, price: 6000, total: 19333 },
      { name: 'Шурупы 3 мелкая резьба (Для монтажа гипсокартона к профилям) 1п на 5 лис', unit: 'пач', quantity: 2, price: 700, total: 1353 },
      { name: 'Шурупы семечки (Для монтажа профилей межкомнатных перегородок)', unit: 'пач', quantity: 1, price: 700, total: 700 },
      { name: 'Вывоз мусора', unit: '', quantity: 0, price: 0, total: 20000 }
    ],
    totalMaterialsCost: 1563487,
    installationCost: 0,
    deliveryCost: 30000,
    totalCost: 1593487
  });

  useEffect(() => {
    const estimateRef = doc(db, 'estimates', clientId);
    const unsubscribe = onSnapshot(estimateRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const gklWallsArea = data.lumberValues?.gklWallsArea?.value || 0;
        const firstFloorHeight = parseFloat(data.firstFloorHeight?.replace(',', '.') || '2.5');
        const secondFloorHeight = parseFloat(data.secondFloorHeight?.replace(',', '.') || '2.5');
        const firstFloorWallsLength = data.lumberValues?.firstFloorWallsLength?.value || 0;
        const secondFloorWallsLength = data.lumberValues?.secondFloorWallsLength?.value || 0;
        const gklWallsLength = data.lumberValues?.gklWallsLength?.value || 0;
        const partitionProfile = data.lumberValues?.partitionProfile?.value || 0;
        
        setEstimateData(prev => {
          const newItems = [...prev.items];

          // Расчет количества влагостойкого гипсокартона
          const moistureResistantGKLIndex = newItems.findIndex(item => 
            item.name === 'Гипсокартон 12,5мм влагостойкий стеновой (Для межком перег) пр-ва Knauf'
          );
          if (moistureResistantGKLIndex !== -1) {
            const quantity = Math.ceil(((firstFloorWallsLength * firstFloorHeight) + 
              (secondFloorWallsLength * secondFloorHeight)) / 3);
            newItems[moistureResistantGKLIndex] = {
              ...newItems[moistureResistantGKLIndex],
              quantity,
              total: quantity * newItems[moistureResistantGKLIndex].price
            };

            // Расчет количества обычного гипсокартона
            const regularGKLIndex = newItems.findIndex(item => 
              item.name === 'Гипсокартон 12,5мм стеновой (Для межкомнатных перегородок) пр-ва Knauf'
            );
            if (regularGKLIndex !== -1) {
              const regularGKLQuantity = Math.max(0, Math.ceil(((gklWallsArea * 2) / 3) + 2) - quantity);
              newItems[regularGKLIndex] = {
                ...newItems[regularGKLIndex],
                quantity: regularGKLQuantity,
                total: regularGKLQuantity * newItems[regularGKLIndex].price
              };

              // Расчет количества шурупов для гипсокартона
              const screwsIndex = newItems.findIndex(item => 
                item.name === 'Шурупы 3 мелкая резьба (Для монтажа гипсокартона к профилям) 1п на 5 лис'
              );
              if (screwsIndex !== -1) {
                const screwsQuantity = Math.ceil(regularGKLQuantity / 5);
                newItems[screwsIndex] = {
                  ...newItems[screwsIndex],
                  quantity: screwsQuantity,
                  total: screwsQuantity * newItems[screwsIndex].price
                };
              }
            }
          }

          // Расчет количества направляющих профилей
          const guidesIndex = newItems.findIndex(item => 
            item.name === 'Направляющие для перегородочного проф. 75x40x3000 пр-ва Stynergy'
          );
          if (guidesIndex !== -1) {
            const quantity = Math.ceil(((gklWallsLength * 2) / 3) + 2);
            newItems[guidesIndex] = {
              ...newItems[guidesIndex],
              quantity,
              total: quantity * newItems[guidesIndex].price
            };
          }

          // Расчет количества минваты
          const mineralWoolIndex = newItems.findIndex(item => 
            item.name === 'Мин вата Экотерм (Для заполнения меж-комнатных перегородок) (1рул-12м2)'
          );
          if (mineralWoolIndex !== -1) {
            const quantity = Math.ceil(gklWallsArea / 9);
            newItems[mineralWoolIndex] = {
              ...newItems[mineralWoolIndex],
              quantity,
              total: quantity * newItems[mineralWoolIndex].price
            };
          }

          // Расчет количества профилей
          const profileIndex = newItems.findIndex(item => 
            item.name === 'Профиль для перегородок 75x50x3000 пр-ва Stynergy'
          );
          if (profileIndex !== -1) {
            const quantity = partitionProfile;
            newItems[profileIndex] = {
              ...newItems[profileIndex],
              quantity,
              total: quantity * newItems[profileIndex].price
            };
          }

          const totalMaterialsCost = newItems.reduce((sum, item) => sum + item.total, 0);
          return {
            ...prev,
            items: newItems,
            totalMaterialsCost,
            totalCost: totalMaterialsCost + prev.installationCost + prev.deliveryCost
          };
        });
      }
    });

    return () => unsubscribe();
  }, [clientId]);

  useEffect(() => {
    const loadEstimateData = async () => {
      try {
        const estimateRef = doc(db, 'partitionEstimates', clientId);
        const estimateDoc = await getDoc(estimateRef);
        
        if (estimateDoc.exists()) {
          setEstimateData(estimateDoc.data() as PartitionEstimateData);
        }
      } catch (error) {
        console.error('Error loading partition estimate data:', error);
      }
    };

    loadEstimateData();
  }, [clientId]);

  useEffect(() => {
    const saveEstimateData = async () => {
      if (!isEditing) return;

      try {
        const estimateRef = doc(db, 'partitionEstimates', clientId);
        const dataToSave = prepareEstimateForSave({
          ...estimateData,
          updatedAt: serverTimestamp()
        });
        await setDoc(estimateRef, dataToSave);
      } catch (error) {
        console.error('Error saving partition estimate data:', error);
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
        totalCost: totalMaterialsCost + prev.installationCost + prev.deliveryCost
      };
    });
  };

  const handleUpdateCosts = (field: 'installationCost' | 'deliveryCost', value: number) => {
    setEstimateData(prev => ({
      ...prev,
      [field]: value,
      totalCost: prev.totalMaterialsCost + (field === 'installationCost' ? value : prev.installationCost) + (field === 'deliveryCost' ? value : prev.deliveryCost)
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
        Смета Межкомнатных Перегородок
      </button>

      {isExpanded && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white text-center py-2">
            Перегородки несущие из профиля и гипсокартона
          </div>
          
          <PartitionEstimateTable
            items={estimateData.items}
            totalMaterialsCost={estimateData.totalMaterialsCost}
            installationCost={estimateData.installationCost}
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