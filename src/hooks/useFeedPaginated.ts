/**
 * Хук для пагинированной загрузки ленты транзакций
 * По умолчанию загружает последние 60 дней
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, orderBy, where, limit, startAfter, onSnapshot, Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface FeedTransaction {
  id: string;
  fromUser: string;
  toUser: string;
  amount: number;
  description: string;
  date: {
    seconds: number;
    nanoseconds: number;
  } | Timestamp;
  type: 'income' | 'expense';
  categoryId: string;
  waybillId?: string;
  waybillType?: 'income' | 'expense';
  waybillNumber?: string;
  waybillData?: any;
}

interface UseFeedPaginatedOptions {
  defaultDays?: number; // Количество дней по умолчанию (60)
  pageSize?: number; // Размер страницы (50)
  enabled?: boolean; // Включена ли загрузка
}

interface UseFeedPaginatedReturn {
  transactions: FeedTransaction[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  totalCount: number;
}

export const useFeedPaginated = ({
  defaultDays = 60,
  pageSize = 50,
  enabled = true
}: UseFeedPaginatedOptions = {}): UseFeedPaginatedReturn => {
  const [transactions, setTransactions] = useState<FeedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Вычисляем дату начала по умолчанию
  const getDefaultStartDate = useCallback(() => {
    const date = new Date();
    date.setDate(date.getDate() - defaultDays);
    return Timestamp.fromDate(date);
  }, [defaultDays]);

  // Функция загрузки первой страницы
  const loadInitialData = useCallback(() => {
    if (!enabled) return;

    setLoading(true);
    setTransactions([]);
    setLastDoc(null);
    setHasMore(true);

    // Отписываемся от предыдущей подписки
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Используем только orderBy без where для избежания необходимости в композитном индексе
    // Фильтрация по типу и дате будет происходить на клиенте
    const q = query(
      collection(db, 'transactions'),
      orderBy('date', 'desc'),
      limit(pageSize * 2) // Берем больше, чтобы после фильтрации осталось достаточно
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const transactionsMap = new Map<string, FeedTransaction>();
          
          const startDate = getDefaultStartDate();
          const startDateSeconds = startDate.seconds;
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            
            // Фильтруем на клиенте: только expense и последние N дней
            const transactionDate = data.date instanceof Timestamp 
              ? data.date.seconds 
              : data.date.seconds;
            
            if (data.type !== 'expense' || transactionDate < startDateSeconds) {
              return; // Пропускаем
            }
            
            const transaction: FeedTransaction = {
              id: doc.id,
              fromUser: data.fromUser,
              toUser: data.toUser,
              amount: data.amount,
              description: data.description,
              date: data.date,
              type: data.type,
              categoryId: data.categoryId,
              waybillId: data.waybillId,
              waybillType: data.waybillType,
              waybillNumber: data.waybillNumber,
              waybillData: data.waybillData
            };
            
            // Убираем дубликаты
            const key = `${data.fromUser}-${data.toUser}-${data.amount}-${transactionDate}-${data.description}`;
            if (!transactionsMap.has(key)) {
              transactionsMap.set(key, transaction);
            }
          });

          const sortedTransactions = Array.from(transactionsMap.values())
            .sort((a, b) => {
              const aSeconds = a.date instanceof Timestamp ? a.date.seconds : a.date.seconds;
              const bSeconds = b.date instanceof Timestamp ? b.date.seconds : b.date.seconds;
              return bSeconds - aSeconds;
            })
            .slice(0, pageSize); // Берем только нужное количество

          setTransactions(sortedTransactions);
          setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
          setHasMore(snapshot.docs.length === pageSize);
          setTotalCount(sortedTransactions.length);
          setLoading(false);
        } catch (error) {
          console.error('Error processing transactions:', error);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching transactions:', error);
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, [enabled, pageSize, getDefaultStartDate]);

  // Функция загрузки следующей страницы
  const loadMore = useCallback(() => {
    if (!hasMore || loading || !lastDoc || !enabled) return;

    setLoading(true);

    const q = query(
      collection(db, 'transactions'),
      orderBy('date', 'desc'),
      startAfter(lastDoc),
      limit(pageSize * 2) // Берем больше для фильтрации
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const newTransactionsMap = new Map<string, FeedTransaction>();
          
          const startDate = getDefaultStartDate();
          const startDateSeconds = startDate.seconds;
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            
            // Фильтруем на клиенте
            const transactionDate = data.date instanceof Timestamp 
              ? data.date.seconds 
              : data.date.seconds;
            
            if (data.type !== 'expense' || transactionDate < startDateSeconds) {
              return;
            }
            
            const transaction: FeedTransaction = {
              id: doc.id,
              fromUser: data.fromUser,
              toUser: data.toUser,
              amount: data.amount,
              description: data.description,
              date: data.date,
              type: data.type,
              categoryId: data.categoryId,
              waybillId: data.waybillId,
              waybillType: data.waybillType,
              waybillNumber: data.waybillNumber,
              waybillData: data.waybillData
            };
            
            const key = `${data.fromUser}-${data.toUser}-${data.amount}-${transactionDate}-${data.description}`;
            if (!newTransactionsMap.has(key)) {
              newTransactionsMap.set(key, transaction);
            }
          });

          const newTransactions = Array.from(newTransactionsMap.values())
            .sort((a, b) => {
              const aSeconds = a.date instanceof Timestamp ? a.date.seconds : a.date.seconds;
              const bSeconds = b.date instanceof Timestamp ? b.date.seconds : b.date.seconds;
              return bSeconds - aSeconds;
            })
            .slice(0, pageSize);

          if (newTransactions.length > 0) {
            setTransactions(prev => {
              const combined = [...prev, ...newTransactions];
              // Убираем дубликаты по ID
              const unique = combined.filter((t, index, self) => 
                index === self.findIndex(tr => tr.id === t.id)
              );
              return unique;
            });
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(newTransactions.length === pageSize);
            setTotalCount(prev => prev + newTransactions.length);
          } else {
            setHasMore(false);
          }

          setLoading(false);
        } catch (error) {
          console.error('Error processing more transactions:', error);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching more transactions:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [pageSize, lastDoc, hasMore, loading, enabled, getDefaultStartDate]);

  // Функция обновления данных
  const refresh = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Загружаем данные при монтировании
  useEffect(() => {
    return loadInitialData();
  }, [loadInitialData]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    transactions,
    loading,
    hasMore,
    loadMore,
    refresh,
    totalCount
  };
};

