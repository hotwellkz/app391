# 🔥 Настройка Google Cloud Platform Firewall

## 🎯 Цель
Открыть необходимые порты для WhatsApp Backend сервера с Socket.IO поддержкой.

## 🛡️ Требуемые порты

- **22** (SSH) - для доступа к VM
- **80** (HTTP) - для Nginx/веб-сервера  
- **443** (HTTPS) - для SSL соединений
- **3000** (Backend) - для WhatsApp API + Socket.IO

## 🚀 Автоматическая настройка (через gcloud CLI)

```bash
# 1. Создание firewall правила для backend
gcloud compute firewall-rules create whatsapp-backend-ports \
    --allow tcp:22,tcp:80,tcp:443,tcp:3000 \
    --source-ranges 0.0.0.0/0 \
    --description "WhatsApp Backend: SSH, HTTP, HTTPS, API" \
    --direction INGRESS

# 2. Применение тегов к VM (замените VM_NAME на ваше имя)
gcloud compute instances add-tags VM_NAME \
    --tags whatsapp-backend \
    --zone YOUR_ZONE

# 3. Проверка правил
gcloud compute firewall-rules list --filter="name~whatsapp"
```

## 🖱️ Ручная настройка (через Console)

### Шаг 1: Создание Firewall правила

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Перейдите в **VPC network** → **Firewall**
3. Нажмите **CREATE FIREWALL RULE**

### Шаг 2: Настройка правила

```
Name: whatsapp-backend-ports
Direction: Ingress
Action: Allow
Targets: Specified target tags
Target tags: whatsapp-backend
Source IP ranges: 0.0.0.0/0
Protocols and ports: 
  ✅ Specified protocols and ports
  ✅ TCP: 22,80,443,3000
```

### Шаг 3: Применение к VM

1. Перейдите в **Compute Engine** → **VM instances**
2. Найдите вашу VM и нажмите на её имя
3. Нажмите **EDIT**
4. В разделе **Network tags** добавьте: `whatsapp-backend`
5. Нажмите **SAVE**

## ✅ Проверка настроек

### Проверка портов на VM
```bash
# Проверка открытых портов
sudo netstat -tlnp | grep :3000
sudo ss -tlnp | grep :3000

# Проверка UFW статуса
sudo ufw status verbose
```

### Проверка доступности извне
```bash
# Получить внешний IP
EXTERNAL_IP=$(curl -s ifconfig.me)
echo "External IP: $EXTERNAL_IP"

# Проверить доступность (с другого компьютера)
curl -I http://$EXTERNAL_IP:3000/health
telnet $EXTERNAL_IP 3000
```

## 🔧 Диагностика проблем

### Проблема: Порт недоступен извне

1. **Проверьте GCP firewall правила:**
   ```bash
   gcloud compute firewall-rules list
   ```

2. **Проверьте теги VM:**
   ```bash
   gcloud compute instances describe VM_NAME --zone=YOUR_ZONE | grep tags -A 5
   ```

3. **Проверьте UFW на VM:**
   ```bash
   sudo ufw status verbose
   ```

### Проблема: Service недоступен

1. **Проверьте Docker контейнер:**
   ```bash
   docker ps
   docker logs whatsapp-backend-prod
   ```

2. **Проверьте health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

## 🌐 Настройка для HTTPS (опционально)

### С доменом:
```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автообновление
sudo crontab -e
# Добавить: 0 12 * * * /usr/bin/certbot renew --quiet
```

### С самоподписанным сертификатом:
```bash
# Создание сертификата
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/selfsigned.key \
    -out /etc/ssl/certs/selfsigned.crt
```

## 🚨 Рекомендации безопасности

1. **Ограничьте доступ по IP** (если возможно):
   ```bash
   # Вместо 0.0.0.0/0 используйте конкретные IP
   gcloud compute firewall-rules update whatsapp-backend-ports \
       --source-ranges="YOUR_OFFICE_IP/32,FRONTEND_SERVER_IP/32"
   ```

2. **Используйте SSH ключи** вместо паролей

3. **Регулярно обновляйте систему:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **Мониторинг логов:**
   ```bash
   sudo tail -f /var/log/auth.log
   sudo journalctl -u docker -f
   ```

## 📋 Чеклист

- [ ] GCP firewall правила созданы
- [ ] VM помечена нужными тегами  
- [ ] UFW настроен на VM
- [ ] Docker контейнер запущен
- [ ] Health check отвечает локально
- [ ] Health check доступен извне
- [ ] Frontend может подключиться к API
- [ ] Socket.IO соединения работают
- [ ] CORS настроен правильно

После выполнения всех шагов ваш backend должен быть доступен по адресу:
`http://YOUR_EXTERNAL_IP:3000` 