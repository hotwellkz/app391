import { useEffect } from 'react';
import { collection, query, where, onSnapshot, or } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types/product';
import { FoundationEstimateData } from '../types/estimate';

export const SYNCED_PRODUCTS = [
  'Бетон М250 Для Фундамента',
  'Бетон М250 для стяжки',
  'Арматура 12 мм (Для армирования фундамента)',
  'Сетка 15x15 (Для теплого пола в стяжку) размер 80см на 2,4м = 1,92м2 1шт',
  'Труба квадратная 80x80 2,5 мм (Для стойки балкона, навеса, или террасы)',
  'Проволока 6мм (Для хомутов при армировании арматуры)',
  'ПГС Камаз (Для засыпки внутри фундамента) (7 м3)',
  'ПГС Howo (Для засыпки внутри фундамента) (15м3)',
  'Вязальная проволока 3мм (Для крепления опалубки)',
  'Вязальная проволока (Для связки арматуры и монтажа теплого пола)',
  'Гвозди 120',
  'Подложка под теплый пол Рулон 60м2',
  'Теплый пол (для монтажа в стяжку) в 1 бухте 200м'
];

export const useFoundationPriceSync = (
  setEstimateData: React.Dispatch<React.SetStateAction<FoundationEstimateData>>
) => {
  useEffect(() => {
    const conditions = SYNCED_PRODUCTS.map(name => where('name', '==', name));
    const q = query(collection(db, 'products'), or(...conditions));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const product = change.doc.data() as Product;
          console.log('Product from Firebase:', product);
          
          setEstimateData(prev => {
            const newItems = prev.items.map(item => {
              // Синхронизация цен бетона
              if (product.name === 'Бетон М250 Для Фундамента' &&
                  (item.name === 'Бетон М250 Для Фундамента' || 
                   item.name === 'Бетон М250 для стяжки')) {
                console.log('Updating price for:', item.name, 'to:', product.price);
                return {
                  ...item,
                  price: product.price,
                  total: item.quantity * product.price
                };
              }
              
              if (item.name === product.name) {
                const newTotal = item.quantity * product.price;
                console.log('Updating price for:', item.name, 'to:', product.price);
                return {
                  ...item,
                  price: product.price,
                  total: newTotal
                };
              }
              return item;
            });

            const totalMaterialsCost = newItems.reduce((sum, item) => sum + item.total, 0);
            console.log('Updated estimate data:', {
              ...prev,
              items: newItems,
              totalMaterialsCost,
              totalCost: totalMaterialsCost + prev.foundationWorkCost
            });
            return {
              ...prev,
              items: newItems,
              totalMaterialsCost,
              totalCost: totalMaterialsCost + prev.foundationWorkCost
            };
          });
        }
      });
    });

    return () => unsubscribe();
  }, [setEstimateData]);
};