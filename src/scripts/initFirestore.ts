import { db } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const initializeFirestore = async () => {
  try {
    // Создаем документ с операционным расходом
    await setDoc(doc(db, 'settings', 'operationalExpense'), {
      value: 1300000,
      updatedAt: new Date()
    });

    // Создаем документ с основной статистикой
    await setDoc(doc(db, 'stats', 'topStats'), {
      balance: '135.2M ₸',
      expenses: '160.2M ₸',
      planned: '0 ₸'
    });

    // Создаем категории
    const categories = [
      // Проекты (row: 3)
      {
        title: 'вап упавп',
        amount: '0 ₸',
        icon: 'Building2',
        color: 'bg-blue-500',
        row: 3
      }
      // ... остальные категории
    ];

    // Создаем примеры транзакций
    const transactions = [
      {
        categoryId: 'category1', // ID будет заменен на реальный после создания категории
        fromUser: 'Савицкий',
        toUser: 'Компания',
        amount: 30748.57,
        description: 'Оплата за проект KK1',
        date: '2024-03-20T10:30:00',
        type: 'income'
      },
      {
        categoryId: 'category2',
        fromUser: 'Компания',
        toUser: 'Саша',
        amount: 195486,
        description: 'Выплата зарплаты',
        date: '2024-03-19T15:45:00',
        type: 'expense'
      }
    ];

    // Сначала создаем категории и сохраняем их ID
    const categoriesRef = collection(db, 'categories');
    const categoryIds: { [key: string]: string } = {};
    
    for (let i = 0; i < categories.length; i++) {
      const docRef = doc(categoriesRef);
      await setDoc(docRef, categories[i]);
      categoryIds[`category${i + 1}`] = docRef.id;
    }

    // Затем создаем транзакции с правильными ID категорий
    const transactionsRef = collection(db, 'transactions');
    
    for (const transaction of transactions) {
      const categoryId = categoryIds[transaction.categoryId];
      if (categoryId) {
        await setDoc(doc(transactionsRef), {
          ...transaction,
          categoryId
        });
      }
    }

    console.log('База данных успешно инициализирована!');
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
  }
};

initializeFirestore();