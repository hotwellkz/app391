# 🔒 Руководство по настройке HTTPS для WhatsApp Backend

## Проблема Mixed Content

Ваш фронтенд работает по **HTTPS** (https://2wix.ru), но бэкенд работает по **HTTP** (http://35.194.39.8:3000). Браузер блокирует такие запросы из соображений безопасности.

### Ошибки в консоли:
```
Mixed Content: The page at 'https://2wix.ru/whatsapp' was loaded over HTTPS, but requested an insecure resource 'http://35.194.39.8:3000/chats'. This request has been blocked
```

## 🛠️ Решение: HTTPS Прокси

### 1. Настройка HTTPS прокси на сервере

Выполните на сервере:

```bash
# Перенесите файлы на сервер
scp nginx-ssl.conf setup-https-proxy.sh studo@35.194.39.8:~/app375/

# Подключитесь к серверу
ssh studo@35.194.39.8

# Перейдите в папку проекта
cd ~/app375

# Запустите настройку HTTPS
chmod +x setup-https-proxy.sh
./setup-https-proxy.sh
```

### 2. Настройка GCP Firewall

```bash
# Создайте правило для HTTPS
gcloud compute firewall-rules create https-whatsapp \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --description 'HTTPS for WhatsApp Backend'

# Примените тег к вашей VM (замените VM_NAME и ZONE)
gcloud compute instances add-tags VM_NAME \
    --tags https-whatsapp \
    --zone ZONE
```

### 3. Обновление API конфигурации

**Новый BACKEND_URL:**
```
VITE_BACKEND_URL=https://35.194.39.8
```

### 4. Принятие SSL сертификата

1. Откройте https://35.194.39.8 в браузере
2. Браузер покажет предупреждение о самоподписанном сертификате
3. Нажмите "Дополнительно" → "Перейти на сайт"
4. Сертификат будет принят для этого домена

### 5. Тестирование

```bash
# Проверка HTTPS endpoint
curl -k https://35.194.39.8/health

# Проверка с полным выводом
curl -k -v https://35.194.39.8/health
```

## 🔧 Архитектура решения

```
[HTTPS Frontend] → [HTTPS Nginx Proxy] → [HTTP Backend]
   2wix.ru             35.194.39.8          localhost:3000
```

### Nginx конфигурация:
- Принимает HTTPS запросы на порту 443
- Проксирует их к HTTP бэкенду на localhost:3000
- Настраивает CORS для https://2wix.ru
- Поддерживает WebSocket для Socket.IO

## 📋 Проверочный список

- [ ] Nginx установлен и запущен
- [ ] SSL сертификат создан
- [ ] GCP Firewall правило создано
- [ ] SSL сертификат принят в браузере
- [ ] API URL обновлен в фронтенде
- [ ] Тестирование HTTPS endpoint
- [ ] Проверка WebSocket подключения

## 🚨 Устранение неполадок

### Nginx не запускается
```bash
sudo systemctl status nginx
sudo nginx -t
sudo journalctl -u nginx
```

### Проблемы с SSL
```bash
# Проверка сертификата
openssl x509 -in /etc/nginx/ssl/nginx.crt -text -noout

# Пересоздание сертификата
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=WhatsApp-Backend/CN=35.194.39.8"
```

### Проблемы с CORS
```bash
# Проверка CORS заголовков
curl -k -H "Origin: https://2wix.ru" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS https://35.194.39.8/health -v
```

## 🔄 Альтернативное решение

Если HTTPS прокси не работает, можно использовать:

1. **Cloudflare SSL** - бесплатный SSL через Cloudflare
2. **Let's Encrypt** - бесплатный SSL сертификат
3. **ngrok** - туннелирование для тестирования

### Быстрое решение с ngrok:
```bash
# Установка ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Создание HTTPS туннеля
ngrok http 3000
```

## 📞 Поддержка

При возникновении проблем проверьте:
1. Логи Nginx: `sudo journalctl -u nginx`
2. Логи бэкенда: `docker logs whatsapp-backend-prod`
3. Статус портов: `sudo netstat -tulpn | grep -E ':80|:443|:3000'` 