#!/bin/bash

set -e

echo "⚡ Quick Deploy - WhatsApp Backend to Google Cloud VM"
echo "===================================================="

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Проверка sudo
if ! sudo -n true 2>/dev/null; then
    log_error "Требуются права sudo!"
    exit 1
fi

log_info "🔧 Этап 1: Установка Docker и зависимостей..."

# Docker
if ! command -v docker &> /dev/null; then
    log_info "Установка Docker..."
    sudo apt-get update -y
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker $USER
    log_success "Docker установлен"
else
    log_success "Docker уже установлен"
fi

# Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_info "Установка Docker Compose..."
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    log_success "Docker Compose установлен"
else
    log_success "Docker Compose уже установлен"
fi

log_info "🔥 Этап 2: Настройка Firewall..."

# UFW
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable
log_success "UFW настроен"

log_info "🌐 Этап 3: Получение IP и создание .env..."

# Внешний IP
EXTERNAL_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "localhost")
log_success "Внешний IP: $EXTERNAL_IP"

# .env файл
cat > .env << EOF
# WhatsApp Backend Production Configuration
PORT=3000
NODE_ENV=production
EXTERNAL_IP=$EXTERNAL_IP

# Frontend Configuration - ОБНОВИТЕ ДОМЕН!
FRONTEND_URL=https://2wix.ru
ALLOWED_ORIGINS=https://2wix.ru,https://www.2wix.ru,http://$EXTERNAL_IP:3000

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=/app/data/.wwebjs_auth
WHATSAPP_SESSION_NAME=production

# Docker/Chrome Configuration
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
DISPLAY=:99
DISABLE_SETUID_SANDBOX=true

# Supabase (отключено)
DISABLE_SUPABASE=true

# Performance
NODE_OPTIONS=--max-old-space-size=2048
UV_THREADPOOL_SIZE=8

# Security
TRUST_PROXY=true
DEBUG_MODE=false
EOF

log_success ".env файл создан"

log_info "🚀 Этап 4: Запуск Backend..."

# Создание папок
mkdir -p data data/.wwebjs_auth data/.wwebjs_cache

# Запуск
if [ -f "docker-compose.production.yml" ]; then
    docker-compose -f docker-compose.production.yml down 2>/dev/null || true
    docker-compose -f docker-compose.production.yml up -d
    
    # Ожидание запуска
    log_info "Ожидание запуска сервера..."
    sleep 15
    
    # Проверка
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "✅ Backend успешно запущен!"
    else
        log_warning "⚠️ Backend запущен, но health check не отвечает"
        log_info "Просмотр логов:"
        docker-compose -f docker-compose.production.yml logs --tail=20
    fi
else
    log_warning "docker-compose.production.yml не найден, используем стандартный"
    docker-compose up -d
fi

# Финальная информация
echo ""
log_success "🎉 Деплой завершен!"
echo ""
echo "📋 Информация для подключения:"
echo "  🔗 Health Check: http://$EXTERNAL_IP:3000/health"
echo "  🔗 API Base URL: http://$EXTERNAL_IP:3000"
echo "  🔗 Socket.IO URL: http://$EXTERNAL_IP:3000"
echo ""
echo "📋 Следующие шаги:"
echo "  1. Настройте GCP Firewall (см. GCP_FIREWALL_SETUP.md)"
echo "  2. Обновите API URL в фронтенде https://2wix.ru"
echo "  3. Протестируйте подключение"
echo ""
echo "🔧 Управление:"
echo "  ./manage-backend.sh status  - Проверка статуса"
echo "  ./manage-backend.sh logs    - Просмотр логов"
echo "  ./manage-backend.sh restart - Перезапуск"
echo ""

# GCP Firewall инструкция
echo "🔥 ВАЖНО: Настройте GCP Firewall правила:"
echo ""
echo "gcloud compute firewall-rules create whatsapp-backend-ports \\"
echo "    --allow tcp:22,tcp:80,tcp:443,tcp:3000 \\"
echo "    --source-ranges 0.0.0.0/0 \\"
echo "    --description 'WhatsApp Backend Ports'"
echo ""
echo "gcloud compute instances add-tags VM_NAME \\"
echo "    --tags whatsapp-backend \\"
echo "    --zone YOUR_ZONE"
echo ""

# Проверочные команды
echo "✅ Проверочные команды:"
echo "  curl -I http://$EXTERNAL_IP:3000/health"
echo "  curl http://$EXTERNAL_IP:3000/contacts"
echo "" 