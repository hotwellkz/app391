#!/bin/bash

echo "🔒 Быстрая настройка HTTPS прокси для решения Mixed Content"
echo "=========================================================="

# Установка Nginx
echo "[INFO] 📦 Установка Nginx..."
sudo apt update -y
sudo apt install -y nginx

# Остановка Apache если есть
sudo systemctl stop apache2 2>/dev/null || true

# Создание SSL сертификата
echo "[INFO] 🔐 Создание SSL сертификата..."
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=WhatsApp-Backend/CN=35.194.39.8"

# Создание конфигурации Nginx
echo "[INFO] ⚙️ Создание конфигурации Nginx..."
sudo tee /etc/nginx/sites-available/whatsapp-https > /dev/null << 'EOF'
server {
    listen 443 ssl http2;
    server_name 35.194.39.8;

    # SSL сертификат
    ssl_certificate /etc/nginx/ssl/nginx.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx.key;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # CORS заголовки для всех запросов
    add_header Access-Control-Allow-Origin "https://2wix.ru" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control" always;
    add_header Access-Control-Allow-Credentials "true" always;
    
    # Обработка preflight запросов
    location / {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://2wix.ru";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control";
            add_header Access-Control-Allow-Credentials "true";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        # Проксирование к бэкенду
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout настройки
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Socket.IO поддержка
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS для Socket.IO
        add_header Access-Control-Allow-Origin "https://2wix.ru" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }
}

# Редирект с HTTP на HTTPS  
server {
    listen 80;
    server_name 35.194.39.8;
    return 301 https://$server_name$request_uri;
}
EOF

# Активация конфигурации
echo "[INFO] 🔧 Активация конфигурации..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/whatsapp-https /etc/nginx/sites-enabled/

# Тест конфигурации
echo "[INFO] ✅ Проверка конфигурации..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "[SUCCESS] ✅ Конфигурация корректна"
    
    # Запуск Nginx
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    # Обновление UFW
    echo "[INFO] 🔥 Обновление Firewall..."
    sudo ufw allow 443/tcp
    sudo ufw reload
    
    echo ""
    echo "🎉 HTTPS прокси настроен успешно!"
    echo ""
    echo "📋 Новые URL:"
    echo "  🔗 HTTPS Backend: https://35.194.39.8"
    echo "  🔗 Health Check: https://35.194.39.8/health"
    echo "  🔗 Socket.IO: https://35.194.39.8/socket.io/"
    echo ""
    echo "🔧 Для фронтенда установите:"
    echo "  VITE_BACKEND_URL=https://35.194.39.8"
    echo ""
    echo "⚠️ ВАЖНО: Откройте https://35.194.39.8 в браузере и примите SSL сертификат!"
    
else
    echo "[ERROR] ❌ Ошибка в конфигурации Nginx"
    exit 1
fi 