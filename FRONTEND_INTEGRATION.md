# 🔗 Frontend Integration для Production

## 🎯 Интеграция https://2wix.ru/ с WhatsApp сервером на VM

### 📋 Что нужно изменить в коде фронтенда

#### 1. API Base URL

**Найдите в коде фронтенда:**
```javascript
// Обычно в файлах:
// - src/config/api.js
// - src/constants/endpoints.js  
// - src/services/api.js
// - или в .env файлах фронтенда

const API_BASE_URL = 'http://localhost:3000';
const SOCKET_URL = 'http://localhost:3000';
```

**Замените на:**
```javascript
// Если у вас есть поддомен для API
const API_BASE_URL = 'https://api.2wix.ru';
const SOCKET_URL = 'https://api.2wix.ru';

// Или используйте IP VM
const API_BASE_URL = 'http://YOUR_VM_IP:3000';
const SOCKET_URL = 'http://YOUR_VM_IP:3000';

// Или используйте переменные окружения
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://YOUR_VM_IP:3000';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://YOUR_VM_IP:3000';
```

#### 2. Environment Variables

**Создайте `.env.production` в фронтенде:**
```env
REACT_APP_API_URL=http://YOUR_VM_IP:3000
REACT_APP_SOCKET_URL=http://YOUR_VM_IP:3000
REACT_APP_WS_URL=ws://YOUR_VM_IP:3000
```

**Или для поддомена:**
```env
REACT_APP_API_URL=https://api.2wix.ru
REACT_APP_SOCKET_URL=https://api.2wix.ru
REACT_APP_WS_URL=wss://api.2wix.ru
```

#### 3. Socket.IO Configuration

**Если используете Socket.IO:**
```javascript
// Было
const socket = io('http://localhost:3000');

// Стало
const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://YOUR_VM_IP:3000', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});
```

#### 4. Axios/Fetch Configuration

**Настройка CORS для запросов:**
```javascript
// Axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://YOUR_VM_IP:3000';
axios.defaults.withCredentials = true;

// Fetch
const fetchOptions = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://2wix.ru'
  }
};
```

### 🔧 Примеры конфигурации

#### React App с Environment Variables

**`.env.production`:**
```env
REACT_APP_API_BASE_URL=http://YOUR_VM_IP:3000
REACT_APP_SOCKET_URL=http://YOUR_VM_IP:3000
```

**`src/config/api.js`:**
```javascript
export const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000',
  socketURL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000',
  timeout: 10000,
  withCredentials: true
};
```

#### Vue.js App

**`.env.production`:**
```env
VUE_APP_API_URL=http://YOUR_VM_IP:3000
VUE_APP_SOCKET_URL=http://YOUR_VM_IP:3000
```

**`src/api/index.js`:**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000',
  withCredentials: true,
  timeout: 10000
});

export default api;
```

### 🛠️ Специфичные файлы для проверки

#### Найдите и обновите эти файлы:

1. **API/Service файлы:**
   - `src/services/whatsapp.js`
   - `src/services/api.js`
   - `src/lib/api.js`
   - `src/utils/fetch.js`

2. **Socket/WebSocket файлы:**
   - `src/services/socket.js`
   - `src/lib/socket.js`
   - `src/utils/websocket.js`

3. **Configuration файлы:**
   - `src/config/index.js`
   - `src/constants/endpoints.js`
   - `src/constants/api.js`

4. **Environment файлы:**
   - `.env`
   - `.env.production`
   - `.env.local`

### 🧪 Тестирование подключения

#### 1. Проверка API доступности

```javascript
// Добавьте в код для тестирования
const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('API Connection:', data);
    return data.status === 'ok';
  } catch (error) {
    console.error('API Connection Failed:', error);
    return false;
  }
};

// Вызовите при загрузке приложения
testConnection().then(connected => {
  if (connected) {
    console.log('✅ WhatsApp API Connected');
  } else {
    console.log('❌ WhatsApp API Not Available');
  }
});
```

#### 2. Проверка Socket.IO подключения

```javascript
const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Socket.IO Connected');
});

socket.on('disconnect', () => {
  console.log('❌ Socket.IO Disconnected');
});

socket.on('connect_error', (error) => {
  console.error('Socket.IO Connection Error:', error);
});
```

### 📱 Пример полной интеграции

**`src/services/whatsapp.js`:**
```javascript
import axios from 'axios';
import io from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://YOUR_VM_IP:3000';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://YOUR_VM_IP:3000';

// API Client
export const whatsappAPI = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000
});

// Socket Client  
export const whatsappSocket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

// API Methods
export const whatsappService = {
  // Получить чаты
  getChats: () => whatsappAPI.get('/chats'),
  
  // Отправить сообщение
  sendMessage: (to, message) => whatsappAPI.post('/send-message', { to, message }),
  
  // Удалить чат
  deleteChat: (phoneNumber) => whatsappAPI.delete(`/chats/${phoneNumber}`),
  
  // Health check
  healthCheck: () => whatsappAPI.get('/health')
};
```

### 🔍 Проверочный чек-лист

- [ ] ✅ Обновлен `API_BASE_URL` в коде фронтенда
- [ ] ✅ Обновлен `SOCKET_URL` для Socket.IO
- [ ] ✅ Настроены переменные окружения `.env.production`
- [ ] ✅ Включены `withCredentials: true` для CORS
- [ ] ✅ Добавлена обработка ошибок подключения
- [ ] ✅ Протестировано подключение к `/health` endpoint
- [ ] ✅ Проверены console логи в браузере
- [ ] ✅ Проверена работа Socket.IO соединения

### 🚨 Возможные проблемы

#### 1. CORS ошибки
**Решение:** Убедитесь что WhatsApp сервер запущен с правильными `FRONTEND_URL` и `ALLOWED_ORIGINS`

#### 2. Mixed Content (HTTP/HTTPS)
**Решение:** Используйте HTTPS для API или настройте Nginx с SSL

#### 3. Socket.IO не подключается
**Решение:** Проверьте что порт 3000 открыт и WebSocket поддерживается

### 📞 После деплоя

1. **Откройте** https://2wix.ru/
2. **Проверьте** Console в DevTools браузера
3. **Убедитесь** что нет CORS ошибок
4. **Протестируйте** подключение WhatsApp 