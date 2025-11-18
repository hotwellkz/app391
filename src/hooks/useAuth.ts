import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface User {
  uid: string;
  email: string | null;
  role?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email);
      
      if (firebaseUser) {
        // Получаем дополнительные данные пользователя из Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        console.log('User data from Firestore:', userData);
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: userData?.role || 'user'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  return {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
    canEdit: user?.role === 'admin' || user?.role === 'employee',
    isAuthenticated: !!user
  };
};
