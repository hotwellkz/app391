# 🚀 Docker Quick Start

## Быстрый запуск за 3 шага:

### 1. Настройте окружение
```bash
# Создайте .env файл
cp whatsapp-server/env.example whatsapp-server/.env

# Отредактируйте переменные (минимум нужны SUPABASE настройки)
nano whatsapp-server/.env
```

### 2. Запустите Docker
```bash
# Сборка и запуск
docker-compose up --build -d

# Проверьте статус
docker-compose ps
```

### 3. Проверьте работу
```bash
# Health check
curl http://localhost:3000/health

# Логи
docker-compose logs -f whatsapp-server
```

## 🎯 Результат

✅ WhatsApp сервер работает на `http://localhost:3000`
✅ Данные сохраняются в Docker volumes
✅ Автоматический перезапуск при сбоях

## 🛑 Остановка

```bash
docker-compose down
```

## 🔧 Полная очистка

```bash
# Остановка + удаление volumes
docker-compose down -v

# Удаление образов
docker rmi $(docker images -q whatsapp-server)
```

**Подробная документация:** См. `DOCKER_SETUP_GUIDE.md` 