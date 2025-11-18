#!/bin/bash

set -e

echo "🚀 Запуск WhatsApp Backend на Google Cloud VM"
echo "=============================================="

# Цвета для логов
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker не установлен! Запустите сначала: ./deploy-gcp-vm.sh"
    exit 1
fi

# Проверка Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose не установлен! Запустите сначала: ./deploy-gcp-vm.sh"
    exit 1
fi

# Создание необходимых папок
log_info "Создание папок для данных..."
mkdir -p data
mkdir -p data/.wwebjs_auth
mkdir -p data/.wwebjs_cache

# Проверка .env файла
if [ ! -f ".env" ]; then
    log_warning ".env файл не найден! Создаю базовый файл..."
    
    EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
    
    cat > .env << EOF
# WhatsApp Server Production Configuration
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://2wix.ru
ALLOWED_ORIGINS=https://2wix.ru,https://www.2wix.ru,http://$EXTERNAL_IP:3000
WHATSAPP_SESSION_PATH=/app/data/.wwebjs_auth
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
DISPLAY=:99
DISABLE_SUPABASE=true
NODE_OPTIONS=--max-old-space-size=2048
EOF
    
    log_success ".env файл создан. Отредактируйте его при необходимости."
fi

# Получение внешнего IP
EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")

# Остановка существующих контейнеров
log_info "Остановка существующих контейнеров..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

# Пересборка образа (если нужно)
if [ "$1" = "--build" ] || [ "$1" = "-b" ]; then
    log_info "Пересборка Docker образа..."
    docker-compose -f docker-compose.production.yml build --no-cache
fi

# Запуск контейнеров
log_info "Запуск WhatsApp Backend..."
docker-compose -f docker-compose.production.yml up -d

# Ожидание запуска
log_info "Ожидание запуска сервера..."
sleep 10

# Проверка здоровья
log_info "Проверка состояния сервера..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    log_success "✅ Backend успешно запущен!"
    echo ""
    echo "🔗 URLs для доступа:"
    echo "  • Health Check: http://$EXTERNAL_IP:3000/health"
    echo "  • API Base URL: http://$EXTERNAL_IP:3000"
    echo ""
    echo "📋 Статус контейнеров:"
    docker-compose -f docker-compose.production.yml ps
    echo ""
    echo "🔧 Для просмотра логов: ./logs-backend.sh"
    echo "🛑 Для остановки: ./stop-backend.sh"
else
    log_error "❌ Сервер не отвечает на health check"
    log_info "Просмотр логов для диагностики:"
    docker-compose -f docker-compose.production.yml logs --tail=50
    exit 1
fi 