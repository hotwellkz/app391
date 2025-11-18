#!/bin/bash

# Скрипт для обновления frontend конфигурации с новым backend URL

if [ -z "$1" ]; then
    echo "❌ Использование: $0 <новый_backend_url>"
    echo "Пример: $0 https://abc123-35-194-39-8.ngrok-free.app"
    exit 1
fi

NEW_BACKEND_URL="$1"

echo "🔧 Обновляем frontend конфигурацию..."
echo "🔗 Новый backend URL: $NEW_BACKEND_URL"

# Создаем временный файл конфигурации
cat > frontend_config_update.txt << EOF
Обновите следующие настройки в вашем frontend коде:

1. В файле src/config/api.ts:
   export const API_BASE_URL = '$NEW_BACKEND_URL'
   export const WEBSOCKET_URL = '$NEW_BACKEND_URL'

2. Или если используется переменная окружения:
   VITE_API_BASE_URL=$NEW_BACKEND_URL
   VITE_WEBSOCKET_URL=$NEW_BACKEND_URL

3. Пересоберите и переразверните frontend

EOF

echo "📋 Инструкции сохранены в frontend_config_update.txt"
cat frontend_config_update.txt

echo -e "\n✅ Готово! Теперь обновите frontend с новым URL и пересоберите проект." 