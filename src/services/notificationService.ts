import { addDoc, collection, query, where, orderBy, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notification } from '../types/chat';

interface NotificationData {
  title: string;
  message: string;
  type: 'inventory' | 'client' | 'payment' | 'estimate' | 'construction';
}

export const sendNotification = async (data: NotificationData) => {
  try {
    // Создаем уведомление
    await addDoc(collection(db, 'notifications'), {
      ...data,
      timestamp: serverTimestamp(),
      isRead: false,
      createdAt: serverTimestamp() // Добавляем дополнительное поле для сортировки
    });

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

export const subscribeToNotifications = (
  onUpdate: (notifications: Notification[]) => void,
  onError: (error: Error) => void
) => {
  try {
    // Используем createdAt вместо timestamp для сортировки
    const q = query(
      collection(db, 'notifications'),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q, 
      (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[];
        onUpdate(notifications);
      },
      (error) => {
        console.error('Error in notifications subscription:', error);
        onError(error);
      }
    );
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    onError(error);
    return () => {}; // Return empty unsubscribe function
  }
};

export const sendLowStockNotification = async (productName: string, quantity: number, unit: string) => {
  return sendNotification({
    title: 'Низкий остаток товара',
    message: `Товар "${productName}" требует пополнения. Текущий остаток: ${quantity} ${unit}`,
    type: 'inventory'
  });
};