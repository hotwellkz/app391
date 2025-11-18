#!/bin/bash

set -e

echo "🚀 Полная настройка Production-сервера на Ubuntu (Google Cloud VM)"
echo "================================================================="
echo "🎯 Настраиваем Backend и Frontend (Vite + React + Node.js/Express)"
echo ""

# Цвета для логов
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Переменные для домена (настройте под свой проект)
DOMAIN="2wix.ru"
BACKEND_PORT="3000"
EMAIL="admin@${DOMAIN}"

# 1. 🔒 Настройка Google Cloud Firewall
setup_gcp_firewall() {
    log_step "1. 🔒 Настройка Google Cloud Firewall"
    
    log_info "Получаем информацию о текущей VM..."
    
    # Получаем имя VM и зону
    VM_NAME=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/name" -H "Metadata-Flavor: Google" 2>/dev/null || echo "")
    ZONE=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/zone" -H "Metadata-Flavor: Google" 2>/dev/null | cut -d/ -f4 || echo "")
    EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "")
    
    if [ -n "$VM_NAME" ] && [ -n "$ZONE" ]; then
        log_success "VM: $VM_NAME, Зона: $ZONE, IP: $EXTERNAL_IP"
        
        log_info "Создаем firewall правила в GCP..."
        
        # Создаем правило firewall для HTTP, HTTPS и backend порта
        gcloud compute firewall-rules create allow-whatsapp-production \
            --allow tcp:22,tcp:80,tcp:443,tcp:${BACKEND_PORT} \
            --source-ranges 0.0.0.0/0 \
            --description "WhatsApp Production Server Ports" \
            --target-tags whatsapp-production 2>/dev/null || log_warning "Правило firewall уже существует"
        
        # Добавляем тег к VM
        gcloud compute instances add-tags "$VM_NAME" \
            --tags whatsapp-production \
            --zone "$ZONE" 2>/dev/null || log_warning "Теги уже добавлены"
        
        log_success "GCP Firewall настроен для портов 22, 80, 443, ${BACKEND_PORT}"
    else
        log_warning "Не удалось получить данные VM из метаданных, пропускаем настройку GCP firewall"
        log_info "Настройте firewall вручную в Google Cloud Console"
    fi
    
    echo ""
}

# 2. 🌐 Настройка локального firewall (UFW)
setup_local_firewall() {
    log_step "2. 🔒 Настройка локального Firewall (UFW)"
    
    # Сбрасываем UFW
    sudo ufw --force reset
    
    # Базовые правила
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Разрешаем необходимые порты
    sudo ufw allow ssh
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp   # HTTP
    sudo ufw allow 443/tcp  # HTTPS
    sudo ufw allow ${BACKEND_PORT}/tcp  # Backend
    
    # Включаем UFW
    sudo ufw --force enable
    
    log_success "Локальный firewall настроен"
    sudo ufw status verbose
    echo ""
}

# 3. 🌍 Установка и настройка NGINX
setup_nginx() {
    log_step "3. 🌍 Установка и настройка NGINX"
    
    # Устанавливаем NGINX
    sudo apt-get update -y
    sudo apt-get install -y nginx
    
    # Получаем внешний IP
    EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null)
    
    # Создаем конфигурацию NGINX
    sudo tee /etc/nginx/sites-available/${DOMAIN} > /dev/null << EOF
# HTTP сервер (будет перенаправлять на HTTPS после установки SSL)
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN} ${EXTERNAL_IP};
    
    # Для получения SSL сертификата
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Остальные запросы проксируем на backend
    location / {
        # CORS заголовки
        add_header Access-Control-Allow-Origin "https://${DOMAIN}" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://${DOMAIN}";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control";
            add_header Access-Control-Allow-Credentials "true";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        # Проксирование к backend
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout настройки
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Socket.IO и WebSocket поддержка
    location /socket.io/ {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS для Socket.IO
        add_header Access-Control-Allow-Origin "https://${DOMAIN}" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }
    
    # Включаем gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF
    
    # Активируем сайт
    sudo ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Проверяем конфигурацию
    sudo nginx -t
    
    # Перезапускаем NGINX
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    log_success "NGINX установлен и настроен"
    echo ""
}

# 4. 🔐 Установка SSL сертификата через Let's Encrypt
setup_ssl() {
    log_step "4. 🔐 Установка SSL сертификата через Let's Encrypt"
    
    # Устанавливаем certbot
    sudo apt-get install -y certbot python3-certbot-nginx
    
    log_info "Получаем SSL сертификат для домена ${DOMAIN}..."
    log_warning "ВАЖНО: убедитесь, что домен ${DOMAIN} указывает на IP ${EXTERNAL_IP}"
    
    # Получаем сертификат
    sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} \
        --non-interactive \
        --agree-tos \
        --email ${EMAIL} \
        --redirect
    
    # Настраиваем автоматическое продление
    sudo crontab -l | grep -q certbot || (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -
    
    log_success "SSL сертификат установлен и настроено автопродление"
    echo ""
}

# 5. 🧠 Настройка переменных окружения
setup_environment() {
    log_step "5. 🧠 Настройка переменных окружения"
    
    EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null)
    
    # Создаем .env для backend
    log_info "Создаем .env файл для backend..."
    cat > .env << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=${BACKEND_PORT}
LOG_LEVEL=info

# Domain and CORS Configuration
FRONTEND_URL=https://${DOMAIN}
CORS_ORIGIN=https://${DOMAIN}
ALLOWED_ORIGINS=https://${DOMAIN},https://www.${DOMAIN},http://${EXTERNAL_IP}:${BACKEND_PORT}

# External IP
EXTERNAL_IP=${EXTERNAL_IP}

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=/app/data/.wwebjs_auth
WHATSAPP_SESSION_NAME=production

# Puppeteer/Chrome Configuration for Docker
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
CHROME_BIN=/usr/bin/chromium-browser
CHROME_FLAGS=--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu --single-process --no-zygote
CHROME_DEVEL_SANDBOX=false
CHROME_NO_SANDBOX=true
DISPLAY=:99
PUPPETEER_DISABLE_HEADLESS_WARNING=true

# Performance Tuning
NODE_OPTIONS=--max-old-space-size=2048
UV_THREADPOOL_SIZE=8

# Security
TRUST_PROXY=true

# Debugging
DEBUG_MODE=false
VERBOSE_LOGGING=false
EOF
    
    # Frontend environment для Vite
    log_info "Создаем .env файл для frontend..."
    cat > .env.frontend << EOF
# Frontend Environment Configuration
VITE_BACKEND_URL=https://${DOMAIN}
VITE_API_URL=https://${DOMAIN}
VITE_SOCKET_URL=https://${DOMAIN}
VITE_ENVIRONMENT=production
EOF
    
    log_success "Переменные окружения настроены"
    echo ""
}

# 6. 🐳 Установка и настройка Docker
setup_docker() {
    log_step "6. 🐳 Установка и настройка Docker"
    
    if command -v docker &> /dev/null; then
        log_success "Docker уже установлен: $(docker --version)"
    else
        log_info "Установка Docker..."
        
        # Устанавливаем Docker
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        
        # Устанавливаем Docker Compose
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
        
        log_success "Docker установлен: $(docker --version)"
        log_success "Docker Compose установлен: $(docker-compose --version)"
    fi
    
    # Создаем директории для данных
    mkdir -p ./data
    sudo chown -R $USER:$USER ./data
    
    echo ""
}

# 7. 🔁 Запуск и проверка сервера
start_and_verify() {
    log_step "7. 🔁 Запуск и проверка сервера"
    
    log_info "Запускаем backend через Docker..."
    
    # Останавливаем старые контейнеры
    docker-compose -f docker-compose.production.yml down 2>/dev/null || true
    
    # Собираем и запускаем
    docker-compose -f docker-compose.production.yml up -d --build
    
    log_info "Ожидаем запуска сервера..."
    sleep 30
    
    # Проверяем статус контейнеров
    docker-compose -f docker-compose.production.yml ps
    
    log_info "Проверяем доступность endpoints..."
    
    # Проверяем health endpoint
    for i in {1..10}; do
        if curl -f http://localhost:${BACKEND_PORT}/health >/dev/null 2>&1; then
            log_success "✅ Backend отвечает на http://localhost:${BACKEND_PORT}/health"
            break
        else
            log_warning "Попытка $i/10: Backend еще не готов, ждем..."
            sleep 10
        fi
    done
    
    # Проверяем HTTPS
    if curl -f https://${DOMAIN}/health >/dev/null 2>&1; then
        log_success "✅ HTTPS работает: https://${DOMAIN}/health"
    else
        log_warning "⚠️ HTTPS пока недоступен, проверьте настройки домена"
    fi
    
    echo ""
}

# 8. ✅ Итоговая проверка и отчет
final_report() {
    log_step "8. ✅ Итоговая проверка и отчет"
    
    EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null)
    
    echo ""
    echo "🎉 НАСТРОЙКА ЗАВЕРШЕНА!"
    echo "====================="
    echo ""
    echo "📋 ИНФОРМАЦИЯ О СЕРВЕРЕ:"
    echo "  🌐 Домен: https://${DOMAIN}"
    echo "  🌍 IP адрес: ${EXTERNAL_IP}"
    echo "  🔌 Backend порт: ${BACKEND_PORT}"
    echo ""
    echo "🔗 URLS ДЛЯ ТЕСТИРОВАНИЯ:"
    echo "  ✅ Health Check: https://${DOMAIN}/health"
    echo "  🔗 API: https://${DOMAIN}"
    echo "  🔌 Socket.IO: https://${DOMAIN}/socket.io/"
    echo ""
    echo "📱 НАСТРОЙКИ ДЛЯ FRONTEND:"
    echo "  VITE_BACKEND_URL=https://${DOMAIN}"
    echo "  VITE_API_URL=https://${DOMAIN}"
    echo "  VITE_SOCKET_URL=https://${DOMAIN}"
    echo ""
    echo "🛠️ КОМАНДЫ УПРАВЛЕНИЯ:"
    echo "  Статус:      docker-compose -f docker-compose.production.yml ps"
    echo "  Логи:        docker-compose -f docker-compose.production.yml logs -f"
    echo "  Перезапуск:  docker-compose -f docker-compose.production.yml restart"
    echo "  Остановка:   docker-compose -f docker-compose.production.yml down"
    echo ""
    echo "🔍 ПРОВЕРКИ:"
    
    # Проверки
    if curl -f http://localhost:${BACKEND_PORT}/health >/dev/null 2>&1; then
        echo "  ✅ Backend работает локально"
    else
        echo "  ❌ Backend не отвечает локально"
    fi
    
    if curl -f https://${DOMAIN}/health >/dev/null 2>&1; then
        echo "  ✅ HTTPS работает"
    else
        echo "  ⚠️ HTTPS недоступен (проверьте DNS)"
    fi
    
    if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
        echo "  ✅ Docker контейнеры запущены"
    else
        echo "  ❌ Проблемы с Docker контейнерами"
    fi
    
    if sudo nginx -t >/dev/null 2>&1; then
        echo "  ✅ NGINX конфигурация корректна"
    else
        echo "  ❌ Ошибки в конфигурации NGINX"
    fi
    
    echo ""
    echo "📋 СЛЕДУЮЩИЕ ШАГИ:"
    echo "  1. Убедитесь, что домен ${DOMAIN} указывает на IP ${EXTERNAL_IP}"
    echo "  2. Обновите настройки фронтенда с новым URL"
    echo "  3. Протестируйте все функции приложения"
    echo "  4. Настройте мониторинг и бэкапы"
    echo ""
    echo "🎯 ГОТОВО! Ваш сервер работает без ngrok и доступен из любой точки мира!"
    echo ""
}

# Основная функция выполнения
main() {
    log_info "Начинаем полную настройку production-сервера..."
    echo ""
    
    # Проверяем права sudo
    if ! sudo -n true 2>/dev/null; then
        log_error "Нужны права sudo для выполнения скрипта"
        exit 1
    fi
    
    # Выполняем все шаги
    setup_gcp_firewall
    setup_local_firewall
    setup_nginx
    setup_ssl
    setup_environment
    setup_docker
    start_and_verify
    final_report
}

# Запускаем основную функцию
main "$@" 