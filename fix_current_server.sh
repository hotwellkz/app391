#!/bin/bash

echo "=== ИСПРАВЛЕНИЕ BACKEND СЕРВЕРА ==="

cd ~/app375

echo "🔍 Текущий статус контейнера:"
docker ps -a

echo -e "\n🔍 Логи backend контейнера:"
docker logs whatsapp-backend-prod --tail 20

echo -e "\n🔍 Проверяем ngrok:"
ps aux | grep ngrok | grep -v grep

echo -e "\n🔍 Тестируем backend:"
curl -s http://localhost:3000/health || echo "❌ Backend не отвечает"

echo -e "\n=== ИСПРАВЛЯЕМ ПРОБЛЕМЫ ==="

# Останавливаем контейнеры
echo "🛑 Останавливаем контейнеры..."
docker-compose down

# Убиваем все chrome процессы (может быть блокировка профиля)
echo "🔧 Очищаем chrome процессы..."
docker exec whatsapp-backend-prod pkill -f chrome 2>/dev/null || true
sudo pkill -f chrome 2>/dev/null || true

# Очищаем sessions и chrome данные
echo "🧹 Очищаем старые данные..."
sudo rm -rf ./sessions/* 2>/dev/null || true
sudo rm -rf ./data/.wwebjs_auth/* 2>/dev/null || true

# Создаем правильный .env файл
echo "📝 Создаем правильный .env файл..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://2wix.ru,https://81b5-35-194-39-8.ngrok-free.app
CORS_CREDENTIALS=true
WEBHOOK_URL=https://81b5-35-194-39-8.ngrok-free.app/webhook
SESSION_SECRET=your-secret-key-here

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=/app/sessions
WHATSAPP_SESSION_NAME=production

# Chrome Configuration
CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-accelerated-2d-canvas,--no-first-run,--no-zygote,--single-process,--disable-gpu,--disable-features=VizDisplayCompositor
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Performance
NODE_OPTIONS=--max-old-space-size=2048
UV_THREADPOOL_SIZE=8

# Frontend
FRONTEND_URL=https://2wix.ru
ALLOWED_ORIGINS=https://2wix.ru,https://81b5-35-194-39-8.ngrok-free.app

# Security
TRUST_PROXY=true
DEBUG_MODE=false
DISABLE_SUPABASE=true
EOF

# Обновляем docker-compose.yml
echo "📝 Обновляем docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  whatsapp-backend:
    build: .
    container_name: whatsapp-backend-prod
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./sessions:/app/sessions
      - ./uploads:/app/uploads
      - ./data:/app/data
    restart: unless-stopped
    shm_size: '2gb'
    cap_add:
      - SYS_ADMIN
    security_opt:
      - seccomp:unconfined
    environment:
      - DISPLAY=:99
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
EOF

# Перезапускаем ngrok
echo "🌐 Перезапускаем ngrok..."
pkill -f ngrok 2>/dev/null || true
sleep 2
nohup ngrok http 3000 > ngrok.log 2>&1 &

echo "⏳ Ждем запуска ngrok (5 сек)..."
sleep 5

# Получаем новый ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | jq -r '.tunnels[0].public_url' 2>/dev/null)

if [ "$NGROK_URL" != "null" ] && [ ! -z "$NGROK_URL" ]; then
    echo "🔗 Новый ngrok URL: $NGROK_URL"
    
    # Обновляем .env с новым URL
    sed -i "s|https://.*ngrok-free.app|$NGROK_URL|g" .env
    echo "📝 Обновили .env с новым URL"
else
    echo "⚠️ Используем старый ngrok URL"
    NGROK_URL="https://81b5-35-194-39-8.ngrok-free.app"
fi

# Запускаем контейнеры
echo "🚀 Запускаем backend..."
docker-compose up -d --build

echo "⏳ Ждем запуска backend (15 сек)..."
sleep 15

# Проверяем результат
echo -e "\n=== ПРОВЕРКА РЕЗУЛЬТАТА ==="
echo "✅ Статус контейнеров:"
docker ps

echo -e "\n✅ Логи backend:"
docker logs whatsapp-backend-prod --tail 10

echo -e "\n✅ Тест backend:"
curl -s http://localhost:3000/health | jq . 2>/dev/null || curl -s http://localhost:3000/health

echo -e "\n✅ Тест ngrok:"
curl -s -H "Accept: application/json" "$NGROK_URL/health" | jq . 2>/dev/null || echo "❌ Проблема с ngrok доступом"

echo -e "\n🎉 ГОТОВО!"
echo "🔗 Backend URL: $NGROK_URL"
echo "📋 Обновите frontend конфигурацию с этим URL"

# Сохраняем URL для использования
echo "$NGROK_URL" > current_backend_url.txt
echo "💾 URL сохранен в файл current_backend_url.txt" 