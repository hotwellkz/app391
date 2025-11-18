#!/bin/bash

set -e

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

# Функция получения внешнего IP
get_external_ip() {
    curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "localhost"
}

# Функция запуска
start_backend() {
    log_info "🚀 Запуск WhatsApp Backend..."
    
    # Создание папок
    mkdir -p data data/.wwebjs_auth data/.wwebjs_cache
    
    # Проверка .env
    if [ ! -f ".env" ]; then
        log_warning "Создание .env файла..."
        EXTERNAL_IP=$(get_external_ip)
        cat > .env << EOF
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
    fi
    
    # Запуск
    docker-compose -f docker-compose.production.yml up -d
    
    sleep 10
    
    # Проверка
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        EXTERNAL_IP=$(get_external_ip)
        log_success "✅ Backend запущен!"
        echo "🔗 URL: http://$EXTERNAL_IP:3000/health"
    else
        log_error "❌ Проблема при запуске"
        docker-compose -f docker-compose.production.yml logs --tail=30
    fi
}

# Функция остановки
stop_backend() {
    log_info "🛑 Остановка WhatsApp Backend..."
    docker-compose -f docker-compose.production.yml down
    log_success "✅ Backend остановлен"
}

# Функция перезапуска
restart_backend() {
    log_info "🔄 Перезапуск WhatsApp Backend..."
    stop_backend
    sleep 3
    start_backend
}

# Функция просмотра логов
logs_backend() {
    log_info "📋 Логи WhatsApp Backend..."
    docker-compose -f docker-compose.production.yml logs -f
}

# Функция статуса
status_backend() {
    log_info "📊 Статус WhatsApp Backend..."
    
    echo "🔸 Docker контейнеры:"
    docker-compose -f docker-compose.production.yml ps
    
    echo ""
    echo "🔸 Health Check:"
    if curl -f http://localhost:3000/health 2>/dev/null; then
        log_success "✅ Сервер работает"
    else
        log_error "❌ Сервер не отвечает"
    fi
    
    echo ""
    echo "🔸 URLs:"
    EXTERNAL_IP=$(get_external_ip)
    echo "  • API: http://$EXTERNAL_IP:3000"
    echo "  • Health: http://$EXTERNAL_IP:3000/health"
}

# Функция обновления
update_backend() {
    log_info "⬆️ Обновление WhatsApp Backend..."
    docker-compose -f docker-compose.production.yml down
    docker-compose -f docker-compose.production.yml build --no-cache
    docker-compose -f docker-compose.production.yml up -d
    
    sleep 10
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "✅ Backend обновлен и запущен"
    else
        log_error "❌ Проблема после обновления"
    fi
}

# Главное меню
show_help() {
    echo "🔧 WhatsApp Backend Management Script"
    echo "====================================="
    echo ""
    echo "Использование: $0 [команда]"
    echo ""
    echo "Команды:"
    echo "  start     - Запуск backend"
    echo "  stop      - Остановка backend"
    echo "  restart   - Перезапуск backend"
    echo "  logs      - Просмотр логов"
    echo "  status    - Проверка статуса"
    echo "  update    - Обновление (пересборка)"
    echo "  help      - Справка"
    echo ""
    echo "Примеры:"
    echo "  $0 start"
    echo "  $0 logs"
    echo "  $0 status"
}

# Обработка аргументов
case "${1:-help}" in
    start)
        start_backend
        ;;
    stop)
        stop_backend
        ;;
    restart)
        restart_backend
        ;;
    logs)
        logs_backend
        ;;
    status)
        status_backend
        ;;
    update)
        update_backend
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Неизвестная команда: $1"
        show_help
        exit 1
        ;;
esac 