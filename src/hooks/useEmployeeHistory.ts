import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Employee } from '../types/employee';
import { CategoryCardType } from '../types';
import { showErrorNotification } from '../utils/notifications';

export const useEmployeeHistory = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryCardType | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleViewHistory = async (employee: Employee) => {
    try {
      const categoriesQuery = query(
        collection(db, 'categories'),
        where('title', '==', employee.lastName + ' ' + employee.firstName),
        where('row', '==', 2)
      );
      
      const snapshot = await getDocs(categoriesQuery);
      if (!snapshot.empty) {
        const categoryDoc = snapshot.docs[0];
        setSelectedCategory({
          id: categoryDoc.id,
          title: categoryDoc.data().title,
          amount: categoryDoc.data().amount,
          iconName: categoryDoc.data().icon,
          color: categoryDoc.data().color,
          row: 2
        });
        setShowHistory(true);
      }
    } catch (error) {
      showErrorNotification('Не удалось загрузить историю транзакций');
    }
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
    setSelectedCategory(null);
  };

  return {
    selectedCategory,
    showHistory,
    handleViewHistory,
    handleCloseHistory
  };
};