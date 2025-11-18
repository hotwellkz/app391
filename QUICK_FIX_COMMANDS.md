# ⚡ Быстрые команды для исправления Mixed Content

## 📋 Копируй и выполняй

### 1️⃣ На локальной машине (Windows PowerShell)

```powershell
# Отправить файлы на сервер
scp nginx-ssl.conf setup-https-proxy.sh studo@35.194.39.8:~/app375/

# Подключиться к серверу
ssh studo@35.194.39.8
```

### 2️⃣ На сервере (Linux)

```bash
# Перейти в папку проекта
cd ~/app375

# Обновить код из Git
git pull origin main

# Настроить HTTPS прокси
chmod +x setup-https-proxy.sh
./setup-https-proxy.sh
```

### 3️⃣ Настройка GCP Firewall

```bash
# Создать правило для HTTPS
gcloud compute firewall-rules create https-whatsapp \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --description 'HTTPS for WhatsApp Backend'
```

### 4️⃣ Проверка работы

```bash
# Проверить HTTPS endpoint
curl -k https://35.194.39.8/health

# Проверить статус сервисов
sudo systemctl status nginx
docker ps | grep whatsapp

# Проверить порты
sudo netstat -tulpn | grep -E ':80|:443|:3000'
```

## 🔧 Переменная окружения для фронтенда

```bash
VITE_BACKEND_URL=https://35.194.39.8
```

## 🌐 URL для тестирования

- **HTTPS Backend**: https://35.194.39.8
- **Health Check**: https://35.194.39.8/health  
- **Socket.IO**: https://35.194.39.8/socket.io/

## 🚨 Важно!

1. Откройте **https://35.194.39.8** в браузере
2. Примите SSL сертификат (**"Дополнительно" → "Перейти на сайт"**)
3. Обновите фронтенд с новой переменной VITE_BACKEND_URL

## 🔄 Перезапуск при проблемах

```bash
# Перезапуск Nginx
sudo systemctl restart nginx

# Перезапуск Backend
docker restart whatsapp-backend-prod

# Просмотр логов
sudo journalctl -u nginx -f
docker logs whatsapp-backend-prod -f
``` 