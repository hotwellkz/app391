# 🚀 GitHub Deploy Guide - WhatsApp Backend на Google Cloud VM

## ⚡ Быстрый деплой с GitHub

### 📋 На Google Cloud VM выполните:

```bash
# 1. Клонируйте обновленный репозиторий
git clone https://github.com/hotwellkz/app375.git
cd app375

# 2. Сделайте скрипты исполняемыми
chmod +x *.sh

# 3. Запустите автоматический деплой
./quick-deploy.sh

# 4. Протестируйте развертывание
./test-deployment.sh
```

## 🔧 Управление после деплоя

```bash
# Проверка статуса
./manage-backend.sh status

# Просмотр логов
./manage-backend.sh logs

# Перезапуск
./manage-backend.sh restart

# Остановка
./manage-backend.sh stop
```

## 🔗 Проверка работы

После успешного деплоя:

```bash
# Получите внешний IP
curl -s ifconfig.me

# Проверьте health endpoint
curl http://YOUR_EXTERNAL_IP:3000/health

# Должен вернуть: {"status":"ok","timestamp":"..."}
```

## 🔥 Настройка GCP Firewall

**ВАЖНО:** Не забудьте открыть порты в Google Cloud Console:

```bash
# Автоматически через gcloud CLI
gcloud compute firewall-rules create whatsapp-backend-ports \
    --allow tcp:22,tcp:80,tcp:443,tcp:3000 \
    --source-ranges 0.0.0.0/0 \
    --description "WhatsApp Backend Ports"

# Применить к VM
gcloud compute instances add-tags VM_NAME \
    --tags whatsapp-backend \
    --zone YOUR_ZONE
```

Или вручную в [Google Cloud Console](https://console.cloud.google.com/):
- VPC network → Firewall → CREATE FIREWALL RULE
- Ports: 22,80,443,3000
- Source IP ranges: 0.0.0.0/0

## ✅ После деплоя

1. **Backend URL:** `http://YOUR_EXTERNAL_IP:3000`
2. **Health Check:** `http://YOUR_EXTERNAL_IP:3000/health`
3. **Socket.IO:** `http://YOUR_EXTERNAL_IP:3000`

Обновите API URL в фронтенде https://2wix.ru:
```typescript
const WHATSAPP_API_URL = 'http://YOUR_EXTERNAL_IP:3000';
```

## 🎉 Готово!

Ваш WhatsApp Backend готов к подключению фронтенда! 🚀 