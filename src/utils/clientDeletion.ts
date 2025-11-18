import { writeBatch, collection, query, where, getDocs, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { deleteClientContracts } from '../lib/firebase';
import { Client } from '../types/client';

export const deleteClientWithHistory = async (client: Client) => {
  const batch = writeBatch(db);

  // 1. Delete the client
  const clientRef = doc(db, 'clients', client.id);
  batch.delete(clientRef);

  // 2. Find all associated categories
  const [projectsQuery, clientsQuery] = [
    query(
      collection(db, 'categories'),
      where('title', '==', client.objectName),
      where('row', '==', 3)
    ),
    query(
      collection(db, 'categories'),
      where('title', '==', client.objectName),
      where('row', '==', 1)
    )
  ];
  
  const [projectsSnapshot, clientsSnapshot] = await Promise.all([
    getDocs(projectsQuery),
    getDocs(clientsQuery)
  ]);

  // Get category IDs for finding transactions
  const categoryIds = [...projectsSnapshot.docs, ...clientsSnapshot.docs].map(doc => doc.id);

  // 3. Delete all categories
  [...projectsSnapshot.docs, ...clientsSnapshot.docs].forEach(doc => {
    batch.delete(doc.ref);
  });

  // 4. Find and delete all related transactions
  for (const categoryId of categoryIds) {
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('categoryId', '==', categoryId)
    );
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    transactionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 5. Find and delete all related transactions where this category is mentioned
    const relatedTransactionsQuery = query(
      collection(db, 'transactions'),
      where('fromUser', '==', client.objectName)
    );
    
    const relatedTransactionsSnapshot = await getDocs(relatedTransactionsQuery);
    relatedTransactionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    const toUserTransactionsQuery = query(
      collection(db, 'transactions'),
      where('toUser', '==', client.objectName)
    );
    
    const toUserTransactionsSnapshot = await getDocs(toUserTransactionsQuery);
    toUserTransactionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
  }

  // 6. Delete contracts
  await deleteClientContracts(client.id);

  // 7. Commit all changes
  await batch.commit();
};

export const deleteClientIconOnly = async (client: Client) => {
  const batch = writeBatch(db);

  // 1. Delete the client
  const clientRef = doc(db, 'clients', client.id);
  batch.delete(clientRef);

  // 2. Find and delete all associated categories
  const [projectsQuery, clientsQuery] = [
    query(
      collection(db, 'categories'),
      where('title', '==', client.objectName),
      where('row', '==', 3)
    ),
    query(
      collection(db, 'categories'),
      where('title', '==', client.objectName),
      where('row', '==', 1)
    )
  ];
  
  const [projectsSnapshot, clientsSnapshot] = await Promise.all([
    getDocs(projectsQuery),
    getDocs(clientsQuery)
  ]);
  
  // 3. Delete all categories
  [...projectsSnapshot.docs, ...clientsSnapshot.docs].forEach(doc => {
    batch.delete(doc.ref);
  });

  // 4. Delete contracts
  await deleteClientContracts(client.id);

  // 5. Commit all changes
  await batch.commit();
};