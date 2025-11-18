#!/bin/bash

echo "=== ПРОВЕРКА СОСТОЯНИЯ СЕРВЕРА ==="

# Переходим в папку проекта
cd ~/app375

# Проверяем состояние контейнеров
echo "🔍 Состояние Docker контейнеров:"
docker ps -a

echo -e "\n🔍 Логи backend контейнера:"
docker logs whatsapp-backend --tail 20

echo -e "\n🔍 Текущий .env файл:"
cat .env

echo -e "\n🔍 Проверяем ngrok процесс:"
ps aux | grep ngrok

echo -e "\n🔍 Тестируем локальный backend:"
curl -s http://localhost:3000/health || echo "Backend не отвечает"

echo -e "\n=== ИСПРАВЛЕНИЕ ПРОБЛЕМ ==="

# Останавливаем контейнеры
echo "🛑 Останавливаем контейнеры..."
docker-compose down

# Исправляем .env файл с правильными CORS настройками
echo "📝 Обновляем .env файл..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://2wix.ru,https://81b5-35-194-39-8.ngrok-free.app
CORS_CREDENTIALS=true
WEBHOOK_URL=https://81b5-35-194-39-8.ngrok-free.app/webhook
SESSION_SECRET=your-secret-key-here
CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-accelerated-2d-canvas,--no-first-run,--no-zygote,--single-process,--disable-gpu
EOF

# Исправляем docker-compose.yml для правильного монтирования .env
echo "📝 Обновляем docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  whatsapp-backend:
    build: .
    container_name: whatsapp-backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - CORS_ORIGIN=https://2wix.ru,https://81b5-35-194-39-8.ngrok-free.app
      - CORS_CREDENTIALS=true
      - WEBHOOK_URL=https://81b5-35-194-39-8.ngrok-free.app/webhook
      - SESSION_SECRET=your-secret-key-here
      - CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
      - PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-accelerated-2d-canvas,--no-first-run,--no-zygote,--single-process,--disable-gpu
    volumes:
      - ./sessions:/app/sessions
      - ./uploads:/app/uploads
    restart: unless-stopped
    shm_size: '2gb'
    cap_add:
      - SYS_ADMIN
EOF

# Запускаем контейнеры заново
echo "🚀 Запускаем контейнеры..."
docker-compose up -d --build

# Ждем запуска
echo "⏳ Ждем запуска backend (10 секунд)..."
sleep 10

# Проверяем статус
echo "✅ Проверяем новый статус:"
docker ps
docker logs whatsapp-backend --tail 10

# Тестируем backend
echo -e "\n🧪 Тестируем backend:"
curl -s http://localhost:3000/health | jq . || curl -s http://localhost:3000/health

echo -e "\n=== ПРОВЕРЯЕМ NGROK ==="
# Убиваем старые процессы ngrok
pkill -f ngrok

# Запускаем ngrok заново
echo "🌐 Запускаем ngrok..."
nohup ngrok http 3000 > ngrok.log 2>&1 &

# Ждем запуска ngrok
sleep 5

# Получаем новый URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
echo "🔗 Новый ngrok URL: $NGROK_URL"

# Обновляем .env с новым URL
if [ ! -z "$NGROK_URL" ]; then
    sed -i "s|https://.*ngrok-free.app|$NGROK_URL|g" .env
    echo "📝 Обновили .env с новым ngrok URL"
    
    # Перезапускаем контейнеры с новым URL
    docker-compose down
    docker-compose up -d
    
    echo "✅ Готово! Новый backend URL: $NGROK_URL"
    echo "📋 Обновите frontend конфигурацию с этим URL"
else
    echo "❌ Не удалось получить ngrok URL"
fi

echo -e "\n=== ФИНАЛЬНАЯ ПРОВЕРКА ==="
sleep 5
curl -s -H "Accept: application/json" "$NGROK_URL/health" | jq . || echo "Проблема с доступом к $NGROK_URL" 