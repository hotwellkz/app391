# 🚀 DevOps Deployment Package - WhatsApp Backend

## 📁 Созданные файлы для деплоя

### 🔧 Скрипты автоматизации:
- **`deploy-gcp-vm.sh`** - Полная настройка Google Cloud VM (Docker, UFW, .env)
- **`quick-deploy.sh`** - Быстрый деплой одной командой
- **`manage-backend.sh`** - Управление backend (start/stop/restart/logs/status/update)
- **`test-deployment.sh`** - Комплексное тестирование развернутого backend

### 📋 Конфигурация:
- **`docker-compose.production.yml`** - Production конфигурация Docker
- **`whatsapp-server/env.production.vm`** - Готовая конфигурация для Google Cloud VM
- **`GCP_FIREWALL_SETUP.md`** - Инструкции по настройке GCP firewall
- **`README_PRODUCTION.md`** - Пошаговое руководство по деплою

## ⚡ Быстрый старт на Google Cloud VM

```bash
# 1. Подключитесь к вашей VM
ssh username@YOUR_EXTERNAL_IP

# 2. Скопируйте файлы проекта на VM
scp -r ./* username@YOUR_EXTERNAL_IP:~/whatsapp-backend/

# 3. Подключитесь к VM и перейдите в папку
ssh username@YOUR_EXTERNAL_IP
cd whatsapp-backend

# 4. Запустите автоматический деплой
chmod +x *.sh
./quick-deploy.sh

# 5. Протестируйте развертывание
./test-deployment.sh

# 6. Управляйте backend
./manage-backend.sh status
./manage-backend.sh logs
```

## 🎯 Что будет автоматически настроено

### ✅ Системные компоненты:
- Docker CE + Docker Compose
- UFW Firewall (порты 22, 80, 443, 3000)
- Автоматическое получение внешнего IP

### ✅ Backend настройки:
- Node.js + TypeScript + WhatsApp Web.js
- Socket.IO для real-time соединений
- CORS для домена https://2wix.ru
- Health monitoring
- Auto-restart при сбоях
- Оптимизация ресурсов (4GB RAM, 2 CPU cores)

### ✅ Безопасность:
- Non-root пользователь в контейнере
- Ограничение ресурсов
- Firewall правила
- Sandboxing для Chrome/Puppeteer

## 🔗 URLs после деплоя

После успешного развертывания backend будет доступен по адресам:
- **Health Check**: `http://YOUR_EXTERNAL_IP:3000/health`
- **API Base**: `http://YOUR_EXTERNAL_IP:3000`
- **Contacts**: `http://YOUR_EXTERNAL_IP:3000/contacts`
- **WhatsApp Status**: `http://YOUR_EXTERNAL_IP:3000/whatsapp/status`
- **Socket.IO**: `http://YOUR_EXTERNAL_IP:3000` (для WebSocket)

## 🎛️ Управление после деплоя

```bash
# Статус и мониторинг
./manage-backend.sh status    # Проверка состояния
./manage-backend.sh logs      # Просмотр логов

# Управление сервисом
./manage-backend.sh start     # Запуск
./manage-backend.sh stop      # Остановка
./manage-backend.sh restart   # Перезапуск

# Обновление
./manage-backend.sh update    # Пересборка и перезапуск

# Тестирование
./test-deployment.sh          # Полное тестирование
```

## 🔧 Настройка фронтенда https://2wix.ru

После успешного развертывания обновите настройки API в вашем фронтенде:

```typescript
// Замените YOUR_EXTERNAL_IP на реальный IP вашей VM
const WHATSAPP_API_CONFIG = {
  baseURL: 'http://YOUR_EXTERNAL_IP:3000',
  socketURL: 'http://YOUR_EXTERNAL_IP:3000',
  
  endpoints: {
    health: '/health',
    contacts: '/contacts',
    chats: '/chats',
    sendMessage: '/send-message',
    whatsappStatus: '/whatsapp/status'
  }
};

// Socket.IO подключение
const socket = io('http://YOUR_EXTERNAL_IP:3000', {
  transports: ['websocket', 'polling'],
  cors: {
    origin: "https://2wix.ru",
    methods: ["GET", "POST"]
  }
});
```

## 🔍 Диагностика проблем

### Если backend не запускается:
```bash
./manage-backend.sh logs       # Просмотр ошибок
docker ps -a                   # Проверка контейнеров
sudo systemctl status docker   # Статус Docker
```

### Если недоступен извне:
```bash
# Проверьте UFW
sudo ufw status verbose

# Проверьте GCP firewall
gcloud compute firewall-rules list

# Проверьте порты
sudo netstat -tlnp | grep :3000
```

### Если CORS ошибки:
```bash
# Проверьте настройки в .env
cat .env | grep ALLOWED_ORIGINS

# Обновите origins и перезапустите
./manage-backend.sh restart
```

## 📊 Мониторинг производительности

```bash
# Использование ресурсов
docker stats

# Логи системы
sudo journalctl -u docker -f

# Размер файлов WhatsApp
du -sh data/

# Проверка памяти и CPU
htop
```

## 🚨 Важные заметки

1. **GCP Firewall**: Обязательно настройте правила firewall в Google Cloud Console или через gcloud CLI

2. **HTTPS**: Для production использования рекомендуется настроить SSL сертификат и домен

3. **Backup**: Регулярно делайте backup папки `data/` с сессиями WhatsApp

4. **Обновления**: Регулярно обновляйте систему и Docker образы

5. **Мониторинг**: Настройте мониторинг логов и уведомления о сбоях

## ✅ Чеклист готовности к продакшену

- [ ] Backend запущен и отвечает на health check
- [ ] GCP firewall правила настроены  
- [ ] API endpoints доступны извне
- [ ] Socket.IO соединения работают
- [ ] CORS настроен для https://2wix.ru
- [ ] Фронтенд успешно подключается к API
- [ ] WhatsApp клиент авторизован и работает
- [ ] Автоперезапуск при сбоях настроен
- [ ] Мониторинг и логирование работает

🎉 **После выполнения всех пунктов ваш WhatsApp Backend готов к production использованию!** 