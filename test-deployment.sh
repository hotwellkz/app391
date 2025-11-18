#!/bin/bash

set -e

echo "🧪 Тестирование WhatsApp Backend Deployment"
echo "==========================================="

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[TEST]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[FAIL]${NC} $1"; }

# Получение внешнего IP
EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "localhost")

# Счетчики тестов
PASSED=0
FAILED=0
TOTAL=0

# Функция запуска теста
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    ((TOTAL++))
    log_info "Тест $TOTAL: $test_name"
    
    if eval "$test_command"; then
        log_success "$test_name"
        ((PASSED++))
        return 0
    else
        log_error "$test_name"
        ((FAILED++))
        return 1
    fi
}

echo ""
log_info "🔧 Начало комплексного тестирования..."
echo "External IP: $EXTERNAL_IP"
echo ""

# Тест 1: Docker установлен
run_test "Docker установлен и доступен" \
    "command -v docker >/dev/null 2>&1"

# Тест 2: Docker Compose установлен
run_test "Docker Compose установлен" \
    "command -v docker-compose >/dev/null 2>&1"

# Тест 3: UFW активен
run_test "UFW Firewall активен" \
    "sudo ufw status | grep -q 'Status: active'"

# Тест 4: Порт 3000 открыт в UFW
run_test "Порт 3000 открыт в UFW" \
    "sudo ufw status | grep -q '3000'"

# Тест 5: .env файл существует
run_test ".env файл существует" \
    "[ -f .env ]"

# Тест 6: docker-compose.production.yml существует
run_test "docker-compose.production.yml существует" \
    "[ -f docker-compose.production.yml ]"

# Тест 7: Папка data создана
run_test "Папка data для WhatsApp создана" \
    "[ -d data ]"

# Тест 8: Docker контейнер запущен
run_test "Docker контейнер backend запущен" \
    "docker ps | grep -q whatsapp-backend-prod"

# Тест 9: Локальный health check
run_test "Health check отвечает локально" \
    "curl -f http://localhost:3000/health >/dev/null 2>&1"

# Тест 10: Внешний health check
run_test "Health check доступен извне" \
    "curl -f http://$EXTERNAL_IP:3000/health >/dev/null 2>&1"

# Тест 11: API endpoints доступны
run_test "API endpoint /contacts доступен" \
    "curl -f http://$EXTERNAL_IP:3000/contacts >/dev/null 2>&1"

# Тест 12: CORS заголовки присутствуют
run_test "CORS заголовки настроены" \
    "curl -I http://$EXTERNAL_IP:3000/health 2>/dev/null | grep -q 'Access-Control-Allow-Origin'"

# Тест 13: Docker образ существует
run_test "Docker образ WhatsApp backend собран" \
    "docker images | grep -q whatsapp"

# Тест 14: Docker логи не содержат критических ошибок
run_test "Нет критических ошибок в логах" \
    "! docker-compose -f docker-compose.production.yml logs | grep -i 'error\\|fatal\\|exception' | grep -v 'No such container'"

# Тест 15: Порт 3000 прослушивается
run_test "Порт 3000 прослушивается процессом" \
    "sudo netstat -tlnp | grep -q ':3000'"

# Дополнительные проверки
echo ""
log_info "📊 Дополнительная диагностика..."

echo ""
echo "🔸 Статус Docker контейнеров:"
docker-compose -f docker-compose.production.yml ps 2>/dev/null || echo "Контейнеры не найдены"

echo ""
echo "🔸 Использование ресурсов:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "Статистика недоступна"

echo ""
echo "🔸 Последние 5 строк логов:"
docker-compose -f docker-compose.production.yml logs --tail=5 2>/dev/null || echo "Логи недоступны"

echo ""
echo "🔸 Открытые порты:"
sudo ss -tlnp | grep ':3000' || echo "Порт 3000 не найден"

echo ""
echo "🔸 Размер Docker образов:"
docker images | grep whatsapp || echo "Образы WhatsApp не найдены"

# Тест функциональности Socket.IO (если возможно)
echo ""
log_info "🔌 Тестирование Socket.IO..."

# Создаем временный Node.js скрипт для тестирования Socket.IO
cat > test_socket.js << 'EOF'
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
    timeout: 5000,
    forceNew: true
});

socket.on('connect', () => {
    console.log('Socket.IO: Connected');
    process.exit(0);
});

socket.on('connect_error', (error) => {
    console.log('Socket.IO: Connection failed -', error.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('Socket.IO: Connection timeout');
    process.exit(1);
}, 5000);
EOF

# Проверяем наличие Node.js и запускаем тест
if command -v node >/dev/null 2>&1 && npm list socket.io-client >/dev/null 2>&1; then
    run_test "Socket.IO соединение работает" \
        "timeout 10s node test_socket.js"
else
    log_warning "Socket.IO тест пропущен (нет Node.js или socket.io-client)"
fi

# Удаляем временный файл
rm -f test_socket.js

# Финальная статистика
echo ""
echo "🏁 Результаты тестирования:"
echo "=========================="
echo "Всего тестов: $TOTAL"
echo "Успешно: $PASSED"
echo "Ошибок: $FAILED"
echo "Успешность: $(( PASSED * 100 / TOTAL ))%"

if [ $FAILED -eq 0 ]; then
    echo ""
    log_success "🎉 Все тесты пройдены! Backend готов к работе."
    echo ""
    echo "📋 Информация для фронтенда:"
    echo "  API URL: http://$EXTERNAL_IP:3000"
    echo "  Health Check: http://$EXTERNAL_IP:3000/health"
    echo "  Socket.IO: http://$EXTERNAL_IP:3000"
    echo ""
    echo "🔗 Обновите эти URL в настройках фронтенда https://2wix.ru"
    echo ""
    echo "✅ Готово для подключения фронтенда!"
else
    echo ""
    log_error "❌ Обнаружены проблемы ($FAILED ошибок)"
    echo ""
    echo "🔧 Рекомендации по исправлению:"
    
    if [ $FAILED -gt 3 ]; then
        echo "  • Запустите ./quick-deploy.sh для повторной установки"
    fi
    
    echo "  • Проверьте логи: ./manage-backend.sh logs"
    echo "  • Проверьте статус: ./manage-backend.sh status"
    echo "  • Настройте GCP Firewall (см. GCP_FIREWALL_SETUP.md)"
    echo "  • Перезапустите backend: ./manage-backend.sh restart"
    echo ""
    
    exit 1
fi 