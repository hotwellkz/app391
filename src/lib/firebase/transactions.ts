import { collection, doc, runTransaction, serverTimestamp, query, where, getDocs, writeBatch, getDoc, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { CategoryCardType } from '../../types';
import { formatAmount, parseAmount } from './categories';
import { sendTelegramNotification, formatTransactionMessage } from '../../services/telegramService';
import { Transaction } from '../../components/transactions/types';
import { deleteFileFromSupabase } from '../../utils/supabaseStorageUtils';
import { updateClientAggregatesOnTransaction, updateClientAggregatesOnDelete } from '../../utils/clientAggregates';

interface TransactionPhoto {
  name: string;
  url: string;
  type: string;
  size: number;
  path: string;
}

interface TransferOptions {
  isSalary?: boolean;
  isCashless?: boolean;
  waybillNumber?: string;
  waybillData?: Transaction['waybillData'];
}

export const transferFunds = async ({
  sourceCategory,
  targetCategory,
  amount,
  description,
  attachments = [],
  waybillNumber,
  waybillData,
  isSalary,
  isCashless
}: {
  sourceCategory: CategoryCardType;
  targetCategory: CategoryCardType;
  amount: number;
  description: string;
  attachments?: TransactionPhoto[];
  waybillNumber?: string;
  waybillData?: Transaction['waybillData'];
  isSalary?: boolean;
  isCashless?: boolean;
}): Promise<void> => {
  if (!amount || amount <= 0) {
    throw new Error('Сумма перевода должна быть больше нуля');
  }

  if (!description.trim()) {
    throw new Error('Необходимо указать комментарий к переводу');
  }

  try {
    await runTransaction(db, async (transaction) => {
      const sourceRef = doc(db, 'categories', sourceCategory.id);
      const targetRef = doc(db, 'categories', targetCategory.id);
      
      const sourceDoc = await transaction.get(sourceRef);
      const targetDoc = await transaction.get(targetRef);

      if (!sourceDoc.exists()) {
        throw new Error('Категория отправителя не найдена');
      }

      if (!targetDoc.exists()) {
        throw new Error('Категория получателя не найдена');
      }

      const sourceBalance = parseAmount(sourceDoc.data().amount);
      const targetBalance = parseAmount(targetDoc.data().amount);

      // Создаем ID для транзакции заранее
      const withdrawalId = doc(collection(db, 'transactions')).id;
      const depositId = doc(collection(db, 'transactions')).id;

      const timestamp = serverTimestamp();
      
      // Данные для снятия средств
      const withdrawalData = {
        categoryId: sourceCategory.id,
        fromUser: sourceCategory.title,
        toUser: targetCategory.title,
        amount: -amount,
        description,
        type: 'expense',
        date: timestamp,
        relatedTransactionId: depositId,
        attachments,
        waybillNumber,
        waybillData,
        isSalary,
        isCashless
      };

      // Данные для пополнения средств
      const depositData = {
        ...withdrawalData,
        categoryId: targetCategory.id,
        amount: amount,
        type: 'income',
        relatedTransactionId: withdrawalId,
      };
      
      transaction.set(doc(db, 'transactions', withdrawalId), withdrawalData);
      transaction.set(doc(db, 'transactions', depositId), depositData);

      transaction.update(sourceRef, {
        amount: formatAmount(sourceBalance - amount)
      });

      transaction.update(targetRef, {
        amount: formatAmount(targetBalance + amount)
      });

      // Отправляем уведомление в Telegram
      const message = formatTransactionMessage(
        sourceCategory.title,
        targetCategory.title,
        amount,
        description,
        'expense',
        waybillNumber
      );
      await sendTelegramNotification(message);
    });

    // Обновляем агрегаты для клиентов (если транзакция связана с клиентом)
    // Используем текущую дату для агрегатов
    const transactionDate = Timestamp.now();
    
    // Обновляем агрегаты для sourceCategory (расход)
    try {
      await updateClientAggregatesOnTransaction(
        sourceCategory.id,
        -amount, // Отрицательная сумма для расхода
        transactionDate
      );
    } catch (error) {
      console.error('Error updating client aggregates for source:', error);
      // Не прерываем выполнение, если обновление агрегатов не удалось
    }

    // Обновляем агрегаты для targetCategory (приход)
    try {
      await updateClientAggregatesOnTransaction(
        targetCategory.id,
        amount, // Положительная сумма для прихода
        transactionDate
      );
    } catch (error) {
      console.error('Error updating client aggregates for target:', error);
      // Не прерываем выполнение, если обновление агрегатов не удалось
    }
  } catch (error) {
    console.error('Error in transferFunds:', error);
    throw error;
  }
};

export const deleteTransaction = async (transactionId: string, userId: string): Promise<void> => {
  if (!transactionId) {
    throw new Error('ID транзакции обязателен');
  }

  if (!userId) {
    throw new Error('ID пользователя обязателен');
  }

  try {
    // Проверяем роль пользователя
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('Пользователь не найден');
    }

    const userRole = userDoc.data().role;
    if (userRole !== 'admin') {
      throw new Error('Только администратор может удалять транзакции');
    }

    const batch = writeBatch(db);
    const transactionRef = doc(db, 'transactions', transactionId);
    const transactionSnap = await getDoc(transactionRef);

    if (!transactionSnap.exists()) {
      throw new Error('Транзакция не найдена');
    }

    const transactionData = transactionSnap.data();
    const relatedTransactionId = transactionData.relatedTransactionId;
    const categoryId = transactionData.categoryId;
    const amount = Number(transactionData.amount);

    // Удаляем прикрепленные файлы из Supabase
    if (transactionData.attachments && transactionData.attachments.length > 0) {
      for (const attachment of transactionData.attachments) {
        try {
          await deleteFileFromSupabase(attachment.path);
        } catch (error) {
          console.error('Error deleting file from Supabase:', error);
          // Продолжаем удаление других файлов даже если один не удалился
        }
      }
    }

    batch.delete(transactionRef);

    // Обновляем агрегаты для клиента перед удалением транзакции
    try {
      await updateClientAggregatesOnDelete(categoryId, amount);
    } catch (error) {
      console.error('Error updating client aggregates on delete:', error);
      // Не прерываем выполнение, если обновление агрегатов не удалось
    }

    // Получаем текущий баланс категории
    const categoryRef = doc(db, 'categories', categoryId);
    const categorySnap = await getDoc(categoryRef);

    if (categorySnap.exists()) {
      const currentAmount = parseAmount(categorySnap.data().amount);
      // При удалении:
      // Для расхода (amount отрицательный) - прибавляем модуль суммы
      // Для дохода (amount положительный) - вычитаем сумму
      const newAmount = currentAmount + (amount * -1);

      batch.update(categoryRef, {
        amount: formatAmount(newAmount),
        updatedAt: serverTimestamp()
      });
    }

    // Ищем связанные транзакции двумя способами:
    // 1. Транзакции, на которые ссылается текущая
    // 2. Транзакции, которые ссылаются на текущую
    let relatedTransaction = null;

    // 1. Проверяем транзакцию, на которую ссылается текущая
    if (relatedTransactionId) {
      const relatedRef = doc(db, 'transactions', relatedTransactionId);
      const relatedSnap = await getDoc(relatedRef);
      if (relatedSnap.exists()) {
        relatedTransaction = { ...relatedSnap.data(), id: relatedSnap.id };
      }
    }

    // 2. Ищем транзакции, которые ссылаются на текущую
    if (!relatedTransaction) {
      const relatedQuery = query(
        collection(db, 'transactions'),
        where('relatedTransactionId', '==', transactionId)
      );
      const relatedQuerySnap = await getDocs(relatedQuery);
      if (!relatedQuerySnap.empty) {
        const doc = relatedQuerySnap.docs[0];
        relatedTransaction = { ...doc.data(), id: doc.id };
      }
    }

    // Если нашли связанную транзакцию, удаляем её и обновляем баланс её категории
    if (relatedTransaction) {
      const relatedRef = doc(db, 'transactions', relatedTransaction.id);

      // Удаляем прикрепленные файлы связанной транзакции
      if (relatedTransaction.attachments && relatedTransaction.attachments.length > 0) {
        for (const attachment of relatedTransaction.attachments) {
          try {
            await deleteFileFromSupabase(attachment.path);
          } catch (error) {
            console.error('Error deleting related transaction file from Supabase:', error);
            // Продолжаем удаление других файлов даже если один не удалился
          }
        }
      }

      batch.delete(relatedRef);

      // Обновляем агрегаты для клиента связанной транзакции
      try {
        await updateClientAggregatesOnDelete(
          relatedTransaction.categoryId,
          relatedTransaction.amount
        );
      } catch (error) {
        console.error('Error updating client aggregates for related transaction:', error);
      }

      const relatedCategoryRef = doc(db, 'categories', relatedTransaction.categoryId);
      const relatedCategorySnap = await getDoc(relatedCategoryRef);

      if (relatedCategorySnap.exists()) {
        const currentAmount = parseAmount(relatedCategorySnap.data().amount);
        const relatedAmount = Number(relatedTransaction.amount);
        const newAmount = currentAmount + (relatedAmount * -1);

        batch.update(relatedCategoryRef, {
          amount: formatAmount(newAmount),
          updatedAt: serverTimestamp()
        });
      }
    }

    await batch.commit();
  } catch (error) {
    console.error('Error in deleteTransaction:', error);
    throw error;
  }
};