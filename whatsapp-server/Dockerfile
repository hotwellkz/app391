# Используем базовый образ Node.js 18
FROM node:18-alpine

# Устанавливаем необходимые системные зависимости для Puppeteer и WhatsApp Web.js
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    curl \
    dumb-init \
    xvfb \
    xvfb-run \
    udev \
    ttf-dejavu \
    ttf-liberation \
    fontconfig \
    && rm -rf /var/cache/apk/*

# Указываем Puppeteer использовать установленный Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_DISABLE_HEADLESS_WARNING=true \
    CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/bin/chromium-browser \
    CHROME_DEVEL_SANDBOX=false \
    CHROME_NO_SANDBOX=true \
    DISPLAY=:99 \
    NODE_ENV=production

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json для кэширования зависимостей
COPY package*.json ./

# Устанавливаем все зависимости (включая dev для сборки)
RUN npm ci --include=dev --silent && \
    npm cache clean --force

# Копируем исходный код
COPY . .

# Создаем папки для данных WhatsApp если их нет
RUN mkdir -p .wwebjs_auth .wwebjs_cache data && \
    mkdir -p /tmp/.X11-unix && \
    mkdir -p /app/data/.wwebjs_auth /app/data/.wwebjs_cache

# Собираем TypeScript проект
RUN npm run build

# Удаляем dev зависимости после сборки для уменьшения размера образа
RUN npm prune --production

# Создаем non-root пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Даем права на папки данных
RUN chown -R nodeuser:nodejs /app/.wwebjs_auth /app/.wwebjs_cache /app/data && \
    chmod -R 755 /app/.wwebjs_auth /app/.wwebjs_cache /app/data && \
    chown -R nodeuser:nodejs /tmp/.X11-unix && \
    chmod 1777 /tmp/.X11-unix

# Создаем скрипт запуска с виртуальным дисплеем
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'export DISPLAY=:99' >> /app/start.sh && \
    echo 'Xvfb :99 -screen 0 1366x768x24 -ac +extension GLX +render -noreset &' >> /app/start.sh && \
    echo 'sleep 2' >> /app/start.sh && \
    echo 'exec node dist/server.js' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    chown nodeuser:nodejs /app/start.sh

# Переключаемся на non-root пользователя
USER nodeuser

# Указываем порт
EXPOSE 3000

# Настраиваем health check
HEALTHCHECK --interval=45s --timeout=30s --start-period=120s --retries=5 \
  CMD curl -f http://localhost:3000/health || exit 1

# Используем dumb-init для правильной обработки сигналов
ENTRYPOINT ["dumb-init", "--"]

# Команда запуска - используем собранную версию
CMD ["/app/start.sh"] 