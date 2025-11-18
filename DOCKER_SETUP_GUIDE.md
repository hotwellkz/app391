# 🐳 Docker Setup Guide для WhatsApp Server

## 📋 Обзор

Этот проект настроен для запуска WhatsApp сервера в Docker контейнере с полной изоляцией и управлением зависимостями.

## 🛠️ Предварительные требования

1. **Docker** (версия 20.10+)
2. **Docker Compose** (версия 2.0+)
3. **Node.js 18+** (только для локальной разработки)

Проверить установку:
```bash
docker --version
docker-compose --version
```

## ⚙️ Настройка окружения

### 1. Создайте .env файл

```bash
# Скопируйте пример конфигурации
cp whatsapp-server/env.example whatsapp-server/.env

# Отредактируйте переменные окружения
nano whatsapp-server/.env  # или используйте ваш любимый редактор
```

### 2. Обязательные переменные в .env

```env
PORT=3000
NODE_ENV=production
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🚀 Запуск контейнера

### Метод 1: Docker Compose (рекомендуется)

```bash
# 1. Сборка образа
docker-compose build

# 2. Запуск в фоновом режиме
docker-compose up -d

# 3. Просмотр логов
docker-compose logs -f whatsapp-server

# 4. Остановка
docker-compose down
```

### Метод 2: Только Docker

```bash
# Сборка образа
cd whatsapp-server
docker build -t whatsapp-server .

# Запуск контейнера
docker run -d \
  --name whatsapp-server \
  -p 3000:3000 \
  --env-file .env \
  -v whatsapp-auth:/app/.wwebjs_auth \
  -v whatsapp-cache:/app/.wwebjs_cache \
  -v whatsapp-data:/app/data \
  --cap-add=SYS_ADMIN \
  whatsapp-server
```

## 📊 Проверка работы

### 1. Health Check
```bash
curl http://localhost:3000/health
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "whatsapp": {
    "ready": false,
    "connected": false
  }
}
```

### 2. Логи контейнера
```bash
# Docker Compose
docker-compose logs -f whatsapp-server

# Только Docker
docker logs -f whatsapp-server
```

### 3. Вход в контейнер для отладки
```bash
# Docker Compose
docker-compose exec whatsapp-server sh

# Только Docker
docker exec -it whatsapp-server sh
```

## 🔧 Управление данными

### Volumes (постоянное хранение)

Docker создает именованные volumes для сохранения данных:

- `whatsapp-auth` - данные аутентификации WhatsApp
- `whatsapp-cache` - кэш WhatsApp Web.js
- `whatsapp-data` - пользовательские данные

### Просмотр volumes
```bash
docker volume ls
docker volume inspect whatsapp-auth
```

### Резервное копирование данных
```bash
# Создание backup
docker run --rm \
  -v whatsapp-auth:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/whatsapp-auth-backup.tar.gz -C /data .

# Восстановление backup
docker run --rm \
  -v whatsapp-auth:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/whatsapp-auth-backup.tar.gz -C /data
```

## 🛠️ Разработка

### Для разработки с hot reload:

1. **Измените docker-compose.yml:**
```yaml
services:
  whatsapp-server:
    # ... остальные настройки
    volumes:
      - ./whatsapp-server:/app
      - /app/node_modules
    command: ["npm", "run", "dev"]
```

2. **Перезапустите:**
```bash
docker-compose down
docker-compose up -d
```

## 🐛 Устранение неполадок

### Проблема: WhatsApp не подключается

**Решение:**
```bash
# 1. Проверьте логи
docker-compose logs whatsapp-server

# 2. Убедитесь что Chrome работает
docker-compose exec whatsapp-server chromium-browser --version

# 3. Перезапустите с полной очисткой
docker-compose down -v
docker-compose up --build
```

### Проблема: Ошибки разрешений

**Решение:**
```bash
# Проверьте права на volumes
docker-compose exec whatsapp-server ls -la /app/.wwebjs_auth

# Если нужно, исправьте права
docker-compose exec --user root whatsapp-server chown -R nodeuser:nodejs /app/.wwebjs_auth
```

### Проблема: Порт уже занят

**Решение:**
```bash
# Найдите процесс использующий порт 3000
sudo lsof -i :3000

# Или измените порт в docker-compose.yml
ports:
  - "3001:3000"  # внешний:внутренний
```

## 📈 Мониторинг и логи

### Встроенный мониторинг
```bash
# Статистика контейнера
docker stats whatsapp-server

# Health check статус
docker inspect whatsapp-server | grep Health -A 10
```

### Централизованные логи
```bash
# Логи с временными метками
docker-compose logs -f -t whatsapp-server

# Только последние 100 строк
docker-compose logs --tail=100 whatsapp-server
```

## 🔒 Производственная безопасность

### Рекомендации:

1. **Используйте конкретные версии образов:**
```dockerfile
FROM node:18.19.0-alpine
```

2. **Ограничьте память и CPU:**
```yaml
services:
  whatsapp-server:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

3. **Настройте сетевую безопасность:**
```yaml
networks:
  whatsapp-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

4. **Регулярно обновляйте зависимости:**
```bash
docker-compose pull
docker-compose up -d
```

## 📞 Поддержка

Если возникли проблемы:

1. Проверьте [Issues](https://github.com/your-repo/issues)
2. Создайте новый Issue с логами
3. Включите вывод `docker version` и `docker-compose version`

---

**Готово!** 🎉 Ваш WhatsApp сервер должен работать в Docker контейнере на `http://localhost:3000` 