# ⚡ Быстрый Production Деплой

## 🎯 Для деплоя на VM с работой на https://2wix.ru/

### 1. Подготовка VM

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo usermod -aG docker $USER && newgrp docker

# Загрузка проекта
# git clone <repo> или загрузите файлы на VM
```

### 2. Настройка конфигурации

```bash
# Создайте .env для production
cp whatsapp-server/env.production whatsapp-server/.env

# Основные настройки в .env:
FRONTEND_URL=https://2wix.ru
ALLOWED_ORIGINS=https://2wix.ru,https://www.2wix.ru
DISABLE_SUPABASE=true
NODE_ENV=production
```

### 3. Запуск

```bash
# Сборка и запуск production контейнера
docker-compose -f docker-compose.production.yml up --build -d

# Проверка
docker-compose -f docker-compose.production.yml ps
curl http://localhost:3000/health
```

### 4. Открытие портов

```bash
# Ubuntu/Debian
sudo ufw allow 3000

# Или настройте Nginx для домена api.2wix.ru
```

### 5. Обновление фронтенда

В коде https://2wix.ru/ измените:

```javascript
// Было
const API_BASE_URL = 'http://localhost:3000';

// Стало  
const API_BASE_URL = 'http://YOUR_VM_IP:3000';
```

## ✅ Результат

- ✅ WhatsApp сервер на VM: `http://YOUR_VM_IP:3000`
- ✅ Фронтенд: `https://2wix.ru/`  
- ✅ CORS настроен для домена 2wix.ru
- ✅ Production оптимизации включены

## 🔧 Полезные команды

```bash
# Логи
docker-compose -f docker-compose.production.yml logs -f

# Перезапуск
docker-compose -f docker-compose.production.yml restart

# Остановка  
docker-compose -f docker-compose.production.yml down
```

**Подробная документация:** См. `PRODUCTION_DEPLOYMENT.md` 