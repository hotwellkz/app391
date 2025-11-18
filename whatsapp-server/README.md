# WhatsApp Server

Серверная часть приложения для интеграции с WhatsApp, использующая библиотеку whatsapp-web.js.

## Функциональность

- Подключение к WhatsApp через QR-код
- Отправка и получение сообщений
- WebSocket интеграция для real-time обновлений
- REST API для отправки сообщений

## Технологии

- Node.js
- Express.js
- Socket.IO
- whatsapp-web.js
- TypeScript

## Установка

1. Клонируйте репозиторий:
```bash
git clone [URL репозитория]
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите сервер:
```bash
npm run dev
```

## API Endpoints

### POST /send
Отправка сообщения:
```json
{
    "to": "79XXXXXXXXX",
    "message": "Текст сообщения"
}
```

## WebSocket События

- `whatsapp-qr`: Получение QR-кода для авторизации
- `whatsapp-ready`: WhatsApp готов к работе
- `whatsapp-message`: Получение нового сообщения
- `whatsapp-error`: Ошибка WhatsApp
- `whatsapp-disconnected`: Отключение от WhatsApp
