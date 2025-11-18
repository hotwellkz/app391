import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, or, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SipWallsEstimateTable } from './SipWallsEstimateTable';
import { SipWallsEstimateData } from '../../types/estimate';
import { Product } from '../../types/product';
import { prepareEstimateForSave } from '../../utils/estimateUtils';

interface SipWallsEstimateProps {
  isEditing: boolean;
  clientId: string;
}

export const SipWallsEstimate: React.FC<SipWallsEstimateProps> = ({
  isEditing,
  clientId
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [estimateData, setEstimateData] = useState<SipWallsEstimateData>({
    items: [
      { name: 'СИП панели 163 мм высота 2,8м нарощенные пр-ва HotWell.kz', unit: 'шт', quantity: 0, price: 28890, total: 28890 },
      { name: 'СИП панели 163 мм высота 2,5м пр-ва HotWell.kz', unit: 'шт', quantity: 0, price: 25890, total: 25890 },
      { name: 'Брус 40x140x6000', unit: 'шт', quantity: 0, price: 3800, total: 57000 },
      { name: 'Шурупы 4 крупная резьба', unit: 'пач', quantity: 0, price: 700, total: 700 },
      { name: 'Шурупы 10 крупная резьба', unit: 'пач', quantity: 0, price: 700, total: 56 },
      { name: 'Пена монтажная 70л', unit: 'шт', quantity: 0, price: 3700, total: 4933 },
      { name: 'Бикрост (Для гидро изоляции между СИП панелями и фундаментом)', unit: 'рул', quantity: 0, price: 12000, total: 27800 },
      { name: 'Вентиляция (Все материалы) См. доп смету', unit: '', quantity: 0, price: 0, total: 40000 }
    ],
    totalMaterialsCost: 185269,
    installationCost: 0,
    deliveryCost: 60000,
    totalCost: 245269
  });

  // Подписываемся на изменения в документе estimates
  useEffect(() => {
    const estimateRef = doc(db, 'estimates', clientId);
    const unsubscribe = onSnapshot(estimateRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const sip28Area = data.foundationValues?.sip28Area?.value || 0;
        const sip25Area = data.foundationValues?.sip25Area?.value || 0;
        const walls40x14 = data.lumberValues?.walls40x14?.value || 0;
        const perimeter = data.foundationValues?.perimeter?.value || 0;
        
        setEstimateData(prev => {
          const newItems = [...prev.items];
          
          // Сначала обновляем количество СИП панелей
          const sip28Index = newItems.findIndex(item => item.name === 'СИП панели 163 мм высота 2,8м нарощенные пр-ва HotWell.kz');
          const sip25Index = newItems.findIndex(item => item.name === 'СИП панели 163 мм высота 2,5м пр-ва HotWell.kz');
          
          if (sip28Index !== -1) {
            const quantity = Math.ceil((sip28Area / 3.5) + 3);
            newItems[sip28Index] = {
              ...newItems[sip28Index],
              quantity,
              total: quantity * newItems[sip28Index].price
            };
          }
          
          if (sip25Index !== -1) {
            const quantity = Math.ceil((sip25Area / 3.125) + 3);
            newItems[sip25Index] = {
              ...newItems[sip25Index],
              quantity,
              total: quantity * newItems[sip25Index].price
            };
          }
          
          // Теперь обновляем остальные зависимые позиции
          newItems.forEach((item, index) => {
            if (item.name === 'Брус 40x140x6000') {
              const quantity = Math.ceil((walls40x14 / 6) + 15);
              newItems[index] = {
                ...item,
                quantity,
                total: quantity * item.price
              };
            } else if (item.name === 'Шурупы 4 крупная резьба') {
              const sip28Quantity = newItems[sip28Index].quantity;
              const sip25Quantity = newItems[sip25Index].quantity;
              const quantity = Math.ceil((sip28Quantity + sip25Quantity) / 2);
              newItems[index] = {
                ...item,
                quantity,
                total: quantity * item.price
              };
            } else if (item.name === 'Шурупы 10 крупная резьба') {
              const sip28Quantity = newItems[sip28Index].quantity;
              const sip25Quantity = newItems[sip25Index].quantity;
              const quantity = Math.ceil((sip28Quantity + sip25Quantity) * 0.04);
              newItems[index] = {
                ...item,
                quantity,
                total: quantity * item.price
              };
            } else if (item.name === 'Пена монтажная 70л') {
              const sip28Quantity = newItems[sip28Index].quantity;
              const sip25Quantity = newItems[sip25Index].quantity;
              const quantity = Math.ceil((sip28Quantity + sip25Quantity) / 1.5);
              newItems[index] = {
                ...item,
                quantity,
                total: quantity * item.price
              };
            } else if (item.name === 'Бикрост (Для гидро изоляции между СИП панелями и фундаментом)') {
              const quantity = Math.ceil((perimeter / 15) / 4);
              newItems[index] = {
                ...item,
                quantity,
                total: quantity * item.price
              };
            }
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

    return () => unsubscribe();
  }, [clientId]);

  // Подписка на изменения цен в продуктах
  useEffect(() => {
    const SYNCED_PRODUCTS = [
      'СИП панели 163 мм высота 2,8м нарощенные пр-ва HotWell.kz',
      'СИП панели 163 мм высота 2,5м пр-ва HotWell.kz',
      'Брус 40x140x6000',
      'Шурупы 4 крупная резьба',
      'Шурупы 10 крупная резьба',
      'Пена монтажная 70л',
      'Бикрост (Для гидро изоляции между СИП панелями и фундаментом)'
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
        const estimateRef = doc(db, 'sipWallsEstimates', clientId);
        const estimateDoc = await getDoc(estimateRef);
        
        if (estimateDoc.exists()) {
          setEstimateData(estimateDoc.data() as SipWallsEstimateData);
        }
      } catch (error) {
        console.error('Error loading SIP walls estimate data:', error);
      }
    };

    loadEstimateData();
  }, [clientId]);

  useEffect(() => {
    const saveEstimateData = async () => {
      if (!isEditing) return;

      try {
        const estimateRef = doc(db, 'sipWallsEstimates', clientId);
        const dataToSave = prepareEstimateForSave({
          ...estimateData,
          updatedAt: serverTimestamp()
        });
        await setDoc(estimateRef, dataToSave);
      } catch (error) {
        console.error('Error saving SIP walls estimate data:', error);
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
        Смета стен из СИП панелей
      </button>

      {isExpanded && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white text-center py-2">
            Стены из СИП панелей (несущие)
          </div>
          
          <SipWallsEstimateTable
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