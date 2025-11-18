import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY');
}

// Создаем и экспортируем клиент Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  storage: {
    credentials: {
      accessKeyId: 'e569854e5c82ca170166e4da3c83c814',
      secretAccessKey: '2bc2f261184d72daf859dd24119416144d4ce27909dacd6f192e4f6eb9a044e4'
    }
  }
});

// Константы для работы с хранилищем
export const STORAGE_BUCKET = 'transactions';
export const CLIENTS_BUCKET = 'clients';
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Типы для работы с файлами
export interface FileUploadResponse {
  path: string;
  url: string;
  name: string;
  size: number;
  type: string;
}
