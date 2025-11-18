import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useEstimateTotals = (clientId: string) => {
  const [totals, setTotals] = useState({
    additionalWorks: 0,
    consumables: 0,
    partitions: 0,
    roof: 0,
    floor: 0,
    sipWalls: 0,
    foundation: 0,
    operationalExpenses: 1300000,
    builderSalary: 0
  });

  useEffect(() => {
    // Подписка на операционный расход
    const operationalExpenseUnsubscribe = onSnapshot(
      doc(db, 'settings', 'operationalExpense'),
      (doc) => {
        if (doc.exists()) {
          setTotals(prev => ({
            ...prev,
            operationalExpenses: doc.data().value || 1300000
          }));
        }
      }
    );

    // Подписка на все сметы
    const subscriptions = [
      { name: 'additionalWorks', collection: 'additionalWorksEstimates' },
      { name: 'partitions', collection: 'partitionEstimates' },
      { name: 'roof', collection: 'roofEstimates' },
      { name: 'floor', collection: 'floorEstimates' },
      { name: 'sipWalls', collection: 'sipWallsEstimates' },
      { name: 'foundation', collection: 'foundationEstimates' }
    ];

    const unsubscribes = subscriptions.map(({ name, collection: collectionName }) => {
      return onSnapshot(
        doc(db, collectionName, clientId),
        (doc) => {
          if (doc.exists()) {
            setTotals(prev => ({
              ...prev,
              [name]: doc.data().totalCost || 0
            }));
          }
        }
      );
    });

    // Отдельная подписка на смету расходных материалов
    const consumablesUnsubscribe = onSnapshot(
      doc(db, 'consumablesEstimates', clientId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setTotals(prev => ({
            ...prev,
            consumables: data.totalMaterialsCost || 0
          }));
        }
      }
    );

    // Подписываемся на документ estimates для получения зарплаты строителей
    const estimateUnsubscribe = onSnapshot(
      doc(db, 'estimates', clientId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const builderSalary = data.roofValues?.builderSalary?.value || 0;
          setTotals(prev => ({
            ...prev,
            builderSalary
          }));
        }
      }
    );

    unsubscribes.push(consumablesUnsubscribe, estimateUnsubscribe);

    return () => {
      operationalExpenseUnsubscribe();
      unsubscribes.forEach(unsubscribe => unsubscribe());
      consumablesUnsubscribe();
      estimateUnsubscribe();
    };
  }, [clientId]);

  const grandTotal = Object.values(totals).reduce((sum, value) => sum + value, 0);

  return { totals, grandTotal };
};