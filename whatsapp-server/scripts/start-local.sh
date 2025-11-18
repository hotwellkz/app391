#!/bin/bash

echo "============================================"
echo "   WhatsApp Server - Локальная разработка"
echo "============================================"
echo

# Проверка Node.js
echo "Проверка Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден! Установите Node.js с https://nodejs.org/"
    exit 1
fi

# Проверка npm
echo "Проверка npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm не найден! Установите npm"
    exit 1
fi

# Установка зависимостей
echo
echo "📦 Проверка зависимостей..."
if [ ! -d "node_modules" ]; then
    echo "Установка зависимостей..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка установки зависимостей!"
        exit 1
    fi
fi

# Создание .env файла если отсутствует
if [ ! -f ".env" ]; then
    echo
    echo "📝 Создание .env файла..."
    cp env.example .env
    echo "✅ Файл .env создан. Отредактируйте его при необходимости."
fi

# Проверка браузера (опционально)
echo
echo "Проверка браузера..."
if command -v google-chrome &> /dev/null; then
    echo "✅ Google Chrome найден"
elif command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium найден"
elif command -v chromium &> /dev/null; then
    echo "✅ Chromium найден"
else
    echo "⚠️  Браузер не найден. Рекомендуется установить Chrome или Chromium."
    echo "Продолжить? (y/n)"
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Установка прав на выполнение
chmod +x scripts/start-local.sh

# Запуск сервера
echo
echo "🚀 Запуск WhatsApp сервера..."
echo "============================================"
echo "Откройте http://localhost:3000/health для проверки"
echo "Нажмите Ctrl+C для остановки"
echo "============================================"
echo

npm run dev 