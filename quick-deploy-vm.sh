#!/bin/bash

echo "🚀 Быстрое развертывание WhatsApp Server на Google Cloud VM"
echo "============================================================"

# Проверяем что мы в правильной директории
if [ ! -d "whatsapp-server" ]; then
    echo "❌ Ошибка: whatsapp-server директория не найдена"
    echo "📁 Перейдите в корневую директорию проекта"
    exit 1
fi

# 1. Остановка и очистка
echo "🛑 Шаг 1: Остановка и очистка старых контейнеров..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker system prune -af --volumes

# 2. Обновление кода
echo "📥 Шаг 2: Обновление кода из GitHub..."
git pull origin main

# 3. Создание правильного .env файла
echo "📝 Шаг 3: Создание оптимизированного .env файла..."
cd whatsapp-server

rm -f .env
cat > .env << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Frontend Configuration
FRONTEND_URL=https://2wix.ru/whatsapp
ALLOWED_ORIGINS=https://2wix.ru,https://www.2wix.ru,https://2wix.ru/whatsapp,https://www.2wix.ru/whatsapp

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=/app/data/.wwebjs_auth
WHATSAPP_CACHE_PATH=/app/data/.wwebjs_cache

# Puppeteer/Chrome Configuration  
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
CHROME_BIN=/usr/bin/chromium-browser
CHROME_PATH=/usr/bin/chromium-browser

# Supabase Configuration (DISABLED)
DISABLE_SUPABASE=true
SUPABASE_URL=disabled
SUPABASE_ANON_KEY=disabled
SUPABASE_SERVICE_KEY=disabled

# Performance Tuning
NODE_OPTIONS=--max-old-space-size=1024
EOF

cd ..

# 4. Подготовка директорий
echo "📁 Шаг 4: Подготовка директорий данных..."
mkdir -p ./whatsapp-server/data/.wwebjs_auth ./whatsapp-server/data/.wwebjs_cache
sudo chown -R 1001:1001 ./whatsapp-server/data
chmod -R 755 ./whatsapp-server/data

# 5. Сборка образа
echo "🔨 Шаг 5: Сборка Docker образа..."
docker-compose build --no-cache

# 6. Запуск сервера
echo "🚀 Шаг 6: Запуск WhatsApp Server..."
docker-compose up -d

# 7. Ожидание запуска
echo "⏳ Ожидание запуска сервера..."
sleep 10

# 8. Проверка статуса
echo "📊 Проверка статуса:"
echo "===================="
docker ps
echo ""
echo "📋 Последние логи:"
echo "=================="
docker logs whatsapp-server --tail 20

echo ""
echo "✅ Развертывание завершено!"
echo "🌐 Сервер доступен на: http://$(curl -s ifconfig.me):3000"
echo "📖 Для просмотра логов: docker logs -f whatsapp-server"
echo "🔍 Для проверки health: curl http://localhost:3000/health" 