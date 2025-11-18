import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../lib/firebase/auth';
import { db } from '../lib/firebase';

export const useIsApproved = () => {
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setIsApproved(userDoc.data().isApproved);
          } else {
            setIsApproved(false);
          }
        } catch (error) {
          console.error('Error checking user approval status:', error);
          setIsApproved(false);
        }
      } else {
        setIsApproved(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { isApproved, loading };
};
