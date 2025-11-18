// API Configuration
// Автоматическое определение backend URL
const getBackendUrl = (): string => {
  // В development используем localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  
  // В production используем HTTPS для безопасности (Mixed Content Fix)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 
                     import.meta.env.VITE_API_URL ||
                     'https://7608-35-194-39-8.ngrok-free.app'; // Updated: NEW ngrok URL
  
  return backendUrl;
};

export const API_CONFIG = {
  BASE_URL: getBackendUrl(),
  ENDPOINTS: {
    health: '/health',
    whatsapp: {
      status: '/whatsapp/status',
      logout: '/whatsapp/logout',
    },
    chats: '/chats',
    chat: '/chat',
    contacts: '/contacts',
    readStatus: '/read-status',
  },
} as const;

// Socket.IO Configuration  
export const SOCKET_CONFIG = {
  url: getBackendUrl(),
  options: {
    transports: ['websocket', 'polling'],
    cors: {
      origin: window.location.origin,
      methods: ['GET', 'POST']
    },
    // Увеличиваем таймауты для стабильности
    timeout: 10000,
    reconnectionDelay: 2000,
    reconnectionAttempts: 5,
  }
} as const;

// Для отладки - показываем текущий URL
console.log('🔗 Backend URL:', API_CONFIG.BASE_URL);
console.log('🔌 Socket URL:', SOCKET_CONFIG.url); 