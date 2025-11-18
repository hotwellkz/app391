import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Client } from '../types/client';
import { getClientAggregates } from '../utils/clientAggregates';

export interface PaymentStats {
  paidAmount: number;
  remainingAmount: number;
  progress: number;
}

export const useClientPayments = (client: Client) => {
  const [stats, setStats] = useState<PaymentStats>({
    paidAmount: 0,
    remainingAmount: client.totalAmount,
    progress: 0
  });

  useEffect(() => {
    // Сначала пытаемся использовать предрасчитанные агрегаты
    const loadFromAggregates = async () => {
      try {
        const aggregates = await getClientAggregates(client.id);
        
        if (aggregates) {
          const remainingAmount = client.totalAmount - aggregates.paidAmount;
          const progress = client.totalAmount === 0 ? 0 : 
            Math.min(Math.round((aggregates.paidAmount / client.totalAmount) * 100), 100);

          setStats({
            paidAmount: aggregates.paidAmount,
            remainingAmount,
            progress
          });
          return true; // Успешно загрузили из агрегатов
        }
      } catch (error) {
        console.error('Error loading from aggregates:', error);
      }
      return false; // Агрегаты не найдены, используем fallback
    };

    // Подписка на изменения агрегатов в реальном времени
    const aggregatesRef = doc(db, 'clientAggregates', client.id);
    const unsubscribeAggregates = onSnapshot(
      aggregatesRef,
      (doc) => {
        if (doc.exists()) {
          const aggregates = doc.data();
          const remainingAmount = client.totalAmount - (aggregates.paidAmount || 0);
          const progress = client.totalAmount === 0 ? 0 : 
            Math.min(Math.round(((aggregates.paidAmount || 0) / client.totalAmount) * 100), 100);

          setStats({
            paidAmount: aggregates.paidAmount || 0,
            remainingAmount,
            progress
          });
        } else {
          // Если агрегаты отсутствуют, используем fallback (старый способ)
          loadFromAggregates().then(loaded => {
            if (!loaded) {
              // Fallback: загружаем все транзакции (старый способ)
              // Это происходит только если агрегаты не были созданы
              console.warn('Aggregates not found for client, using fallback');
            }
          });
        }
      },
      (error) => {
        console.error('Error subscribing to aggregates:', error);
        // При ошибке используем fallback
        loadFromAggregates();
      }
    );

    // Первоначальная загрузка
    loadFromAggregates();

    return () => {
      unsubscribeAggregates();
    };
  }, [client.id, client.totalAmount]);

  return stats;
};