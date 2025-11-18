import { collection, query, orderBy, onSnapshot, where, QueryConstraint, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Client } from '../types/client';

export const subscribeToClients = (
  onUpdate: (clients: Client[]) => void,
  onError: (error: Error) => void,
  filters?: {
    status?: 'building' | 'deposit' | 'built';
    year?: number;
  }
) => {
  try {
    // Проверяем существование индекса перед подпиской
    const testQuery = query(
      collection(db, 'clients'),
      where('status', '==', 'building'),
      orderBy('createdAt', 'asc')  // Changed from 'desc' to 'asc'
    );
    
    getDocs(testQuery).catch((error) => {
      if (error.code === 'failed-precondition') {
        console.error('Missing required index. Please create the index in Firebase Console.');
        throw error;
      }
    });

    const constraints: QueryConstraint[] = [orderBy('createdAt', 'asc')];  // Changed from 'desc' to 'asc'
    
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    if (filters?.year) {
      constraints.push(where('year', '==', filters.year));
    }

    const q = query(collection(db, 'clients'), ...constraints);

    return onSnapshot(
      q,
      (snapshot) => {
        const clients = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            isIconsVisible: typeof data.isIconsVisible === 'boolean' ? data.isIconsVisible : true,
            order: typeof data.order === 'number' ? data.order : 0
          };
        }) as Client[];
        
        const sortedClients = [...clients].sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          
          const aDate = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : a.createdAt;
          const bDate = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : b.createdAt;
          return aDate > bDate ? 1 : -1;
        });
        
        onUpdate(sortedClients);
      },
      (error) => {
        if (error.code === 'failed-precondition') {
          console.error('Missing required index. Please create the index in Firebase Console.');
        }
        onError(error as Error);
      }
    );
  } catch (error) {
    console.error('Error subscribing to clients:', error);
    onError(error as Error);
    return () => {}; // Return empty unsubscribe function
  }
};

export const getClients = async (filters?: {
  status?: 'building' | 'deposit' | 'built';
  year?: number;
}) => {
  try {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'asc')];
    
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    if (filters?.year) {
      constraints.push(where('year', '==', filters.year));
    }

    const q = query(collection(db, 'clients'), ...constraints);
    const snapshot = await getDocs(q);
    
    const clients = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        isIconsVisible: typeof data.isIconsVisible === 'boolean' ? data.isIconsVisible : true,
        order: typeof data.order === 'number' ? data.order : 0
      };
    }) as Client[];
    
    return [...clients].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      
      const aDate = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : a.createdAt;
      const bDate = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : b.createdAt;
      return aDate > bDate ? 1 : -1;
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

export const getClientByObjectName = async (objectName: string): Promise<Client | null> => {
  try {
    const clientsQuery = query(
      collection(db, 'clients'),
      where('objectName', '==', objectName)
    );
    
    const snapshot = await getDocs(clientsQuery);
    if (!snapshot.empty) {
      const clientData = {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as Client;
      return clientData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching client data:', error);
    return null;
  }
};

export const clientService = {
  async getAllClients(): Promise<Client[]> {
    const clientsRef = collection(db, 'clients');
    const snapshot = await getDocs(clientsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Client[];
  },

  async getClientById(id: string): Promise<Client | null> {
    const clientRef = doc(db, 'clients', id);
    const clientDoc = await getDoc(clientRef);
    
    if (!clientDoc.exists()) {
      return null;
    }

    return {
      id: clientDoc.id,
      ...clientDoc.data()
    } as Client;
  }
};