import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingEnvVars = REQUIRED_ENV_VARS.filter(varName => !import.meta.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required Firebase environment variables:', missingEnvVars);
}

const decodeApiKey = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    if (typeof globalThis.atob === 'function') {
      return globalThis.atob(value);
    }

    const globalWithBuffer = globalThis as typeof globalThis & {
      Buffer?: { from: (input: string, encoding: string) => { toString: (enc: string) => string } };
    };

    if (globalWithBuffer.Buffer) {
      return globalWithBuffer.Buffer.from(value, 'base64').toString('utf-8');
    }
  } catch (error) {
    console.warn('Unable to decode base64 Firebase API key, falling back to raw value.', error);
    return value;
  }

  return value;
};

const firebaseApiKey =
  decodeApiKey(import.meta.env.VITE_FIREBASE_API_KEY_BASE64) ??
  import.meta.env.VITE_FIREBASE_API_KEY;

if (!firebaseApiKey) {
  console.error(
    'Firebase API ключ не найден. Установите VITE_FIREBASE_API_KEY_BASE64 (предпочтительно) или VITE_FIREBASE_API_KEY.'
  );
}

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log('Firebase config:', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId
});

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export { getStorage, ref, uploadBytesResumable, getDownloadURL };