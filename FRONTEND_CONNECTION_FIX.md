# 🔧 Исправление подключения Frontend → Backend

## 🚨 Проблема
Фронтенд на https://2wix.ru пытается подключиться к `localhost:3000` вместо внешнего IP backend сервера.

## ✅ Решение - Обновлено в коде

### 📁 Изменения в коде:

1. **`src/config/api.ts`** - Централизованная конфигурация API
2. **`src/context/ChatContext.tsx`** - Обновлены все API вызовы
3. **`src/components/AccountManager.tsx`** - Обновлен BACKEND_URL
4. **`src/components/WhatsAppConnect.tsx`** - Обновлен BACKEND_URL
5. **`src/utils/connectionStabilizer.ts`** - Обновлен health check URL

### 🎯 Автоматическое определение URL:

```typescript
// Development: http://localhost:3000
// Production: переменная окружения или http://35.194.39.8:3000
```

## 🚀 Следующие шаги

### 1. **Коммит и пуш изменений:**
```bash
git add .
git commit -m "Fix: Update API URLs to use external backend IP"
git push origin main
```

### 2. **Создать .env.production на хостинге:**

На Netlify/Vercel добавьте переменную окружения:
```
VITE_BACKEND_URL=http://YOUR_EXTERNAL_IP:3000
```

### 3. **Пересобрать и задеплоить:**
```bash
npm run build
# Деплой на ваш хостинг
```

### 4. **Получить внешний IP backend:**

На Google Cloud VM выполните:
```bash
curl -s ifconfig.me
# Результат: например 35.194.39.8
```

### 5. **Обновить IP в коде:**

В файле `src/config/api.ts` замените:
```typescript
'http://35.194.39.8:3000'; // ← Ваш реальный IP
```

## 🔍 Проверка после исправления

### В консоли браузера на https://2wix.ru должно появиться:
```
🔗 Backend URL: http://YOUR_EXTERNAL_IP:3000
🔌 Socket URL: http://YOUR_EXTERNAL_IP:3000
```

### API вызовы должны идти на:
```
✅ GET http://YOUR_EXTERNAL_IP:3000/health
✅ GET http://YOUR_EXTERNAL_IP:3000/contacts  
✅ GET http://YOUR_EXTERNAL_IP:3000/whatsapp/status
✅ WebSocket ws://YOUR_EXTERNAL_IP:3000/socket.io/
```

## ⚠️ Возможные проблемы

### 1. **Service Worker блокирует запросы:**
```javascript
// В консоли браузера на https://2wix.ru
swDisable()
```

### 2. **CORS ошибки:**
Убедитесь что backend настроен для домена https://2wix.ru:
```javascript
// В backend должно быть:
ALLOWED_ORIGINS=https://2wix.ru,https://www.2wix.ru
```

### 3. **Firewall блокирует порт 3000:**
```bash
# На Google Cloud VM
sudo ufw allow 3000/tcp

# В Google Cloud Console добавьте firewall правило
```

### 4. **Backend не запущен:**
```bash
# На Google Cloud VM
cd app375
./manage-backend.sh status
./manage-backend.sh start
```

## 🎉 Результат

После всех исправлений:
- ❌ `GET http://localhost:3000/health 404 (Service Worker Error)`  
- ✅ `GET http://YOUR_EXTERNAL_IP:3000/health 200 OK`

Фронтенд успешно подключится к backend на Google Cloud VM! 🚀 