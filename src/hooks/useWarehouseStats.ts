import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useWarehouseStats = () => {
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTotalValue = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'products'));
        const total = snapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          const quantity = data.quantity || 0;
          const price = data.averagePurchasePrice || 0;
          return sum + (quantity * price);
        }, 0);
        setTotalValue(total);
      } catch (error) {
        console.error('Error calculating total value:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTotalValue();
  }, []);

  return { totalValue, loading };
};