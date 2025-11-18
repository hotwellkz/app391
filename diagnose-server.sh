#!/bin/bash

echo "🔍 Диагностика Production-сервера"
echo "================================="
echo ""

# Цвета для логов
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✅]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠️]${NC} $1"
}

log_error() {
    echo -e "${RED}[❌]${NC} $1"
}

# Переменные
DOMAIN="2wix.ru"
BACKEND_PORT="3000"

# Получаем внешний IP
EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "unknown")

echo "🌐 Проверяем сервер:"
echo "  Домен: ${DOMAIN}"
echo "  IP: ${EXTERNAL_IP}"
echo "  Backend Port: ${BACKEND_PORT}"
echo ""

# 1. Проверка базовой системы
echo "1. 🖥️ Проверка системы"
echo "====================="

# Проверка ресурсов
echo "💾 Использование диска:"
df -h | head -2

echo ""
echo "🧠 Использование памяти:"
free -h

echo ""
echo "⚡ Загрузка CPU:"
uptime

echo ""
echo "🔗 Сетевые соединения:"
netstat -tlnp | grep -E "(80|443|${BACKEND_PORT})" | head -10

echo ""

# 2. Проверка Docker
echo "2. 🐳 Проверка Docker"
echo "===================="

if command -v docker &> /dev/null; then
    log_success "Docker установлен: $(docker --version)"
    
    echo ""
    echo "📦 Состояние контейнеров:"
    docker ps -a
    
    echo ""
    if [ -f "docker-compose.production.yml" ]; then
        echo "🔧 Docker Compose статус:"
        docker-compose -f docker-compose.production.yml ps
        
        echo ""
        echo "📊 Использование ресурсов контейнерами:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    else
        log_warning "docker-compose.production.yml не найден"
    fi
else
    log_error "Docker не установлен"
fi

echo ""

# 3. Проверка портов и сетевой доступности
echo "3. 🔌 Проверка портов"
echo "===================="

check_port() {
    local port=$1
    local description=$2
    
    if netstat -tlnp | grep -q ":${port} "; then
        log_success "Порт ${port} (${description}) открыт"
    else
        log_error "Порт ${port} (${description}) закрыт"
    fi
}

check_port "22" "SSH"
check_port "80" "HTTP"
check_port "443" "HTTPS"
check_port "${BACKEND_PORT}" "Backend"

echo ""

# 4. Проверка firewall
echo "4. 🔒 Проверка Firewall"
echo "======================"

echo "UFW статус:"
sudo ufw status verbose

echo ""

# 5. Проверка NGINX
echo "5. 🌍 Проверка NGINX"
echo "==================="

if command -v nginx &> /dev/null; then
    log_success "NGINX установлен: $(nginx -v 2>&1)"
    
    echo ""
    echo "📊 Статус NGINX:"
    sudo systemctl status nginx --no-pager -l
    
    echo ""
    echo "🔧 Проверка конфигурации:"
    if sudo nginx -t &>/dev/null; then
        log_success "Конфигурация NGINX корректна"
    else
        log_error "Ошибки в конфигурации NGINX:"
        sudo nginx -t
    fi
    
    echo ""
    echo "📂 Активные сайты:"
    ls -la /etc/nginx/sites-enabled/
    
    if [ -f "/etc/nginx/sites-enabled/${DOMAIN}" ]; then
        log_success "Конфигурация для ${DOMAIN} активна"
    else
        log_warning "Конфигурация для ${DOMAIN} не найдена"
    fi
else
    log_error "NGINX не установлен"
fi

echo ""

# 6. Проверка SSL сертификатов
echo "6. 🔐 Проверка SSL"
echo "=================="

if command -v certbot &> /dev/null; then
    log_success "Certbot установлен: $(certbot --version 2>&1 | head -1)"
    
    echo ""
    echo "📜 SSL сертификаты:"
    sudo certbot certificates 2>/dev/null || echo "Нет активных сертификатов"
    
    echo ""
    echo "🔍 Проверка SSL для ${DOMAIN}:"
    if echo | timeout 5 openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} 2>/dev/null | grep -q "Verify return code: 0"; then
        log_success "SSL сертификат для ${DOMAIN} валиден"
    else
        log_warning "Проблемы с SSL сертификатом для ${DOMAIN}"
    fi
else
    log_error "Certbot не установлен"
fi

echo ""

# 7. Проверка API endpoints
echo "7. 🔗 Проверка API"
echo "=================="

check_endpoint() {
    local url=$1
    local description=$2
    
    echo "Проверяем ${description}: ${url}"
    
    if curl -f -s --max-time 10 "${url}" > /dev/null 2>&1; then
        log_success "${description} доступен"
    else
        log_error "${description} недоступен"
        # Показываем детали ошибки
        echo "  Детали:"
        curl -v --max-time 10 "${url}" 2>&1 | head -5 | sed 's/^/    /'
    fi
}

# Проверяем локально
check_endpoint "http://localhost:${BACKEND_PORT}/health" "Backend локально"

# Проверяем через IP
check_endpoint "http://${EXTERNAL_IP}:${BACKEND_PORT}/health" "Backend через IP"

# Проверяем через домен HTTP
check_endpoint "http://${DOMAIN}/health" "Backend через HTTP домен"

# Проверяем через домен HTTPS
check_endpoint "https://${DOMAIN}/health" "Backend через HTTPS домен"

echo ""

# 8. Проверка DNS
echo "8. 📡 Проверка DNS"
echo "=================="

echo "DNS записи для ${DOMAIN}:"
nslookup ${DOMAIN} 2>/dev/null || dig ${DOMAIN} A +short 2>/dev/null || echo "Не удалось получить DNS"

echo ""
echo "DNS записи для www.${DOMAIN}:"
nslookup www.${DOMAIN} 2>/dev/null || dig www.${DOMAIN} A +short 2>/dev/null || echo "Не удалось получить DNS"

echo ""

# 9. Проверка логов
echo "9. 📋 Проверка логов"
echo "==================="

echo "🐳 Последние логи Docker контейнеров:"
if [ -f "docker-compose.production.yml" ]; then
    docker-compose -f docker-compose.production.yml logs --tail=10 2>/dev/null || echo "Нет логов Docker Compose"
else
    docker logs $(docker ps -q) --tail=10 2>/dev/null || echo "Нет активных контейнеров"
fi

echo ""
echo "🌍 Последние логи NGINX:"
sudo tail -n 10 /var/log/nginx/error.log 2>/dev/null || echo "Нет логов NGINX"

echo ""
echo "🔒 Последние логи системы:"
sudo journalctl --since "1 hour ago" --no-pager -l | tail -10 2>/dev/null || echo "Нет системных логов"

echo ""

# 10. Проверка переменных окружения
echo "10. 🧠 Проверка переменных окружения"
echo "==================================="

if [ -f ".env" ]; then
    echo "📄 Содержимое .env файла:"
    cat .env | grep -v -E "^#|^$" | head -20
else
    log_warning ".env файл не найден"
fi

echo ""

# 11. Итоговая сводка
echo "11. 📊 ИТОГОВАЯ СВОДКА"
echo "===================="

echo ""
echo "🎯 РЕЗУЛЬТАТЫ ДИАГНОСТИКИ:"

# Общая проверка статуса
overall_status="✅"

if ! command -v docker &> /dev/null; then
    echo "  ❌ Docker: не установлен"
    overall_status="❌"
else
    echo "  ✅ Docker: установлен и работает"
fi

if ! command -v nginx &> /dev/null; then
    echo "  ❌ NGINX: не установлен"
    overall_status="❌"
else
    if sudo nginx -t &>/dev/null; then
        echo "  ✅ NGINX: установлен и настроен"
    else
        echo "  ⚠️ NGINX: установлен, но есть ошибки конфигурации"
        overall_status="⚠️"
    fi
fi

if curl -f -s --max-time 5 "http://localhost:${BACKEND_PORT}/health" > /dev/null 2>&1; then
    echo "  ✅ Backend: работает локально"
else
    echo "  ❌ Backend: не отвечает локально"
    overall_status="❌"
fi

if curl -f -s --max-time 5 "https://${DOMAIN}/health" > /dev/null 2>&1; then
    echo "  ✅ HTTPS: работает"
else
    echo "  ⚠️ HTTPS: недоступен или проблемы с DNS"
    if [ "$overall_status" != "❌" ]; then
        overall_status="⚠️"
    fi
fi

echo ""
echo "🏁 ОБЩИЙ СТАТУС: ${overall_status}"

if [ "$overall_status" = "✅" ]; then
    echo "🎉 Сервер работает корректно!"
elif [ "$overall_status" = "⚠️" ]; then
    echo "⚠️ Сервер работает, но есть проблемы для исправления"
else
    echo "❌ Сервер имеет критические проблемы"
fi

echo ""
echo "📋 РЕКОМЕНДАЦИИ:"
if [ "$overall_status" != "✅" ]; then
    echo "  1. Проверьте логи выше для понимания проблем"
    echo "  2. Убедитесь, что домен ${DOMAIN} указывает на IP ${EXTERNAL_IP}"
    echo "  3. Проверьте настройки firewall в Google Cloud"
    echo "  4. Перезапустите сервисы: sudo systemctl restart nginx docker"
    echo "  5. Перезапустите контейнеры: docker-compose -f docker-compose.production.yml restart"
fi

echo ""
echo "🔗 ПОЛЕЗНЫЕ КОМАНДЫ:"
echo "  Логи в реальном времени: docker-compose -f docker-compose.production.yml logs -f"
echo "  Перезапуск NGINX: sudo systemctl restart nginx"
echo "  Перезапуск backend: docker-compose -f docker-compose.production.yml restart"
echo "  Проверка портов: netstat -tlnp | grep -E '(80|443|3000)'"

echo ""
echo "🎯 ДИАГНОСТИКА ЗАВЕРШЕНА!" 