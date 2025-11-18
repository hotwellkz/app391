import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { app } from './config';
import { db } from './config';

export const auth = getAuth(app);

export const registerUser = async (email: string, password: string, displayName: string) => {
  try {
    console.log('Начинаем процесс регистрации для:', email);
    
    // Проверяем инициализацию Firebase
    if (!auth) {
      console.error('Firebase Auth не инициализирован');
      throw new Error('Ошибка инициализации Firebase');
    }

    // Создаем пользователя
    console.log('Создаем пользователя в Firebase Auth...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Пользователь успешно создан в Firebase Auth:', userCredential.user.uid);
    
    // Создаем запись в Firestore
    console.log('Создаем запись пользователя в Firestore...');
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      displayName,
      role: 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Запись в Firestore успешно создана');

    // Обновляем профиль
    console.log('Обновляем displayName пользователя...');
    await updateProfile(userCredential.user, { displayName });
    console.log('Профиль пользователя успешно обновлен');

    return userCredential.user;
  } catch (error: any) {
    console.error('Ошибка при регистрации:', error.code, error.message);
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('Этот email уже используется');
      case 'auth/invalid-email':
        throw new Error('Некорректный email');
      case 'auth/weak-password':
        throw new Error('Слишком простой пароль');
      case 'auth/operation-not-allowed':
        console.error('Email/Password регистрация не включена в Firebase Console');
        throw new Error('Регистрация временно недоступна');
      default:
        throw new Error(`Ошибка при регистрации: ${error.message}`);
    }
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    console.log('Начинаем процесс входа для:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Успешная аутентификация, получен userCredential:', userCredential.user.uid);
    
    // Получаем дополнительные данные пользователя из Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    console.log('Получены данные пользователя из Firestore:', userDoc.exists() ? 'существует' : 'не существует');
    
    if (!userDoc.exists()) {
      console.error('Данные пользователя не найдены в Firestore');
      throw new Error('Данные пользователя не найдены');
    }
    
    console.log('Успешный вход в систему');
    return userCredential.user;
  } catch (error: any) {
    console.error('Ошибка при входе:', error.code, error.message);
    switch (error.code) {
      case 'auth/invalid-email':
        throw new Error('Некорректный email');
      case 'auth/user-disabled':
        throw new Error('Аккаунт заблокирован');
      case 'auth/user-not-found':
        throw new Error('Пользователь не найден');
      case 'auth/wrong-password':
        throw new Error('Неверный пароль');
      default:
        throw new Error(`Ошибка при входе: ${error.message}`);
    }
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error('Ошибка при выходе из системы');
  }
};

// Функция для проверки роли пользователя
export const getUserRole = async (uid: string): Promise<string> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      return 'user';
    }
    return userDoc.data().role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
};

// Функция для получения всех пользователей
export const getAllUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};