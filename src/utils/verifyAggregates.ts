/**
 * Скрипт проверки корректности расчетов агрегатов
 * Сравнивает старый способ (пересчет всех транзакций) с новым (использование агрегатов)
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getClientAggregates } from './clientAggregates';

interface VerificationResult {
  clientId: string;
  clientName: string;
  categoryId: string;
  oldMethod: {
    paidAmount: number;
    totalIncome: number;
    totalExpense: number;
    transactionCount: number;
  };
  newMethod: {
    paidAmount: number;
    totalIncome: number;
    totalExpense: number;
    transactionCount: number;
  };
  matches: boolean;
  differences: {
    paidAmount?: number;
    totalIncome?: number;
    totalExpense?: number;
    transactionCount?: number;
  };
}

/**
 * Проверяет корректность агрегатов для одного клиента
 */
export const verifyClientAggregates = async (
  clientId: string,
  categoryId: string,
  clientName: string
): Promise<VerificationResult> => {
  // Старый способ: пересчитываем все транзакции
  const transactionsQuery = query(
    collection(db, 'transactions'),
    where('categoryId', '==', categoryId)
  );
  const transactionsSnapshot = await getDocs(transactionsQuery);

  let oldPaidAmount = 0;
  let oldTotalIncome = 0;
  let oldTotalExpense = 0;

  transactionsSnapshot.docs.forEach(doc => {
    const amount = Number(doc.data().amount);
    const absAmount = Math.abs(amount);

    if (amount < 0) {
      oldPaidAmount += absAmount;
      oldTotalExpense += absAmount;
    } else {
      oldTotalIncome += absAmount;
    }
  });

  const oldMethod = {
    paidAmount: oldPaidAmount,
    totalIncome: oldTotalIncome,
    totalExpense: oldTotalExpense,
    transactionCount: transactionsSnapshot.docs.length
  };

  // Новый способ: используем агрегаты
  const aggregates = await getClientAggregates(clientId);
  const newMethod = aggregates ? {
    paidAmount: aggregates.paidAmount || 0,
    totalIncome: aggregates.totalIncome || 0,
    totalExpense: aggregates.totalExpense || 0,
    transactionCount: aggregates.transactionCount || 0
  } : {
    paidAmount: 0,
    totalIncome: 0,
    totalExpense: 0,
    transactionCount: 0
  };

  // Сравниваем результаты (допускаем небольшую погрешность из-за округления)
  const tolerance = 0.01;
  const matches = 
    Math.abs(oldMethod.paidAmount - newMethod.paidAmount) < tolerance &&
    Math.abs(oldMethod.totalIncome - newMethod.totalIncome) < tolerance &&
    Math.abs(oldMethod.totalExpense - newMethod.totalExpense) < tolerance &&
    oldMethod.transactionCount === newMethod.transactionCount;

  const differences: VerificationResult['differences'] = {};
  if (Math.abs(oldMethod.paidAmount - newMethod.paidAmount) >= tolerance) {
    differences.paidAmount = newMethod.paidAmount - oldMethod.paidAmount;
  }
  if (Math.abs(oldMethod.totalIncome - newMethod.totalIncome) >= tolerance) {
    differences.totalIncome = newMethod.totalIncome - oldMethod.totalIncome;
  }
  if (Math.abs(oldMethod.totalExpense - newMethod.totalExpense) >= tolerance) {
    differences.totalExpense = newMethod.totalExpense - oldMethod.totalExpense;
  }
  if (oldMethod.transactionCount !== newMethod.transactionCount) {
    differences.transactionCount = newMethod.transactionCount - oldMethod.transactionCount;
  }

  return {
    clientId,
    clientName,
    categoryId,
    oldMethod,
    newMethod,
    matches,
    differences
  };
};

/**
 * Проверяет корректность агрегатов для всех клиентов
 */
export const verifyAllClientAggregates = async (): Promise<VerificationResult[]> => {
  try {
    console.log('Начинаем проверку корректности агрегатов...');

    const clientsRef = collection(db, 'clients');
    const clientsSnapshot = await getDocs(clientsRef);

    console.log(`Найдено клиентов: ${clientsSnapshot.docs.length}`);

    const results: VerificationResult[] = [];

    for (const clientDoc of clientsSnapshot.docs) {
      try {
        const clientData = clientDoc.data();
        const clientId = clientDoc.id;
        const clientName = `${clientData.lastName} ${clientData.firstName}`;

        // Ищем категорию клиента
        const categoriesRef = collection(db, 'categories');
        const clientNameQuery = query(
          categoriesRef,
          where('title', '==', clientName),
          where('row', '==', 1)
        );

        let categorySnapshot = await getDocs(clientNameQuery);

        if (categorySnapshot.empty && clientData.objectName) {
          const objectNameQuery = query(
            categoriesRef,
            where('title', '==', clientData.objectName),
            where('row', '==', 1)
          );
          categorySnapshot = await getDocs(objectNameQuery);
        }

        if (!categorySnapshot.empty) {
          const categoryId = categorySnapshot.docs[0].id;
          const result = await verifyClientAggregates(clientId, categoryId, clientName);
          results.push(result);

          if (result.matches) {
            console.log(`✓ ${clientName}: совпадает`);
          } else {
            const diffStr = Object.entries(result.differences)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');
            console.warn(`⚠ ${clientName}: НЕ совпадает {${diffStr}}`);
            console.warn(`  Старый способ:`, result.oldMethod);
            console.warn(`  Новый способ:`, result.newMethod);
          }
        } else {
          console.warn(`⚠ Категория не найдена для клиента: ${clientName}`);
        }
      } catch (error) {
        console.error(`✗ Ошибка при проверке клиента ${clientDoc.id}:`, error);
      }
    }

    const matchesCount = results.filter(r => r.matches).length;
    const mismatchesCount = results.filter(r => !r.matches).length;

    console.log('\n=== Результаты проверки ===');
    console.log(`Совпадает: ${matchesCount}`);
    console.log(`Не совпадает: ${mismatchesCount}`);
    console.log(`Всего: ${results.length}`);

    if (mismatchesCount > 0) {
      console.log('\n=== Клиенты с несовпадениями ===');
      results.filter(r => !r.matches).forEach(r => {
        console.log(`${r.clientName}:`, r.differences);
      });
    }

    return results;
  } catch (error) {
    console.error('Критическая ошибка при проверке:', error);
    throw error;
  }
};

