import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const clearChatHistory = async () => {
  try {
    const batch = writeBatch(db);
    
    // Get all messages
    const messagesQuery = query(collection(db, 'messages'));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    // Delete all messages
    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Get all chat notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('type', '==', 'chat')
    );
    const notificationsSnapshot = await getDocs(notificationsQuery);
    
    // Delete all chat notifications
    notificationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Commit all deletions in one batch
    await batch.commit();
    
    return true;
  } catch (error) {
    console.error('Error clearing chat history:', error);
    throw new Error('Failed to clear chat history');
  }
};