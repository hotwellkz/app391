import { supabase } from './config';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';

// Функция для анонимной аутентификации
export const signInAnonymously = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error('Error signing in anonymously:', error);
      showErrorNotification('Ошибка аутентификации');
      throw error;
    }

    if (session) {
      console.log('Anonymous session created:', session);
      return session;
    }
  } catch (error) {
    console.error('Error in signInAnonymously:', error);
    throw error;
  }
};

// Функция для проверки текущей сессии
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      throw error;
    }

    return session;
  } catch (error) {
    console.error('Error in getCurrentSession:', error);
    throw error;
  }
};
