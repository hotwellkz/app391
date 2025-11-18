@echo off
echo ============================================
echo    WhatsApp Server - Локальная разработка
echo ============================================
echo.

REM Проверка Node.js
echo Проверка Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не найден! Установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

REM Проверка Google Chrome
echo Проверка Google Chrome...
reg query "HKEY_CURRENT_USER\Software\Google\Chrome\BLBeacon" /v version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Google Chrome не найден. Рекомендуется установить Chrome для WhatsApp Web.
    echo Продолжить? (y/n)
    choice /c yn /n
    if errorlevel 2 exit /b 1
)

REM Установка зависимостей
echo.
echo 📦 Проверка зависимостей...
if not exist "node_modules" (
    echo Установка зависимостей...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Ошибка установки зависимостей!
        pause
        exit /b 1
    )
)

REM Создание .env файла если отсутствует
if not exist ".env" (
    echo.
    echo 📝 Создание .env файла...
    copy env.example .env >nul
    echo ✅ Файл .env создан. Отредактируйте его при необходимости.
)

REM Запуск сервера
echo.
echo 🚀 Запуск WhatsApp сервера...
echo ============================================
echo Откройте http://localhost:3000/health для проверки
echo Нажмите Ctrl+C для остановки
echo ============================================
echo.

npm run dev 