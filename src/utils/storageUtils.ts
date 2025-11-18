import { ref, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../lib/firebase/config';
import { showErrorNotification, showSuccessNotification } from './notifications';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB в байтах

// Разрешаем все типы файлов
const ALLOWED_FILE_TYPES = null;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    console.log('Starting file upload:', { file, path });

    if (!file || !path) {
      const error = new Error('Файл и путь обязательны');
      console.error(error);
      showErrorNotification(error.message);
      throw error;
    }

    // Проверяем размер файла
    if (file.size > MAX_FILE_SIZE) {
      const error = new Error(`Размер файла не должен превышать ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      console.error(error);
      showErrorNotification(error.message);
      throw error;
    }

    // Создаем ссылку на файл в storage
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      try {
        console.log(`Upload attempt ${attempt + 1}/${MAX_RETRIES}`);
        
        const storageRef = ref(storage, path);
        console.log('Storage reference created:', storageRef);
        
        const metadata = {
          contentType: file.type,
          cacheControl: 'public,max-age=7200'
        };

        const uploadTask = uploadBytesResumable(storageRef, file, metadata);
        console.log('Upload task created');

        return new Promise((resolve, reject) => {
          let lastProgress = 0;
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              console.log(`Upload progress: ${progress}%`);
              if (onProgress && Math.abs(progress - lastProgress) >= 1) {
                lastProgress = progress;
                onProgress(progress);
              }
            },
            (error) => {
              console.error(`Upload error on attempt ${attempt + 1}:`, error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('Upload completed, download URL:', downloadURL);
                showSuccessNotification('Файл успешно загружен');
                resolve(downloadURL);
              } catch (error) {
                console.error('Error getting download URL:', error);
                reject(error);
              }
            }
          );
        });
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        if (attempt === MAX_RETRIES - 1) {
          throw error;
        }
        attempt++;
        console.log(`Waiting ${RETRY_DELAY}ms before next attempt`);
        await wait(RETRY_DELAY);
      }
    }

    throw new Error('Превышено максимальное количество попыток загрузки');
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error;
  }
};

export const deleteFile = async (path: string): Promise<void> => {
  try {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
    showSuccessNotification('Файл успешно удален');
  } catch (error) {
    console.error('Error deleting file:', error);
    showErrorNotification('Не удалось удалить файл');
    throw error;
  }
};

export const getFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};