```typescript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CategoryData } from '../types';

export const addCategory = async (categoryData: CategoryData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'categories'), {
      ...categoryData,
      amount: '0 ₸',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw new Error('Не удалось создать категорию. Пожалуйста, попробуйте снова.');
  }
};
```