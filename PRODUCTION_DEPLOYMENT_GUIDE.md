# 🚀 Production Deployment Guide - WhatsApp Backend на Google Cloud VM

## 🎯 Цель
Развернуть WhatsApp Backend сервер с Socket.IO на Google Cloud VM для подключения фронтенда https://2wix.ru

## 📋 Что будет настроено

- ✅ **Docker + Docker Compose** - контейнеризация
- ✅ **UFW Firewall** - базовая защита VM  
- ✅ **GCP Firewall** - сетевые правила
- ✅ **WhatsApp Backend** - Node.js + TypeScript + Socket.IO
- ✅ **Health Monitoring** - проверка состояния сервера
- ✅ **Auto-restart** - автоматический перезапуск при сбое
- ✅ **CORS настройки** - для подключения https://2wix.ru

## 🛠️ Требования

### Google Cloud VM:
- **OS**: Ubuntu 20.04 LTS или выше
- **RAM**: минимум 2GB, рекомендуется 4GB  
- **CPU**: минимум 1 vCPU, рекомендуется 2 vCPU
- **Disk**: минимум 20GB SSD
- **Network**: External IP address

### Локальные инструменты:
- SSH клиент для подключения к VM
- Git для клонирования репозитория

## 🚀 Пошаговый деплой

### Шаг 1: Подготовка VM

```bash
# Подключитесь к вашей Google Cloud VM
ssh username@YOUR_EXTERNAL_IP

# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Git
sudo apt install -y git curl wget
```

### Шаг 2: Клонирование проекта

```bash
# Клонируйте ваш репозиторий (замените на ваш)
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Или загрузите файлы напрямую
# scp -r ./whatsapp-server username@YOUR_EXTERNAL_IP:~/
```

### Шаг 3: Автоматическая настройка

```bash
# Сделайте скрипт исполняемым
chmod +x deploy-gcp-vm.sh

# Запустите автоматическую настройку
./deploy-gcp-vm.sh
```

**Скрипт автоматически:**
- Установит Docker и Docker Compose
- Настроит UFW firewall
- Получит внешний IP адрес
- Создаст оптимальный .env файл
- Покажет URLs для тестирования

### Шаг 4: Настройка GCP Firewall

Выберите один из способов:

#### Способ A: Через gcloud CLI
```bash
# Создание firewall правила
gcloud compute firewall-rules create whatsapp-backend-ports \
    --allow tcp:22,tcp:80,tcp:443,tcp:3000 \
    --source-ranges 0.0.0.0/0 \
    --description "WhatsApp Backend Ports"

# Применение к VM (замените VM_NAME и YOUR_ZONE)
gcloud compute instances add-tags VM_NAME \
    --tags whatsapp-backend \
    --zone YOUR_ZONE
```

#### Способ B: Через Google Cloud Console
См. подробные инструкции в `GCP_FIREWALL_SETUP.md`

### Шаг 5: Запуск Backend

```bash
# Сделайте скрипт управления исполняемым
chmod +x manage-backend.sh

# Запустите backend
./manage-backend.sh start
```

**Ожидаемый вывод:**
```
✅ Backend запущен!
🔗 URL: http://YOUR_EXTERNAL_IP:3000/health
```

### Шаг 6: Проверка работы

```bash
# Проверка статуса
./manage-backend.sh status

# Просмотр логов
./manage-backend.sh logs

# Проверка health endpoint
curl http://YOUR_EXTERNAL_IP:3000/health
```

### Шаг 7: Настройка Frontend

Обновите API URL в вашем фронтенде:

```typescript
// В настройках фронтенда https://2wix.ru
const WHATSAPP_API_URL = 'http://YOUR_EXTERNAL_IP:3000';

// Или если настроен домен:
const WHATSAPP_API_URL = 'https://your-domain.com';
```

## 🔧 Управление сервером

### Основные команды:
```bash
./manage-backend.sh start     # Запуск
./manage-backend.sh stop      # Остановка  
./manage-backend.sh restart   # Перезапуск
./manage-backend.sh logs      # Логи
./manage-backend.sh status    # Статус
./manage-backend.sh update    # Обновление
```

### Прямые Docker команды:
```bash
# Просмотр контейнеров
docker-compose -f docker-compose.production.yml ps

# Логи
docker-compose -f docker-compose.production.yml logs -f

# Перезапуск
docker-compose -f docker-compose.production.yml restart
```

## 🔍 Диагностика и решение проблем

### Проблема: Backend не запускается

1. **Проверьте логи:**
   ```bash
   ./manage-backend.sh logs
   ```

2. **Проверьте Docker:**
   ```bash
   docker ps -a
   docker logs whatsapp-backend-prod
   ```

3. **Проверьте порты:**
   ```bash
   sudo netstat -tlnp | grep :3000
   ```

### Проблема: Недоступен извне

1. **Проверьте GCP firewall:**
   ```bash
   gcloud compute firewall-rules list
   ```

2. **Проверьте UFW:**
   ```bash
   sudo ufw status verbose
   ```

3. **Проверьте внешний IP:**
   ```bash
   curl -s ifconfig.me
   ```

### Проблема: CORS ошибки

1. **Проверьте .env файл:**
   ```bash
   cat .env | grep ALLOWED_ORIGINS
   ```

2. **Обновите origins:**
   ```bash
   # Добавьте ваш фронтенд домен
   ALLOWED_ORIGINS=https://2wix.ru,https://www.2wix.ru,http://YOUR_IP:3000
   ```

3. **Перезапустите:**
   ```bash
   ./manage-backend.sh restart
   ```

## 🌐 Тестирование соединения

### Health Check:
```bash
curl -I http://YOUR_EXTERNAL_IP:3000/health
```

### API Endpoints:
```bash
# Контакты
curl http://YOUR_EXTERNAL_IP:3000/contacts

# Чаты  
curl http://YOUR_EXTERNAL_IP:3000/chats

# WhatsApp статус
curl http://YOUR_EXTERNAL_IP:3000/whatsapp/status
```

### Socket.IO проверка:
```javascript
// В браузере на https://2wix.ru
const socket = io('http://YOUR_EXTERNAL_IP:3000');
socket.on('connect', () => console.log('Connected!'));
```

## 📈 Мониторинг и обслуживание

### Автоматический мониторинг:
```bash
# Создание скрипта мониторинга
cat > monitor-backend.sh << 'EOF'
#!/bin/bash
while true; do
    if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "$(date): Backend не отвечает, перезапускаем..."
        docker-compose -f docker-compose.production.yml restart
        sleep 30
    fi
    sleep 60
done
EOF

chmod +x monitor-backend.sh

# Запуск в фоне
nohup ./monitor-backend.sh > monitor.log 2>&1 &
```

### Очистка логов:
```bash
# Очистка Docker логов
docker system prune -f

# Ротация логов
sudo journalctl --vacuum-time=7d
```

### Обновление кода:
```bash
# Получение обновлений
git pull origin main

# Обновление backend
./manage-backend.sh update
```

## 🔒 Безопасность

### Рекомендации:
1. **Смените SSH порт** с 22 на другой
2. **Используйте SSH ключи** вместо паролей  
3. **Ограничьте CORS** до конкретных доменов
4. **Настройте fail2ban** для защиты от брутфорса
5. **Регулярно обновляйте** систему и Docker образы

### Настройка SSL (опционально):
```bash
# С доменом
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# Обновление .env для HTTPS
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://2wix.ru,https://your-domain.com
```

## 📊 Финальная проверка

После деплоя проверьте:

- [ ] ✅ Backend отвечает на health check
- [ ] ✅ API endpoints доступны извне  
- [ ] ✅ Socket.IO соединения работают
- [ ] ✅ CORS настроен для https://2wix.ru
- [ ] ✅ WhatsApp клиент подключается
- [ ] ✅ Фронтенд получает данные без ошибок
- [ ] ✅ Автоперезапуск работает при сбоях

## 🎉 Готово!

Ваш WhatsApp Backend теперь работает на:
- **API URL**: `http://YOUR_EXTERNAL_IP:3000`
- **Health Check**: `http://YOUR_EXTERNAL_IP:3000/health`
- **Socket.IO**: `http://YOUR_EXTERNAL_IP:3000`

Подключите ваш фронтенд https://2wix.ru к этому URL и наслаждайтесь работой! 🚀 