import { collection, query, orderBy, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Project } from '../types/project';

export const subscribeToProjects = (
  onUpdate: (projects: Project[]) => void,
  onError: (error: Error) => void,
  filters?: {
    year?: number;
    status?: 'all' | 'deposit' | 'building' | 'built';
  }
) => {
  try {
    // Проверяем существование индекса перед подпиской
    const testQuery = query(
      collection(db, 'clients'),
      where('status', '==', 'building'),
      orderBy('createdAt', 'desc')
    );
    
    getDocs(testQuery).catch((error) => {
      if (error.code === 'failed-precondition') {
        console.error('Missing required index. Please create the index in Firebase Console.');
        throw error;
      }
    });

    const constraints = [orderBy('createdAt', 'desc')];
    
    if (filters?.status && filters.status !== 'all') {
      constraints.push(where('status', '==', filters.status));
    }
    
    if (filters?.year) {
      constraints.push(where('year', '==', filters.year));
    }

    const q = query(collection(db, 'clients'), ...constraints);

    return onSnapshot(
      q,
      (snapshot) => {
        const projects = snapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate() || new Date();
          const constructionDays = data.constructionDays || 45;
          const deadline = new Date(createdAt);
          deadline.setDate(deadline.getDate() + constructionDays);

          return {
            id: doc.id,
            clientName: `${data.lastName} ${data.firstName}`,
            status: data.status,
            progress: calculateProgress(data.status, createdAt, constructionDays),
            budget: data.totalAmount || 0,
            deadline,
            createdAt,
            constructionDays,
            year: data.year || new Date().getFullYear(),
            photos: data.photos || [],
            address: data.constructionAddress || ''
          };
        });
        onUpdate(projects);
      },
      (error) => {
        if (error.code === 'failed-precondition') {
          console.error('Missing required index. Please create the index in Firebase Console.');
        }
        onError(error);
      }
    );
  } catch (error) {
    console.error('Error subscribing to projects:', error);
    onError(error);
    return () => {}; // Return empty unsubscribe function
  }
};

const calculateProgress = (status: string, startDate: Date, days: number): number => {
  if (status !== 'building') return 0;
  
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max((elapsed / days) * 100, 0), 100);
};