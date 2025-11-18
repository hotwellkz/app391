import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useUnapprovedCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('isApproved', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, []);

  return count;
};
