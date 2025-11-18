import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ReceiptData } from '../types/receipt';

export const useReceiptCalculation = (clientId: string) => {
  const [data, setData] = useState<ReceiptData>({
    operationalExpense: 1300000,
    sipWalls: 0,
    ceilingInsulation: 0,
    generalExpense: 0,
    contractPrice: 0,
    totalExpense: 0,
    netProfit: 0
  });

  const updateTotals = (newData: Partial<ReceiptData>) => {
    setData(prev => {
      const updated = { ...prev, ...newData };
      const totalExpense = Math.round(
        updated.operationalExpense + 
        updated.sipWalls + 
        updated.ceilingInsulation + 
        updated.generalExpense
      );
      return {
        ...updated,
        totalExpense,
        netProfit: Math.round(updated.contractPrice - totalExpense)
      };
    });
  };

  // Подписка на основные транзакции
  useEffect(() => {
    const unsubscribeTransactions = onSnapshot(
      doc(db, 'project_transactions', clientId),
      (doc) => {
        if (doc.exists()) {
          const transactionData = doc.data();
          updateTotals({
            operationalExpense: transactionData.operationalExpense || 1300000
          });
        }
      }
    );

    return () => {
      unsubscribeTransactions();
    };
  }, [clientId]);

  // Подписка на транзакции проекта для общего расхода
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const fetchProjectCategory = async () => {
      try {
        const clientDoc = await getDoc(doc(db, 'clients', clientId));
        if (!clientDoc.exists()) return;
        
        const clientData = clientDoc.data();
        const projectName = `${clientData.lastName} ${clientData.firstName}`;
        const objectName = clientData.objectName || '';
        
        const categoryQuery = query(
          collection(db, 'categories'),
          where('row', '==', 3),
          where('title', 'in', [projectName, objectName].filter(Boolean))
        );
        
        const categorySnapshot = await getDocs(categoryQuery);
        if (!categorySnapshot.empty) {
          const categoryId = categorySnapshot.docs[0].id;
          
          const transactionsQuery = query(
            collection(db, 'transactions'),
            where('categoryId', '==', categoryId)
          );
          
          unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
            const totalAmount = snapshot.docs.reduce((sum, doc) => {
              const transaction = doc.data();
              return sum + Math.abs(transaction.amount);
            }, 0);
            
            updateTotals({ generalExpense: totalAmount });
          });
        }
      } catch (error) {
        console.error('Error fetching project category:', error);
      }
    };
    
    fetchProjectCategory();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [clientId]);

  // Подписка на сметы СИП и крыши
  useEffect(() => {
    const sipWallsUnsubscribe = onSnapshot(
      doc(db, 'sipWallsEstimates', clientId),
      (doc) => {
        if (doc.exists()) {
          const sipData = doc.data();
          const sip28Total = sipData.items.find((item: any) => 
            item.name === 'СИП панели 163 мм высота 2,8м нарощенные пр-ва HotWell.kz'
          )?.total || 0;
          const sip25Total = sipData.items.find((item: any) => 
            item.name === 'СИП панели 163 мм высота 2,5м пр-ва HotWell.kz'
          )?.total || 0;
          
          updateTotals({ sipWalls: sip28Total + sip25Total });
        }
      }
    );

    const roofUnsubscribe = onSnapshot(
      doc(db, 'roofEstimates', clientId),
      (doc) => {
        if (doc.exists()) {
          const roofData = doc.data();
          
          // Ищем пенополистирол по более гибкому паттерну названия
          const polystyreneItem = roofData.items.find((item: any) => {
            const name = item.name.toLowerCase();
            return (
              name.includes('пенополистирол') && 
              name.includes('толщ') && 
              (name.includes('145мм') || name.includes('150мм')) &&
              (name.includes('утепления') || name.includes('утепление')) &&
              (name.includes('пот') || name.includes('потолок')) &&
              (name.includes('2-го эт') || name.includes('2эт'))
            );
          });
          
          const polystyreneTotal = polystyreneItem?.total || 0;
          
          // Отладочная информация
          console.log('🔧 Синхронизация пенополистирола:', {
            clientId,
            foundItem: polystyreneItem ? polystyreneItem.name : 'НЕ НАЙДЕН',
            total: polystyreneTotal,
            availableItems: roofData.items.map((item: any) => item.name)
          });
          
          updateTotals({ ceilingInsulation: polystyreneTotal });
        }
      }
    );

    const estimateUnsubscribe = onSnapshot(
      doc(db, 'estimates', clientId),
      (doc) => {
        if (doc.exists()) {
          const estimateData = doc.data();
          const contractPrice = estimateData.roofValues?.contractPrice?.value || 0;
          updateTotals({ contractPrice });
        }
      }
    );

    return () => {
      sipWallsUnsubscribe();
      roofUnsubscribe();
      estimateUnsubscribe();
    };
  }, [clientId]);

  return {
    ...data,
    updateTotals
  };
};