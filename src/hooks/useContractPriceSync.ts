import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useContractPriceSync = (clientId: string, onContractPriceChange: (price: number) => void) => {
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'estimates', clientId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const contractPrice = data.roofValues?.contractPrice?.value || 0;
        onContractPriceChange(contractPrice);
      }
    });

    return () => unsubscribe();
  }, [clientId, onContractPriceChange]);
}; 