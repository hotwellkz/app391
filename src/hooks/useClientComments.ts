import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Comment } from '../types/comment';

export const useClientComments = (clientId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Функция для загрузки комментариев
  const loadComments = async () => {
    try {
      console.log('Loading comments for client:', clientId);
      const q = query(
        collection(db, 'comments'),
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const loadedComments = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          clientId: data.clientId,
          text: data.text,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as Comment;
      });

      console.log('Loaded comments:', loadedComments);
      setComments(loadedComments);
      setLoading(false);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError(err as Error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!clientId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Загружаем комментарии сразу
    loadComments();

    // Подписываемся на изменения
    const q = query(
      collection(db, 'comments'),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const updatedComments = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            clientId: data.clientId,
            text: data.text,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          } as Comment;
        });

        console.log('Comments updated:', updatedComments);
        setComments(updatedComments);
        setLoading(false);
      },
      (err) => {
        console.error('Error in snapshot listener:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clientId]);

  return { comments, loading, error };
};
