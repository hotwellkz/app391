import { collection, addDoc, deleteDoc, doc, updateDoc, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { CategoryData } from '../../types';

// Вспомогательная функция для форматирования суммы
export const formatAmount = (amount: number): string => {
  return `${amount} ₸`;
};

// Вспомогательная функция для парсинга суммы из строки
export const parseAmount = (amountStr: string): number => {
  return parseFloat(amountStr.replace(/[^\d.-]/g, ''));
};

export const addCategory = async (categoryData: CategoryData) => {
  try {
    const docRef = await addDoc(collection(db, 'categories'), {
      ...categoryData,
      amount: '0 ₸',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

export const updateCategory = async (categoryId: string, data: any) => {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (categoryId: string, categoryTitle: string, deleteAll: boolean) => {
  const batch = writeBatch(db);

  try {
    if (deleteAll) {
      // Удаляем все связанные транзакции
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('categoryId', '==', categoryId)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      transactionsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Удаляем все связанные категории
      const categoriesQuery = query(
        collection(db, 'categories'),
        where('title', '==', categoryTitle)
      );
      const categoriesSnapshot = await getDocs(categoriesQuery);
      categoriesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } else {
      // Удаляем только текущую категорию
      await deleteDoc(doc(db, 'categories', categoryId));
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};