#!/bin/bash

echo "🔧 Обновление переменных окружения Frontend для домена 2wix.ru"
echo "=============================================================="

# Переменные
DOMAIN="2wix.ru"
BACKEND_URL="https://${DOMAIN}"

# Получаем внешний IP
EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "unknown")

echo "🌐 Настраиваем Frontend для работы с:"
echo "  Домен: ${DOMAIN}"
echo "  Backend URL: ${BACKEND_URL}"
echo "  IP: ${EXTERNAL_IP}"
echo ""

# Создаем .env файл для Vite (корень проекта)
echo "📝 Создаем .env файл для Vite..."
cat > .env << EOF
# Production Frontend Environment
VITE_BACKEND_URL=${BACKEND_URL}
VITE_API_URL=${BACKEND_URL}
VITE_SOCKET_URL=${BACKEND_URL}
VITE_ENVIRONMENT=production
VITE_APP_ENV=production

# Fallback URLs
VITE_FALLBACK_API_URL=http://${EXTERNAL_IP}:3000
EOF

# Создаем .env.production файл
echo "📝 Создаем .env.production файл..."
cat > .env.production << EOF
# Production Frontend Environment
VITE_BACKEND_URL=${BACKEND_URL}
VITE_API_URL=${BACKEND_URL}
VITE_SOCKET_URL=${BACKEND_URL}
VITE_ENVIRONMENT=production
VITE_APP_ENV=production
EOF

# Создаем или обновляем конфигурационный файл
echo "📝 Создаем config файл для приложения..."
mkdir -p src/config
cat > src/config/environment.ts << EOF
// Автоматически сгенерированный файл конфигурации для production
export const config = {
  API_URL: '${BACKEND_URL}',
  BACKEND_URL: '${BACKEND_URL}',
  SOCKET_URL: '${BACKEND_URL}',
  ENVIRONMENT: 'production',
  
  // WebSocket настройки
  WEBSOCKET_URL: '${BACKEND_URL}',
  SOCKET_IO_URL: '${BACKEND_URL}',
  
  // Fallback URLs
  FALLBACK_API_URL: 'http://${EXTERNAL_IP}:3000',
  
  // CORS настройки
  ALLOWED_ORIGINS: [
    '${BACKEND_URL}',
    'https://www.${DOMAIN}',
    'http://${EXTERNAL_IP}:3000'
  ],
  
  // Настройки для развертывания
  DOMAIN: '${DOMAIN}',
  EXTERNAL_IP: '${EXTERNAL_IP}',
  
  // Отладка
  DEBUG: false,
  LOG_LEVEL: 'error'
};

export default config;
EOF

# Создаем JavaScript версию для совместимости
cat > src/config/environment.js << EOF
// Автоматически сгенерированный файл конфигурации для production
export const config = {
  API_URL: '${BACKEND_URL}',
  BACKEND_URL: '${BACKEND_URL}',
  SOCKET_URL: '${BACKEND_URL}',
  ENVIRONMENT: 'production',
  
  // WebSocket настройки
  WEBSOCKET_URL: '${BACKEND_URL}',
  SOCKET_IO_URL: '${BACKEND_URL}',
  
  // Fallback URLs
  FALLBACK_API_URL: 'http://${EXTERNAL_IP}:3000',
  
  // CORS настройки
  ALLOWED_ORIGINS: [
    '${BACKEND_URL}',
    'https://www.${DOMAIN}',
    'http://${EXTERNAL_IP}:3000'
  ],
  
  // Настройки для развертывания
  DOMAIN: '${DOMAIN}',
  EXTERNAL_IP: '${EXTERNAL_IP}',
  
  // Отладка
  DEBUG: false,
  LOG_LEVEL: 'error'
};

export default config;
EOF

# Обновляем vite.config.ts для production
echo "📝 Проверяем vite.config.ts..."
if [ -f "vite.config.ts" ]; then
    # Создаем бекап
    cp vite.config.ts vite.config.ts.backup
    
    # Обновляем конфигурацию Vite
    cat > vite.config.ts << EOF
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  },
  define: {
    'process.env.VITE_BACKEND_URL': JSON.stringify('${BACKEND_URL}'),
    'process.env.VITE_API_URL': JSON.stringify('${BACKEND_URL}'),
    'process.env.VITE_SOCKET_URL': JSON.stringify('${BACKEND_URL}'),
    'process.env.VITE_ENVIRONMENT': JSON.stringify('production')
  },
  preview: {
    host: true,
    port: 4173
  }
})
EOF
    echo "✅ vite.config.ts обновлен"
else
    echo "⚠️ vite.config.ts не найден, создаем новый..."
    # Создаем новый vite.config.ts
    cat > vite.config.ts << EOF
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  },
  define: {
    'process.env.VITE_BACKEND_URL': JSON.stringify('${BACKEND_URL}'),
    'process.env.VITE_API_URL': JSON.stringify('${BACKEND_URL}'),
    'process.env.VITE_SOCKET_URL': JSON.stringify('${BACKEND_URL}'),
    'process.env.VITE_ENVIRONMENT': JSON.stringify('production')
  }
})
EOF
fi

echo ""
echo "✅ FRONTEND НАСТРОЕН!"
echo "===================="
echo ""
echo "📝 Созданные файлы:"
echo "  ✅ .env"
echo "  ✅ .env.production"
echo "  ✅ src/config/environment.ts"
echo "  ✅ src/config/environment.js"
echo "  ✅ vite.config.ts (обновлен)"
echo ""
echo "🔧 Переменные окружения:"
echo "  VITE_BACKEND_URL=${BACKEND_URL}"
echo "  VITE_API_URL=${BACKEND_URL}"
echo "  VITE_SOCKET_URL=${BACKEND_URL}"
echo "  VITE_ENVIRONMENT=production"
echo ""
echo "📋 Следующие шаги:"
echo "  1. Пересоберите frontend: npm run build"
echo "  2. Или запустите в dev режиме: npm run dev"
echo "  3. Проверьте подключение к ${BACKEND_URL}"
echo ""
echo "🔍 Для проверки настроек:"
echo "  cat .env"
echo "  cat src/config/environment.ts"
echo ""
echo "🎯 ГОТОВО! Frontend настроен для работы с ${DOMAIN}" 