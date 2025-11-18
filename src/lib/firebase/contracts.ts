import { collection, addDoc, query, where, getDocs, writeBatch, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from './config';

export const addContract = async (contractData: any) => {
  try {
    // Проверяем наличие сохраненных смет
    const collections = [
      'foundationEstimates',
      'sipWallsEstimates',
      'floorEstimates',
      'roofEstimates',
      'partitionEstimates',
      'consumablesEstimates',
      'additionalWorksEstimates'
    ];

    let hasSavedEstimates = false;

    for (const collectionName of collections) {
      const docRef = doc(db, collectionName, contractData.clientId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        hasSavedEstimates = true;
        break;
      }
    }

    if (!hasSavedEstimates) {
      throw new Error('Не удалось создать договор. Пожалуйста, убедитесь, что все сметы сохранены.');
    }

    const docRef = await addDoc(collection(db, 'contracts'), {
      ...contractData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding contract:', error);
    throw error;
  }
};

export const deleteClientContracts = async (clientId: string) => {
  try {
    const q = query(collection(db, 'contracts'), where('clientId', '==', clientId));
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error deleting client contracts:', error);
    throw error;
  }
};