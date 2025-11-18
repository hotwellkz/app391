/**
 * Скрипт миграции для пересчета агрегатов всех клиентов
 * Запускается один раз для создания агрегатов для существующих клиентов
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { recalculateClientAggregates } from './clientAggregates';

/**
 * Пересчитывает агрегаты для всех клиентов
 * Используется для первоначальной миграции или исправления данных
 */
export const migrateAllClientAggregates = async (): Promise<void> => {
  try {
    console.log('Начинаем миграцию агрегатов клиентов...');

    // Получаем всех клиентов
    const clientsRef = collection(db, 'clients');
    const clientsSnapshot = await getDocs(clientsRef);

    console.log(`Найдено клиентов: ${clientsSnapshot.docs.length}`);

    let successCount = 0;
    let errorCount = 0;

    // Для каждого клиента находим его категорию и пересчитываем агрегаты
    for (const clientDoc of clientsSnapshot.docs) {
      try {
        const clientData = clientDoc.data();
        const clientId = clientDoc.id;
        const clientName = `${clientData.lastName || ''} ${clientData.firstName || ''}`.trim();
        const lastName = clientData.lastName || '';
        const firstName = clientData.firstName || '';
        const objectName = clientData.objectName || '';

        const categoriesRef = collection(db, 'categories');
        let categorySnapshot = null;
        let categoryId: string | null = null;

        // Вариант 1: Ищем по полному имени "Фамилия Имя"
        if (clientName) {
          const clientNameQuery = query(
            categoriesRef,
            where('title', '==', clientName),
            where('row', '==', 1)
          );
          categorySnapshot = await getDocs(clientNameQuery);
          if (!categorySnapshot.empty) {
            categoryId = categorySnapshot.docs[0].id;
          }
        }

        // Вариант 2: Ищем только по фамилии (если не нашли по полному имени)
        if (!categoryId && lastName) {
          const lastNameQuery = query(
            categoriesRef,
            where('title', '==', lastName),
            where('row', '==', 1)
          );
          categorySnapshot = await getDocs(lastNameQuery);
          if (!categorySnapshot.empty) {
            categoryId = categorySnapshot.docs[0].id;
          }
        }

        // Вариант 3: Ищем по названию объекта
        if (!categoryId && objectName) {
          const objectNameQuery = query(
            categoriesRef,
            where('title', '==', objectName),
            where('row', '==', 1)
          );
          categorySnapshot = await getDocs(objectNameQuery);
          if (!categorySnapshot.empty) {
            categoryId = categorySnapshot.docs[0].id;
          }
        }

        // Вариант 4: Ищем по objectName в поле objectName категории
        if (!categoryId && objectName) {
          const objectNameInCategoryQuery = query(
            categoriesRef,
            where('objectName', '==', objectName),
            where('row', '==', 1)
          );
          categorySnapshot = await getDocs(objectNameInCategoryQuery);
          if (!categorySnapshot.empty) {
            categoryId = categorySnapshot.docs[0].id;
          }
        }

        if (categoryId) {
          await recalculateClientAggregates(clientId, categoryId);
          successCount++;
          console.log(`✓ Агрегаты пересчитаны для клиента: ${clientName || lastName || objectName || clientId}`);
        } else {
          console.warn(`⚠ Категория не найдена для клиента: ${clientName || lastName || objectName || clientId} (ID: ${clientId})`);
          console.warn(`  Пробовали найти по: "${clientName}", "${lastName}", "${objectName}"`);
          errorCount++;
        }
      } catch (error) {
        console.error(`✗ Ошибка при пересчете агрегатов для клиента ${clientDoc.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n=== Результаты миграции ===');
    console.log(`✓ Успешно пересчитано: ${successCount}`);
    console.log(`⚠ Не найдено категорий: ${errorCount}`);
    console.log(`📊 Всего клиентов: ${clientsSnapshot.docs.length}`);
    console.log(`📈 Процент успеха: ${((successCount / clientsSnapshot.docs.length) * 100).toFixed(1)}%`);
    
    if (errorCount > 0) {
      console.log('\n💡 Совет: Для клиентов без категорий проверьте:');
      console.log('   1. Существует ли категория с row === 1 для этих клиентов');
      console.log('   2. Совпадает ли title категории с именем клиента или objectName');
    }
  } catch (error) {
    console.error('Критическая ошибка при миграции:', error);
    throw error;
  }
};

/**
 * Пересчитывает агрегаты для одного клиента
 */
export const migrateClientAggregates = async (clientId: string, categoryId: string): Promise<void> => {
  try {
    await recalculateClientAggregates(clientId, categoryId);
    console.log(`✓ Агрегаты пересчитаны для клиента: ${clientId}`);
  } catch (error) {
    console.error(`✗ Ошибка при пересчете агрегатов для клиента ${clientId}:`, error);
    throw error;
  }
};

