import { collection, query, where, orderBy, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Comment, NewComment } from '../types/comment';

// Создание нового комментария
export const createComment = async (clientId: string, comment: NewComment): Promise<void> => {
  try {
    console.log('Creating comment with data:', { clientId, comment }); // Отладочный вывод

    const commentData = {
      clientId,
      text: comment.text,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('Formatted comment data:', commentData); // Отладочный вывод

    const docRef = await addDoc(collection(db, 'comments'), commentData);
    console.log('Comment created with ID:', docRef.id); // Отладочный вывод
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

// Обновление комментария
export const updateComment = async (commentId: string, text: string): Promise<void> => {
  try {
    console.log('Updating comment:', { commentId, text }); // Отладочный вывод
    const commentRef = doc(db, 'comments', commentId);
    await updateDoc(commentRef, {
      text,
      updatedAt: serverTimestamp(),
    });
    console.log('Comment updated successfully'); // Отладочный вывод
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

// Удаление комментария
export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const commentRef = doc(db, 'comments', commentId);
    await deleteDoc(commentRef);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Получение комментариев для клиента
export const getClientComments = async (clientId: string): Promise<Comment[]> => {
  try {
    console.log('Fetching comments for client:', clientId); // Отладочный вывод
    const q = query(
      collection(db, 'comments'),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[];
    
    console.log('Fetched comments:', comments); // Отладочный вывод
    return comments;
  } catch (error) {
    console.error('Error getting client comments:', error);
    throw error;
  }
};
