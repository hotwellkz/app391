# ✅ WhatsApp Server - Исправление для локального запуска

## 🎯 Проблема решена!

**До исправления:** WhatsApp сервер не мог запуститься на Windows из-за ошибки:
```
❌ Failed to launch the browser process! spawn /usr/bin/chromium-browser ENOENT
```

**После исправления:** Сервер автоматически определяет ОС и настраивается правильно для любого окружения.

## 🔧 Что было исправлено

### 1. Автоопределение операционной системы
```typescript
// В src/server.ts добавлено:
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';
const isLocal = isWindows || process.env.NODE_ENV === 'development' || process.env.FORCE_LOCAL_MODE === 'true';
```

### 2. Умные пути браузера
```typescript
// Для Windows/локальной разработки - автопоиск Chrome
const chromiumPath = isLocal 
    ? undefined  // Puppeteer найдет Chrome автоматически
    : (process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'); // Docker/VM
```

### 3. Локальные пути сессий
```typescript
// Локальные папки для разработки, Docker пути для продакшена
const sessionPath = isLocal 
    ? path.resolve(__dirname, '../.wwebjs_auth')  // Windows: ./wwebjs_auth
    : (process.env.WHATSAPP_SESSION_PATH || '/app/data/.wwebjs_auth'); // Docker: /app/data/
```

### 4. Условная конфигурация Puppeteer
```typescript
// Добавляем executablePath только для Linux/Docker
if (chromiumPath) {
    puppeteerConfig.executablePath = chromiumPath;
}
```

## 🚀 Способы запуска

### Быстрый запуск (рекомендуется)

**Windows:**
```bash
cd whatsapp-server
.\scripts\start-local.bat
```

**Linux/Mac:**
```bash
cd whatsapp-server
chmod +x scripts/start-local.sh
./scripts/start-local.sh
```

### NPM скрипты

```bash
# Обычный запуск для разработки
npm run dev

# Принудительный локальный режим
npm run dev:local

# Быстрый запуск с проверками (Linux/Mac)
npm run start:local

# Быстрый запуск с проверками (Windows)
npm run start:local:win

# Очистка кэша сессий (Linux/Mac)
npm run clean

# Очистка кэша сессий (Windows)
npm run clean:win
```

## 📋 Требования

### Windows
- ✅ Node.js 18+
- ✅ Google Chrome (рекомендуется)
- ✅ npm или yarn

### Linux/Docker/VM
- ✅ Node.js 18+
- ✅ chromium-browser или google-chrome
- ✅ Docker (для контейнеризации)

## 🔍 Диагностика

При запуске вы увидите конфигурацию:

**Локальная разработка (Windows):**
```
🔧 WhatsApp Client Configuration:
   Platform: win32
   Local Mode: true
   Session Path: C:\path\to\project\.wwebjs_auth
   Chromium Path: Auto-detect
   Node Environment: development
```

**Продакшен (Linux/Docker):**
```
🔧 WhatsApp Client Configuration:
   Platform: linux
   Local Mode: false
   Session Path: /app/data/.wwebjs_auth
   Chromium Path: /usr/bin/chromium-browser
   Node Environment: production
```

## 🌐 Деплой на разные окружения

### Локальная разработка
```bash
# Автоматически определяется по ОС
npm run dev
```

### Google Cloud VM
```bash
# Используйте существующую конфигурацию
docker-compose -f docker-compose.yml --env-file env.production.vm up -d
```

### Docker контейнер
```bash
# Стандартный Docker деплой
docker-compose up -d
```

## 📝 Переменные окружения

Создайте `.env` файл в `whatsapp-server/`:

```env
# Основные настройки
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# WhatsApp настройки
WHATSAPP_SESSION_PATH=./.wwebjs_auth
FORCE_LOCAL_MODE=true

# Supabase (опционально)
SUPABASE_ENABLED=false
```

## 🔄 Миграция с старой версии

1. **Остановите старый сервер**
2. **Обновите код** (изменения уже применены)
3. **Перезапустите сервер** любым удобным способом
4. **Профит!** - сервер теперь работает на любой ОС

## 🎉 Результат

✅ **Windows**: Сервер запускается без проблем, использует локальный Chrome  
✅ **Linux/Mac**: Сервер работает как раньше, обратная совместимость сохранена  
✅ **Docker/VM**: Продакшен деплой работает без изменений  
✅ **Автоматизация**: Удобные скрипты для быстрого старта  

**Теперь WhatsApp сервер работает везде! 🌍** 