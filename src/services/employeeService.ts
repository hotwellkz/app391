import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Employee, EmployeeFormData } from '../types/employee';
import { addCategory } from './categoryService';

export const createEmployee = async (formData: EmployeeFormData): Promise<string> => {
  try {
    const batch = writeBatch(db);

    // Создаем сотрудника
    const employeeRef = doc(collection(db, 'employees'));
    batch.set(employeeRef, {
      ...formData,
      status: 'active',
      createdAt: serverTimestamp()
    });

    // Создаем категорию для сотрудника
    const categoryRef = doc(collection(db, 'categories'));
    batch.set(categoryRef, {
      title: formData.lastName + ' ' + formData.firstName,
      icon: 'User',
      color: 'bg-amber-400',
      row: 2,
      amount: '0 ₸',
      createdAt: serverTimestamp()
    });

    await batch.commit();
    return employeeRef.id;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw new Error('Не удалось создать сотрудника. Пожалуйста, попробуйте снова.');
  }
};

export const updateEmployee = async (employeeId: string, formData: EmployeeFormData): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Обновляем данные сотрудника
    const employeeRef = doc(db, 'employees', employeeId);
    batch.update(employeeRef, {
      ...formData,
      updatedAt: serverTimestamp()
    });

    // Находим и обновляем категорию сотрудника
    const categoriesQuery = query(
      collection(db, 'categories'),
      where('row', '==', 2),
      where('title', '==', formData.lastName + ' ' + formData.firstName)
    );
    
    const categoriesSnapshot = await getDocs(categoriesQuery);
    if (!categoriesSnapshot.empty) {
      const categoryRef = doc(db, 'categories', categoriesSnapshot.docs[0].id);
      batch.update(categoryRef, {
        title: formData.lastName + ' ' + formData.firstName,
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error updating employee:', error);
    throw new Error('Не удалось обновить данные сотрудника. Пожалуйста, попробуйте снова.');
  }
};

export const deleteEmployeeWithHistory = async (employee: Employee): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Удаляем сотрудника
    batch.delete(doc(db, 'employees', employee.id));

    // Находим категорию сотрудника
    const categoriesQuery = query(
      collection(db, 'categories'),
      where('row', '==', 2),
      where('title', '==', employee.lastName + ' ' + employee.firstName)
    );
    
    const categoriesSnapshot = await getDocs(categoriesQuery);
    if (!categoriesSnapshot.empty) {
      const categoryId = categoriesSnapshot.docs[0].id;
      
      // Удаляем категорию
      batch.delete(doc(db, 'categories', categoryId));

      // Находим и удаляем все связанные транзакции
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('categoryId', '==', categoryId)
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      transactionsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error deleting employee with history:', error);
    throw new Error('Не удалось удалить сотрудника. Пожалуйста, попробуйте снова.');
  }
};

export const deleteEmployeeOnly = async (employee: Employee): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Удаляем сотрудника
    batch.delete(doc(db, 'employees', employee.id));

    // Находим и удаляем категорию
    const categoriesQuery = query(
      collection(db, 'categories'),
      where('row', '==', 2),
      where('title', '==', employee.lastName + ' ' + employee.firstName)
    );
    
    const categoriesSnapshot = await getDocs(categoriesQuery);
    if (!categoriesSnapshot.empty) {
      batch.delete(doc(db, 'categories', categoriesSnapshot.docs[0].id));
    }

    await batch.commit();
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw new Error('Не удалось удалить сотрудника. Пожалуйста, попробуйте снова.');
  }
};