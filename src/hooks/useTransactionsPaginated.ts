import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction } from '../components/transactions/types';

interface UseTransactionsPaginatedProps {
  categoryId: string;
  pageSize?: number;
  enabled?: boolean;
}

interface UseTransactionsPaginatedReturn {
  transactions: Transaction[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  totalAmount: number;
  salaryTotal: number;
  cashlessTotal: number;
}

export const useTransactionsPaginated = ({
  categoryId,
  pageSize = 50,
  enabled = true
}: UseTransactionsPaginatedProps): UseTransactionsPaginatedReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Мемоизируем вычисления сумм
  const { totalAmount, salaryTotal, cashlessTotal } = useMemo(() => {
    const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const salarySum = transactions.reduce((sum, t) => 
      t.isSalary ? sum + Math.abs(t.amount) : sum, 0
    );
    const cashlessSum = transactions.reduce((sum, t) => 
      t.isCashless ? sum + Math.abs(t.amount) : sum, 0
    );
    
    return { totalAmount: total, salaryTotal: salarySum, cashlessTotal: cashlessSum };
  }, [transactions]);

  // Функция загрузки первой страницы
  const loadInitialData = useCallback(() => {
    if (!enabled || !categoryId) return;

    setLoading(true);
    setTransactions([]);
    setLastDoc(null);
    setHasMore(true);

    const q = query(
      collection(db, 'transactions'),
      where('categoryId', '==', categoryId),
      orderBy('date', 'desc'),
      limit(pageSize)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];

      setTransactions(transactionsData);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);
      setLoading(false);
    });

    return unsubscribe;
  }, [categoryId, pageSize, enabled]);

  // Функция загрузки следующей страницы
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !lastDoc) return;

    setLoading(true);

    const q = query(
      collection(db, 'transactions'),
      where('categoryId', '==', categoryId),
      orderBy('date', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newTransactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];

      if (newTransactions.length > 0) {
        setTransactions(prev => [...prev, ...newTransactions]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(newTransactions.length === pageSize);
      } else {
        setHasMore(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [categoryId, pageSize, lastDoc, hasMore, loading]);

  // Загружаем данные при изменении categoryId
  useEffect(() => {
    return loadInitialData();
  }, [loadInitialData]);

  return {
    transactions,
    loading,
    hasMore,
    loadMore,
    totalAmount,
    salaryTotal,
    cashlessTotal
  };
}; 