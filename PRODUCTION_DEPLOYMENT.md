# 🚀 Production Deployment Guide - WhatsApp Server на VM

## 🎯 Цель

Развертывание WhatsApp сервера на виртуальной машине для работы с фронтендом на https://2wix.ru/

## 📋 Подготовка VM

### 1. Системные требования

- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: Минимум 2GB, рекомендуется 4GB
- **CPU**: Минимум 2 cores
- **Диск**: Минимум 20GB свободного места
- **Сеть**: Открытый порт 3000

### 2. Установка Docker и Docker Compose

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавляем пользователя в группу docker
sudo usermod -aG docker $USER

# Перелогиниваемся или выполняем
newgrp docker

# Проверяем установку
docker --version
docker-compose --version
```

## 📁 Подготовка файлов

### 1. Загрузите проект на VM

```bash
# Клонируйте или загрузите проект
git clone <your-repo>
cd app343-main-main

# Или загрузите архив и распакуйте
```

### 2. Настройте переменные окружения

```bash
# Создайте production .env файл
cp whatsapp-server/env.production whatsapp-server/.env

# Отредактируйте настройки
nano whatsapp-server/.env
```

**Содержимое .env:**
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL - ваш деплоенный фронтенд
FRONTEND_URL=https://2wix.ru

# Дополнительные разрешенные origins для CORS  
ALLOWED_ORIGINS=https://2wix.ru,https://www.2wix.ru

# Отключаем Supabase для начала (или настройте реальные данные)
DISABLE_SUPABASE=true

# Logging
LOG_LEVEL=info

# Security
TRUST_PROXY=true

# WhatsApp Configuration
WHATSAPP_SESSION_NAME=production
```

## 🐳 Деплой

### 1. Сборка и запуск

```bash
# Сборка образа для production
docker-compose -f docker-compose.production.yml build

# Запуск в production режиме
docker-compose -f docker-compose.production.yml up -d

# Проверка статуса
docker-compose -f docker-compose.production.yml ps
```

### 2. Проверка работы

```bash
# Health check
curl http://localhost:3000/health

# Логи сервера
docker-compose -f docker-compose.production.yml logs -f whatsapp-server

# Статистика контейнера
docker stats whatsapp-server-prod
```

## 🔧 Настройка фронтенда

### Обновите настройки на https://2wix.ru/

В коде фронтенда измените URL API сервера:

**Было (для локальной разработки):**
```javascript
const API_BASE_URL = 'http://localhost:3000';
```

**Стало (для production):**
```javascript
const API_BASE_URL = 'http://YOUR_VM_IP:3000';
// или если настроен домен:
const API_BASE_URL = 'https://api.2wix.ru';
```

## 🌐 Настройка сети

### 1. Откройте порт 3000

```bash
# Ubuntu/Debian с ufw
sudo ufw allow 3000

# CentOS/RHEL с firewalld  
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Или напрямую через iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

### 2. Настройка обратного proxy (рекомендуется)

**Установка Nginx:**
```bash
sudo apt install nginx -y
```

**Конфигурация Nginx** (`/etc/nginx/sites-available/whatsapp-api`):
```nginx
server {
    listen 80;
    server_name api.2wix.ru;  # или используйте IP
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты для WhatsApp операций
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # WebSocket поддержка для Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Активация конфигурации:**
```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL сертификат (рекомендуется)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение SSL сертификата
sudo certbot --nginx -d api.2wix.ru

# Автоматическое обновление
sudo crontab -e
# Добавьте: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Мониторинг

### 1. Автозапуск при перезагрузке

Docker Compose уже настроен с `restart: unless-stopped`

### 2. Логи

```bash
# Просмотр логов
docker-compose -f docker-compose.production.yml logs -f

# Логи только ошибок
docker-compose -f docker-compose.production.yml logs --tail=100 | grep ERROR

# Архивирование старых логов (настроено автоматически)
```

### 3. Backup данных WhatsApp

```bash
# Создание backup аутентификации WhatsApp
docker run --rm \
  -v app343-main-main_whatsapp-auth-prod:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/whatsapp-auth-$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Восстановление из backup
docker run --rm \
  -v app343-main-main_whatsapp-auth-prod:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/whatsapp-auth-YYYYMMDD_HHMMSS.tar.gz -C /data
```

## 🔐 Безопасность

### 1. Обновления

```bash
# Регулярно обновляйте образы
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
```

### 2. Файрвол

```bash
# Разрешить только необходимые порты
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000  # только если без Nginx
sudo ufw enable
```

## 🚨 Устранение неполадок

### 1. Контейнер не запускается

```bash
# Проверить логи
docker-compose -f docker-compose.production.yml logs whatsapp-server

# Проверить ресурсы
docker stats
free -h
df -h
```

### 2. WhatsApp не подключается

```bash
# Войти в контейнер
docker-compose -f docker-compose.production.yml exec whatsapp-server sh

# Проверить Chrome
chromium-browser --version

# Очистить данные аутентификации
docker-compose -f docker-compose.production.yml down -v
docker-compose -f docker-compose.production.yml up -d
```

### 3. CORS ошибки

Проверьте что:
- `FRONTEND_URL=https://2wix.ru` правильно настроен
- Фронтенд обращается к правильному API URL
- Нет блокировки на уровне браузера/CDN

## 📱 Подключение WhatsApp

1. **Откройте** https://2wix.ru/
2. **Перейдите** в раздел WhatsApp
3. **Отсканируйте** QR код с телефона
4. **Дождитесь** подключения

## ✅ Готово!

Ваш WhatsApp сервер теперь работает на VM и подключен к фронтенду на https://2wix.ru/

### Полезные команды:

```bash
# Просмотр статуса
docker-compose -f docker-compose.production.yml ps

# Перезапуск сервиса
docker-compose -f docker-compose.production.yml restart

# Остановка
docker-compose -f docker-compose.production.yml down

# Обновление
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
``` 