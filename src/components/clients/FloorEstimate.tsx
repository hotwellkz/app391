import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, or, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FloorEstimateTable } from './FloorEstimateTable';
import { FloorEstimateData } from '../../types/estimate';
import { Product } from '../../types/product';
import { prepareEstimateForSave } from '../../utils/estimateUtils';

interface FloorEstimateProps {
  isEditing: boolean;
  clientId: string;
}

export const FloorEstimate: React.FC<FloorEstimateProps> = ({
  isEditing,
  clientId
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [estimateData, setEstimateData] = useState<FloorEstimateData>({
    items: [
      { name: 'Брус 40x190x6000 (Для перекрыт расстояние между балками 29см)', unit: 'шт', quantity: 0, price: 5800, total: 11600 },
      { name: 'OSB 18 (Для перекрытия (пол второго этажа))', unit: 'лист', quantity: 0, price: 15500, total: 15500 },
      { name: 'Шурупы 4 крупная резьба', unit: 'пач', quantity: 0, price: 700, total: 140 },
      { name: 'Гвозди 120', unit: 'кг', quantity: 0, price: 700, total: 70 }
    ],
    totalMaterialsCost: 27310,
    installationCost: 0,
    deliveryCost: 30000,
    totalCost: 57310
  });

  // Подписываемся на изменения в документе estimates
  useEffect(() => {
    const estimateRef = doc(db, 'estimates', clientId);
    const unsubscribe = onSnapshot(estimateRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const floor40x19 = data.lumberValues?.floor40x19?.value || 0;
        const beam40x19 = data.lumberValues?.beam40x19?.value || 0;
        const floorArea = data.lumberValues?.floorArea?.value || 0;
        
        setEstimateData(prev => {
          const newItems = [...prev.items];
          
          // Сначала обновляем количество бруса и OSB
          const brusIndex = newItems.findIndex(item => item.name === 'Брус 40x190x6000 (Для перекрыт расстояние между балками 29см)');
          const osbIndex = newItems.findIndex(item => item.name === 'OSB 18 (Для перекрытия (пол второго этажа))');
          
          if (brusIndex !== -1) {
            const quantity = Math.ceil(((floor40x19 + beam40x19) / 6) + 2);
            newItems[brusIndex] = {
              ...newItems[brusIndex],
              quantity,
              total: quantity * newItems[brusIndex].price
            };
          }
          
          if (osbIndex !== -1) {
            const quantity = Math.ceil((floorArea / 3.125) + 1);
            newItems[osbIndex] = {
              ...newItems[osbIndex],
              quantity,
              total: quantity * newItems[osbIndex].price
            };
          }
          
          // Обновляем количество шурупов на основе количества OSB
          const screwsIndex = newItems.findIndex(item => item.name === 'Шурупы 4 крупная резьба');
          if (screwsIndex !== -1 && osbIndex !== -1) {
            const quantity = Math.ceil(newItems[osbIndex].quantity / 5);
            newItems[screwsIndex] = {
              ...newItems[screwsIndex],
              quantity,
              total: quantity * newItems[screwsIndex].price
            };
          }

          // Обновляем количество гвоздей на основе количества бруса
          const nailsIndex = newItems.findIndex(item => item.name === 'Гвозди 120');
          if (nailsIndex !== -1 && brusIndex !== -1) {
            const quantity = Math.ceil(newItems[brusIndex].quantity * 0.05);
            newItems[nailsIndex] = {
              ...newItems[nailsIndex],
              quantity,
              total: quantity * newItems[nailsIndex].price
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

  // Подписка на изменения цен в продуктах
  useEffect(() => {
    const SYNCED_PRODUCTS = [
      'Брус 40x190x6000 (Для перекрыт расстояние между балками 29см)',
      'OSB 18 (Для перекрытия (пол второго этажа))',
      'Шурупы 4 крупная резьба',
      'Гвозди 120'
    ];

    const conditions = SYNCED_PRODUCTS.map(name => where('name', '==', name));
    const q = query(collection(db, 'products'), or(...conditions));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const product = change.doc.data() as Product;
          
          setEstimateData(prev => {
            const newItems = prev.items.map(item => {
              if (item.name === product.name) {
                const newTotal = item.quantity * product.price;
                return {
                  ...item,
                  price: product.price,
                  total: newTotal
                };
              }
              return item;
            });

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
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadEstimateData = async () => {
      try {
        const estimateRef = doc(db, 'floorEstimates', clientId);
        const estimateDoc = await getDoc(estimateRef);
        
        if (estimateDoc.exists()) {
          setEstimateData(estimateDoc.data() as FloorEstimateData);
        }
      } catch (error) {
        console.error('Error loading floor estimate data:', error);
      }
    };

    loadEstimateData();
  }, [clientId]);

  useEffect(() => {
    const saveEstimateData = async () => {
      if (!isEditing) return;

      try {
        const estimateRef = doc(db, 'floorEstimates', clientId);
        const dataToSave = prepareEstimateForSave({
          ...estimateData,
          updatedAt: serverTimestamp()
        });
        await setDoc(estimateRef, dataToSave);
      } catch (error) {
        console.error('Error saving floor estimate data:', error);
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
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          <h3 className="text-lg font-medium">Смета перекрытия</h3>
        </div>
      </div>
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white text-center py-2">
            ПЕРЕКРЫТИЕ из балок + OSB 18мм между первым и вторым этажами
          </div>
          
          <FloorEstimateTable
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