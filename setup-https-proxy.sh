#!/bin/bash

echo "🔒 Настройка HTTPS прокси для WhatsApp Backend"
echo "=============================================="

# Установка Nginx
echo "[INFO] 📦 Установка Nginx..."
sudo apt update
sudo apt install -y nginx

# Создание директории для SSL сертификатов
echo "[INFO] 🔐 Создание SSL сертификатов..."
sudo mkdir -p /etc/nginx/ssl

# Создание самоподписанного SSL сертификата
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=WhatsApp-Backend/CN=35.194.39.8"

# Копирование конфигурации Nginx
echo "[INFO] ⚙️ Настройка Nginx конфигурации..."
sudo cp nginx-ssl.conf /etc/nginx/sites-available/whatsapp-ssl
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/whatsapp-ssl /etc/nginx/sites-enabled/

# Проверка конфигурации Nginx
echo "[INFO] ✅ Проверка конфигурации Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "[SUCCESS] ✅ Конфигурация Nginx корректна"
    
    # Перезапуск Nginx
    echo "[INFO] 🔄 Перезапуск Nginx..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    # Проверка статуса
    if sudo systemctl is-active --quiet nginx; then
        echo "[SUCCESS] 🎉 Nginx запущен успешно!"
        
        # Показать статус
        echo ""
        echo "📋 Информация о настройке:"
        echo "  🔗 HTTPS URL: https://35.194.39.8"
        echo "  🔗 Health Check: https://35.194.39.8/health"
        echo "  🔗 Socket.IO: https://35.194.39.8/socket.io/"
        echo ""
        echo "🔧 Настройка фронтенда:"
        echo "  VITE_BACKEND_URL=https://35.194.39.8"
        echo ""
        echo "⚠️ Важно: Браузер покажет предупреждение о самоподписанном сертификате"
        echo "   Нужно будет принять сертификат вручную при первом посещении"
        
    else
        echo "[ERROR] ❌ Ошибка запуска Nginx"
        sudo systemctl status nginx
        exit 1
    fi
else
    echo "[ERROR] ❌ Ошибка в конфигурации Nginx"
    exit 1
fi

# Обновление UFW правил для HTTPS
echo "[INFO] 🔥 Обновление Firewall правил..."
sudo ufw allow 443/tcp
sudo ufw reload

echo ""
echo "✅ HTTPS прокси настроен успешно!"
echo ""
echo "🔧 Следующие шаги:"
echo "1. Обновите API URL в фронтенде на: https://35.194.39.8"
echo "2. Откройте https://35.194.39.8 в браузере и примите сертификат"
echo "3. Протестируйте подключение: curl -k https://35.194.39.8/health"
echo ""
echo "📋 GCP Firewall правило:"
echo "gcloud compute firewall-rules create https-whatsapp \\"
echo "    --allow tcp:443 \\"
echo "    --source-ranges 0.0.0.0/0 \\"
echo "    --description 'HTTPS for WhatsApp Backend'" 