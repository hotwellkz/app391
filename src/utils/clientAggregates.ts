/**
 * Утилиты для работы с предрасчитанными агрегатами клиентов
 * Эти агрегаты обновляются при создании/изменении/удалении транзакций
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ClientAggregates {
  clientId: string;
  categoryId?: string;
  paidAmount: number; // Сумма всех платежей (транзакции с amount < 0)
  totalIncome: number; // Общая сумма приходов
  totalExpense: number; // Общая сумма расходов
  transactionCount: number; // Количество транзакций
  lastTransactionDate?: Timestamp | Date;
  lastUpdated: Timestamp | Date;
}

/**
 * Получить агрегаты для клиента
 */
export const getClientAggregates = async (clientId: string): Promise<ClientAggregates | null> => {
  try {
    const aggregatesRef = doc(db, 'clientAggregates', clientId);
    const aggregatesDoc = await getDoc(aggregatesRef);
    
    if (!aggregatesDoc.exists()) {
      return null;
    }
    
    return aggregatesDoc.data() as ClientAggregates;
  } catch (error) {
    console.error('Error getting client aggregates:', error);
    return null;
  }
};

/**
 * Обновить агрегаты для клиента при создании транзакции
 */
export const updateClientAggregatesOnTransaction = async (
  categoryId: string,
  amount: number,
  transactionDate: Timestamp | Date
): Promise<void> => {
  try {
    // Получаем категорию по ID
    const categoryRef = doc(db, 'categories', categoryId);
    const categoryDoc = await getDoc(categoryRef);
    
    if (!categoryDoc.exists()) {
      return; // Категория не найдена
    }
    
    const categoryData = categoryDoc.data();
    
    // Проверяем, что это категория клиента (row === 1)
    if (categoryData.row !== 1) {
      return; // Не клиент, пропускаем
    }
    
    const categoryTitle = categoryData.title;
    if (!categoryTitle) return;
    
    // Ищем клиента по имени или названию объекта
    const clientsRef = collection(db, 'clients');
    const clientNameParts = categoryTitle.split(' ');
    const lastName = clientNameParts[0] || '';
    const firstName = clientNameParts[1] || '';
    
    let clientQuery = query(
      clientsRef,
      where('lastName', '==', lastName),
      where('firstName', '==', firstName)
    );
    let clientSnapshot = await getDocs(clientQuery);
    
    if (clientSnapshot.empty && categoryData.objectName) {
      clientQuery = query(
        clientsRef,
        where('objectName', '==', categoryData.objectName)
      );
      clientSnapshot = await getDocs(clientQuery);
    }
    
    if (clientSnapshot.empty) {
      return; // Клиент не найден
    }
    
    const clientId = clientSnapshot.docs[0].id;
    const aggregatesRef = doc(db, 'clientAggregates', clientId);
    const aggregatesDoc = await getDoc(aggregatesRef);
    
    const date = transactionDate instanceof Timestamp ? transactionDate : Timestamp.fromDate(transactionDate);
    
    if (aggregatesDoc.exists()) {
      const current = aggregatesDoc.data() as ClientAggregates;
      const isExpense = amount < 0;
      const absAmount = Math.abs(amount);
      
      await updateDoc(aggregatesRef, {
        paidAmount: isExpense ? current.paidAmount + absAmount : current.paidAmount,
        totalIncome: !isExpense ? current.totalIncome + absAmount : current.totalIncome,
        totalExpense: isExpense ? current.totalExpense + absAmount : current.totalExpense,
        transactionCount: current.transactionCount + 1,
        lastTransactionDate: date,
        lastUpdated: serverTimestamp(),
        categoryId: categoryId
      });
    } else {
      const isExpense = amount < 0;
      const absAmount = Math.abs(amount);
      
      await setDoc(aggregatesRef, {
        clientId,
        categoryId,
        paidAmount: isExpense ? absAmount : 0,
        totalIncome: !isExpense ? absAmount : 0,
        totalExpense: isExpense ? absAmount : 0,
        transactionCount: 1,
        lastTransactionDate: date,
        lastUpdated: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating client aggregates:', error);
    // Не бросаем ошибку, чтобы не ломать создание транзакции
  }
};

/**
 * Обновить агрегаты при удалении транзакции
 */
export const updateClientAggregatesOnDelete = async (
  categoryId: string,
  amount: number
): Promise<void> => {
  try {
    // Получаем категорию по ID
    const categoryRef = doc(db, 'categories', categoryId);
    const categoryDoc = await getDoc(categoryRef);
    
    if (!categoryDoc.exists()) {
      return;
    }
    
    const categoryData = categoryDoc.data();
    
    // Проверяем, что это категория клиента (row === 1)
    if (categoryData.row !== 1) {
      return;
    }
    
    const categoryTitle = categoryData.title;
    if (!categoryTitle) return;
    
    const clientsRef = collection(db, 'clients');
    const clientNameParts = categoryTitle.split(' ');
    const lastName = clientNameParts[0] || '';
    const firstName = clientNameParts[1] || '';
    
    let clientQuery = query(
      clientsRef,
      where('lastName', '==', lastName),
      where('firstName', '==', firstName)
    );
    let clientSnapshot = await getDocs(clientQuery);
    
    if (clientSnapshot.empty && categoryData.objectName) {
      clientQuery = query(
        clientsRef,
        where('objectName', '==', categoryData.objectName)
      );
      clientSnapshot = await getDocs(clientQuery);
    }
    
    if (clientSnapshot.empty) {
      return;
    }
    
    const clientId = clientSnapshot.docs[0].id;
    const aggregatesRef = doc(db, 'clientAggregates', clientId);
    const aggregatesDoc = await getDoc(aggregatesRef);
    
    if (aggregatesDoc.exists()) {
      const current = aggregatesDoc.data() as ClientAggregates;
      const isExpense = amount < 0;
      const absAmount = Math.abs(amount);
      
      // Вычитаем значения
      const newPaidAmount = isExpense ? current.paidAmount - absAmount : current.paidAmount;
      const newTotalIncome = !isExpense ? current.totalIncome - absAmount : current.totalIncome;
      const newTotalExpense = isExpense ? current.totalExpense - absAmount : current.totalExpense;
      const newTransactionCount = current.transactionCount - 1;
      
      // Проверяем на отрицательные значения
      if (newPaidAmount < 0 || newTotalIncome < 0 || newTotalExpense < 0 || newTransactionCount < 0) {
        console.warn(`⚠️ Отрицательные значения при удалении транзакции для клиента ${clientId}. Пересчитываем агрегаты...`, {
          paidAmount: newPaidAmount,
          totalIncome: newTotalIncome,
          totalExpense: newTotalExpense,
          transactionCount: newTransactionCount,
          current,
          amount
        });
        
        // Если есть categoryId, пересчитываем агрегаты заново
        if (current.categoryId) {
          try {
            await recalculateClientAggregates(clientId, current.categoryId);
            console.log(`✓ Агрегаты для клиента ${clientId} пересчитаны после обнаружения отрицательных значений`);
            return; // Выходим, так как recalculateClientAggregates уже обновил агрегаты
          } catch (recalcError) {
            console.error(`✗ Ошибка при пересчете агрегатов для клиента ${clientId}:`, recalcError);
            // Продолжаем с обновлением, даже если пересчет не удался
          }
        }
      }
      
      await updateDoc(aggregatesRef, {
        paidAmount: newPaidAmount,
        totalIncome: newTotalIncome,
        totalExpense: newTotalExpense,
        transactionCount: newTransactionCount,
        lastUpdated: serverTimestamp()
      });
    } else {
      // Если агрегаты не существуют, но мы удаляем транзакцию - это нормально
      // (транзакция могла быть создана до внедрения системы агрегатов)
      console.log(`ℹ️ Агрегаты не найдены для клиента ${clientId} при удалении транзакции. Это нормально, если транзакция была создана до внедрения системы агрегатов.`);
    }
  } catch (error) {
    console.error('Error updating client aggregates on delete:', error);
  }
};

/**
 * Пересчитать агрегаты для клиента (используется для миграции или исправления)
 */
export const recalculateClientAggregates = async (clientId: string, categoryId: string): Promise<void> => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const transactionsQuery = query(
      transactionsRef,
      where('categoryId', '==', categoryId)
    );
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    
    let paidAmount = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    let lastTransactionDate: Timestamp | null = null;
    
    transactionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const amount = Number(data.amount);
      const absAmount = Math.abs(amount);
      const transactionDate = data.date;
      
      if (amount < 0) {
        paidAmount += absAmount;
        totalExpense += absAmount;
      } else {
        totalIncome += absAmount;
      }
      
      if (transactionDate && (!lastTransactionDate || transactionDate > lastTransactionDate)) {
        lastTransactionDate = transactionDate;
      }
    });
    
    const aggregatesRef = doc(db, 'clientAggregates', clientId);
    await setDoc(aggregatesRef, {
      clientId,
      categoryId,
      paidAmount,
      totalIncome,
      totalExpense,
      transactionCount: transactionsSnapshot.docs.length,
      lastTransactionDate: lastTransactionDate || serverTimestamp(),
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error recalculating client aggregates:', error);
    throw error;
  }
};

