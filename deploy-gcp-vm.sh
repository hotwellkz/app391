#!/bin/bash

set -e

echo "🚀 Настройка Google Cloud VM для WhatsApp Backend"
echo "=================================================="

# Цвета для логов
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Функция проверки и установки Docker
install_docker() {
    log_info "Проверка установки Docker..."
    
    if command -v docker &> /dev/null; then
        log_success "Docker уже установлен: $(docker --version)"
    else
        log_info "Установка Docker..."
        
        # Обновляем систему
        sudo apt-get update -y
        
        # Устанавливаем необходимые пакеты
        sudo apt-get install -y \
            apt-transport-https \
            ca-certificates \
            curl \
            gnupg \
            lsb-release \
            software-properties-common \
            ufw \
            nginx \
            certbot \
            python3-certbot-nginx
        
        # Добавляем официальный GPG ключ Docker
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Добавляем репозиторий Docker
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Устанавливаем Docker
        sudo apt-get update -y
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io
        
        # Добавляем текущего пользователя в группу docker
        sudo usermod -aG docker $USER
        
        log_success "Docker установлен: $(docker --version)"
    fi
}

# Функция проверки и установки Docker Compose
install_docker_compose() {
    log_info "Проверка установки Docker Compose..."
    
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose уже установлен: $(docker-compose --version)"
    else
        log_info "Установка Docker Compose..."
        
        # Скачиваем последнюю версию Docker Compose
        DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
        sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        
        # Делаем исполняемым
        sudo chmod +x /usr/local/bin/docker-compose
        
        # Создаем симлинк
        sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
        
        log_success "Docker Compose установлен: $(docker-compose --version)"
    fi
}

# Функция настройки firewall
setup_firewall() {
    log_info "Настройка firewall правил..."
    
    # Сбрасываем UFW
    sudo ufw --force reset
    
    # Базовые правила
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Разрешаем SSH
    sudo ufw allow ssh
    sudo ufw allow 22/tcp
    
    # Разрешаем HTTP и HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Разрешаем наш backend порт
    sudo ufw allow 3000/tcp
    
    # Включаем UFW
    sudo ufw --force enable
    
    log_success "Firewall настроен"
    sudo ufw status verbose
}

# Функция получения внешнего IP
get_external_ip() {
    log_info "Получение внешнего IP адреса..."
    
    EXTERNAL_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || curl -s ipecho.net/plain)
    
    if [ -n "$EXTERNAL_IP" ]; then
        log_success "Внешний IP: $EXTERNAL_IP"
        echo "EXTERNAL_IP=$EXTERNAL_IP" > .env.ip
        
        # Показываем URL для тестирования
        echo ""
        log_info "🔗 URLs для тестирования:"
        echo "  Backend API: http://$EXTERNAL_IP:3000/health"
        echo ""
    else
        log_error "Не удалось получить внешний IP"
        exit 1
    fi
}

# Функция создания оптимизированного .env файла
create_production_env() {
    log_info "Создание .env файла для продакшена..."
    
    # Получаем внешний IP если есть
    EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
    
    cat > .env << EOF
# WhatsApp Server Production Configuration for Google Cloud VM
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# External IP Configuration
EXTERNAL_IP=$EXTERNAL_IP

# Frontend Configuration - ВАШИ НАСТРОЙКИ!
FRONTEND_URL=https://2wix.ru
ALLOWED_ORIGINS=https://2wix.ru,https://www.2wix.ru,http://$EXTERNAL_IP:3000

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=/app/data/.wwebjs_auth
WHATSAPP_SESSION_NAME=production

# Puppeteer/Chrome Configuration for Docker
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
CHROME_BIN=/usr/bin/chromium-browser

# Docker/VM Optimizations
DISPLAY=:99
DISABLE_SETUID_SANDBOX=true

# Supabase (отключено для начала)
DISABLE_SUPABASE=true

# Performance Tuning
NODE_OPTIONS=--max-old-space-size=2048
UV_THREADPOOL_SIZE=8

# Security
TRUST_PROXY=true

# Debugging
DEBUG_MODE=false
VERBOSE_LOGGING=false
EOF

    log_success ".env файл создан"
}

# Основная функция выполнения
main() {
    log_info "Начало настройки Google Cloud VM..."
    
    # Проверяем права sudo
    if ! sudo -n true 2>/dev/null; then
        log_error "Нужны права sudo для выполнения скрипта"
        exit 1
    fi
    
    # Выполняем установку и настройку
    install_docker
    install_docker_compose
    setup_firewall
    get_external_ip
    create_production_env
    
    echo ""
    log_success "🎉 Настройка VM завершена!"
    echo ""
    log_info "📋 Следующие шаги:"
    echo "  1. Скопируйте ваш код на VM"
    echo "  2. Запустите: docker-compose up -d"
    echo "  3. Проверьте: http://$(cat .env.ip | cut -d= -f2):3000/health"
    echo "  4. Обновите API URL в фронтенде"
    echo ""
}

# Запускаем основную функцию
main "$@" 