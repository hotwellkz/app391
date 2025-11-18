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
# Клонируйте ваш репозиторий
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Или загрузите файлы напрямую
# scp -r ./* username@YOUR_EXTERNAL_IP:~/project/
```

### Шаг 3: Автоматическая настройка

```bash
# Сделайте скрипт исполняемым
chmod +x deploy-gcp-vm.sh

# Запустите автоматическую настройку
./deploy-gcp-vm.sh
```

### Шаг 4: Настройка GCP Firewall

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

### Шаг 5: Запуск Backend

```bash
# Сделайте скрипт управления исполняемым
chmod +x manage-backend.sh

# Запустите backend
./manage-backend.sh start
```

### Шаг 6: Проверка работы

```bash
# Проверка статуса
./manage-backend.sh status

# Проверка health endpoint
curl http://YOUR_EXTERNAL_IP:3000/health
```

### Шаг 7: Настройка Frontend

Обновите API URL в вашем фронтенде:

```typescript
// В настройках фронтенда https://2wix.ru
const WHATSAPP_API_URL = 'http://YOUR_EXTERNAL_IP:3000';
```

## 🔧 Управление сервером

```bash
./manage-backend.sh start     # Запуск
./manage-backend.sh stop      # Остановка  
./manage-backend.sh restart   # Перезапуск
./manage-backend.sh logs      # Логи
./manage-backend.sh status    # Статус
./manage-backend.sh update    # Обновление
```

## ✅ Финальная проверка

После деплоя проверьте:

- [ ] Backend отвечает на health check
- [ ] API endpoints доступны извне  
- [ ] Socket.IO соединения работают
- [ ] CORS настроен для https://2wix.ru
- [ ] WhatsApp клиент подключается
- [ ] Фронтенд получает данные без ошибок

## 🎉 Готово!

Ваш WhatsApp Backend теперь работает на:
- **API URL**: `http://YOUR_EXTERNAL_IP:3000`
- **Health Check**: `http://YOUR_EXTERNAL_IP:3000/health`
- **Socket.IO**: `http://YOUR_EXTERNAL_IP:3000`

Подключите ваш фронтенд https://2wix.ru к этому URL! 🚀 