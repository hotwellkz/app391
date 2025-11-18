#!/bin/bash

echo "🛠️ ПОЛНОЕ ИСПРАВЛЕНИЕ WhatsApp Server на VM"
echo "=================================================="

# Переходим в директорию проекта
cd ~/app373/whatsapp-server || { echo "❌ Директория не найдена"; exit 1; }

echo "1. 🛑 Останавливаем контейнер..."
docker-compose down

echo "2. 🗑️ Очищаем Docker..."
docker system prune -f
docker image rm app373_whatsapp-server:latest -f 2>/dev/null || true

echo "3. 📝 Создаем правильный .env файл..."
rm -f .env
cat > .env << 'EOF'
DISABLE_SUPABASE=true
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://2wix.ru/whatsapp
ALLOWED_ORIGINS=https://2wix.ru,https://www.2wix.ru,https://2wix.ru/whatsapp,https://www.2wix.ru/whatsapp
SUPABASE_URL=disabled
SUPABASE_ANON_KEY=disabled
SUPABASE_SERVICE_KEY=disabled
WHATSAPP_SESSION_PATH=/app/data/.wwebjs_auth
WHATSAPP_CACHE_PATH=/app/data/.wwebjs_cache
LOG_LEVEL=info
EOF

echo "4. 🔧 Исправляем chatStorage.ts..."
cat > src/utils/chatStorage.ts << 'EOF'
import { supabase } from '../config/supabase';
import { Chat, ChatMessage, ChatStore } from '../types/chat';

let chatsCache: ChatStore = {};

// Проверяем флаг отключения Supabase
const isSupabaseDisabled = process.env.DISABLE_SUPABASE === 'true';

// Загрузка чатов из Supabase
export const loadChats = async (): Promise<ChatStore> => {
    try {
        console.log('Loading chats from Supabase...');
        
        if (isSupabaseDisabled || !supabase) {
            console.log('📱 Supabase disabled - returning empty chats from loadChats');
            return {};
        }

        const { data: chatsData, error } = await supabase
            .from('whatsapp_chats')
            .select('*');

        if (error) {
            console.error('Error loading chats from Supabase:', error);
            throw error;
        }

        console.log('Loaded chats from Supabase:', chatsData);

        // Обновляем кэш
        const formattedChats: ChatStore = {};
        if (chatsData && Array.isArray(chatsData)) {
            chatsData.forEach((chat: any) => {
                if (!chat.phoneNumber) {
                    console.warn('Chat without phoneNumber:', chat);
                    return;
                }

                // Форматируем сообщения
                const messages = Array.isArray(chat.messages) ? chat.messages.map((msg: any) => ({
                    id: msg.id || `msg_${Date.now()}`,
                    body: msg.body || '',
                    from: msg.from || '',
                    to: msg.to || '',
                    timestamp: msg.timestamp || new Date().toISOString(),
                    fromMe: !!msg.fromMe,
                    hasMedia: !!msg.hasMedia,
                    mediaUrl: msg.mediaUrl || '',
                    mediaType: msg.mediaType || '',
                    fileName: msg.fileName || '',
                    fileSize: msg.fileSize || 0,
                    isVoiceMessage: !!msg.isVoiceMessage,
                    duration: msg.duration || 0
                })) : [];

                // Форматируем последнее сообщение
                const lastMessage = chat.lastMessage ? {
                    id: chat.lastMessage.id || `msg_${Date.now()}`,
                    body: chat.lastMessage.body || '',
                    from: chat.lastMessage.from || '',
                    to: chat.lastMessage.to || '',
                    timestamp: chat.lastMessage.timestamp || new Date().toISOString(),
                    fromMe: !!chat.lastMessage.fromMe,
                    hasMedia: !!chat.lastMessage.hasMedia,
                    mediaUrl: chat.lastMessage.mediaUrl || '',
                    mediaType: chat.lastMessage.mediaType || '',
                    fileName: chat.lastMessage.fileName || '',
                    fileSize: chat.lastMessage.fileSize || 0,
                    isVoiceMessage: !!chat.lastMessage.isVoiceMessage,
                    duration: chat.lastMessage.duration || 0
                } : undefined;

                formattedChats[chat.phoneNumber] = {
                    id: chat.id || `chat_${Date.now()}`,
                    phoneNumber: chat.phoneNumber,
                    name: chat.name || chat.phoneNumber.replace('@c.us', ''),
                    avatarUrl: chat.avatarUrl || undefined,
                    messages: messages,
                    lastMessage: lastMessage,
                    unreadCount: typeof chat.unreadCount === 'number' ? chat.unreadCount : 0,
                    timestamp: chat.timestamp || new Date().toISOString()
                };
            });
        }

        chatsCache = formattedChats;
        console.log('Formatted chats:', formattedChats);
        return formattedChats;
    } catch (error) {
        console.error('Error in loadChats:', error);
        return {};
    }
};

// Инициализация кэша чатов
export const initializeChatsCache = async (): Promise<void> => {
    try {
        console.log('Initializing chats cache...');
        const chats = await loadChats();
        chatsCache = chats;
        console.log('Chats cache initialized:', chatsCache);
    } catch (error) {
        console.error('Error initializing chats cache:', error);
        // Не бросаем ошибку, просто продолжаем с пустым кэшем
    }
};

// Добавление сообщения в чат
export const addMessage = async (message: ChatMessage): Promise<Chat> => {
    try {
        console.log('Adding message with details:', {
            id: message.id,
            type: message.isVoiceMessage ? 'voice' : 'regular',
            hasMedia: !!message.mediaUrl,
            mediaType: message.mediaType,
            from: message.from,
            to: message.to
        });
        
        // Определяем номер телефона для чата
        const phoneNumber = message.fromMe ? message.to : message.from;
        if (!phoneNumber) {
            throw new Error('No phone number in message');
        }

        // Получаем или создаем чат
        let chat = chatsCache[phoneNumber];
        if (!chat) {
            chat = {
                id: `chat_${Date.now()}`,
                phoneNumber,
                name: phoneNumber.replace('@c.us', ''),
                avatarUrl: undefined,
                messages: [],
                unreadCount: 0,
                timestamp: new Date().toISOString()
            };
            chatsCache[phoneNumber] = chat;
        }

        // Проверяем, не дубликат ли это сообщение
        const isDuplicate = chat.messages.some(msg => msg.id === message.id);
        if (isDuplicate) {
            console.log('Duplicate message, skipping');
            return chat;
        }

        // Подготавливаем сообщение для сохранения
        const messageToSave = {
            ...message,
            isVoiceMessage: !!message.isVoiceMessage,
            duration: message.duration || 0,
            mediaUrl: message.mediaUrl || '',
            mediaType: message.mediaType || '',
            fileName: message.fileName || ''
        };

        // Добавляем сообщение в массив
        chat.messages.push(messageToSave);
        
        // Обновляем последнее сообщение
        chat.lastMessage = messageToSave;
        
        // Обновляем временную метку чата
        chat.timestamp = messageToSave.timestamp;

        // Увеличиваем счетчик непрочитанных для входящих сообщений
        if (!messageToSave.fromMe) {
            chat.unreadCount = (chat.unreadCount || 0) + 1;
        }

        // Сохраняем в Supabase только если он включен
        if (!isSupabaseDisabled && supabase) {
            try {
                const { data, error } = await supabase
                    .from('whatsapp_chats')
                    .upsert({
                        id: chat.id,
                        phoneNumber: chat.phoneNumber,
                        name: chat.name,
                        avatarUrl: chat.avatarUrl,
                        messages: chat.messages,
                        lastMessage: chat.lastMessage,
                        unreadCount: chat.unreadCount,
                        timestamp: chat.timestamp
                    })
                    .select();

                if (error) {
                    console.error('Supabase error:', error);
                    throw error;
                }

                console.log('Successfully saved message to Supabase');
            } catch (error) {
                console.error('Failed to save to Supabase:', error);
                // Не бросаем ошибку, продолжаем работу без Supabase
            }
        } else {
            console.log('📱 Supabase disabled - message saved only to cache');
        }

        return chat;
    } catch (error) {
        console.error('Error in addMessage:', error);
        throw error;
    }
};

// Сохранение чатов в Supabase
export const saveChats = async (): Promise<void> => {
    if (isSupabaseDisabled || !supabase) {
        console.log('📱 Supabase disabled - skipping chats save');
        return;
    }

    try {
        console.log('Saving chats to Supabase...');
        const chats = Object.values(chatsCache);
        console.log('Chats to save:', chats);

        // Удаляем все существующие чаты
        const { error: deleteError } = await supabase
            .from('whatsapp_chats')
            .delete()
            .neq('id', '0');

        if (deleteError) {
            console.error('Error deleting existing chats:', deleteError);
            throw deleteError;
        }

        // Вставляем обновленные чаты
        if (chats.length > 0) {
            const { error: insertError } = await supabase
                .from('whatsapp_chats')
                .insert(chats);

            if (insertError) {
                console.error('Error inserting chats:', insertError);
                throw insertError;
            }
        }

        console.log('Chats saved successfully');
    } catch (error) {
        console.error('Error in saveChats:', error);
        // Не бросаем ошибку, продолжаем работу
    }
};

// Получение чата по номеру телефона
export const getChat = (phoneNumber: string): Chat | undefined => {
    return chatsCache[phoneNumber];
};

// Очистка непрочитанных сообщений
export const clearUnread = async (phoneNumber: string): Promise<void> => {
    const chat = chatsCache[phoneNumber];
    if (chat) {
        chat.unreadCount = 0;
        await saveChats();
    }
};

// Удаление чата
export const deleteChat = async (phoneNumber: string): Promise<boolean> => {
    try {
        console.log(`[DELETE CHAT] Starting deletion for phoneNumber: ${phoneNumber}`);
        
        // Проверяем, существует ли чат в кэше
        const chat = chatsCache[phoneNumber];
        if (!chat) {
            console.warn(`[DELETE CHAT] Chat not found in cache for phoneNumber: ${phoneNumber}`);
            
            if (!isSupabaseDisabled && supabase) {
                // Проверяем в базе данных
                const { data: existingChats, error: checkError } = await supabase
                    .from('whatsapp_chats')
                    .select('id, phoneNumber')
                    .eq('phoneNumber', phoneNumber);
                    
                if (checkError) {
                    console.error('[DELETE CHAT] Error checking chat existence:', checkError);
                    throw new Error(`Ошибка проверки существования чата: ${checkError.message}`);
                }
                
                if (!existingChats || existingChats.length === 0) {
                    console.log(`[DELETE CHAT] Chat not found in database either: ${phoneNumber}`);
                    return false;
                }
            } else {
                console.log(`[DELETE CHAT] Supabase disabled, cannot check database: ${phoneNumber}`);
                return false;
            }
        }

        // Удаляем из кэша (если есть)
        if (chat) {
            delete chatsCache[phoneNumber];
            console.log(`[DELETE CHAT] Chat removed from cache for phoneNumber: ${phoneNumber}`);
        }

        // Удаляем из Supabase только если он включен
        if (!isSupabaseDisabled && supabase) {
            console.log(`[DELETE CHAT] Deleting from Supabase database...`);
            const { data: deletedData, error } = await supabase
                .from('whatsapp_chats')
                .delete()
                .eq('phoneNumber', phoneNumber)
                .select();

            if (error) {
                console.error('[DELETE CHAT] Supabase deletion error:', error);
                
                // Восстанавливаем в кэше в случае ошибки
                if (chat) {
                    chatsCache[phoneNumber] = chat;
                    console.log('[DELETE CHAT] Chat restored to cache due to database error');
                }
                
                throw new Error(`Ошибка удаления из базы данных: ${error.message}`);
            }

            console.log(`[DELETE CHAT] Database deletion result:`, {
                deletedCount: deletedData?.length || 0,
                deletedData: deletedData
            });
        } else {
            console.log('[DELETE CHAT] Supabase disabled - chat deleted only from cache');
        }

        console.log(`[DELETE CHAT] Successfully deleted chat for phoneNumber: ${phoneNumber}`);
        return true;
        
    } catch (error: any) {
        console.error('[DELETE CHAT] Unexpected error:', {
            phoneNumber,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

// Получение всех чатов из кэша
export const getAllChats = (): ChatStore => {
    return chatsCache;
};

// Полная очистка всех чатов (для смены аккаунта)
export const clearAllChats = async (): Promise<void> => {
    try {
        console.log('🧹 Clearing all chats from cache and database...');
        
        // Очищаем кэш
        chatsCache = {};
        
        // Очищаем из Supabase только если он включен
        if (!isSupabaseDisabled && supabase) {
            const { error } = await supabase
                .from('whatsapp_chats')
                .delete()
                .neq('id', '0');
                
            if (error) {
                console.error('Error clearing chats from database:', error);
                throw error;
            }
        } else {
            console.log('📱 Supabase disabled - chats cleared only from cache');
        }
        
        console.log('✅ All chats cleared successfully');
    } catch (error) {
        console.error('❌ Error clearing all chats:', error);
        // Не бросаем ошибку, продолжаем работу
    }
};
EOF

echo "5. 🔧 Исправляем Dockerfile для Puppeteer..."
cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Устанавливаем Chromium и необходимые зависимости
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init

# Настройки для Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Копируем package файлы и устанавливаем зависимости
COPY package*.json ./
RUN npm ci

# Копируем исходный код
COPY . .

# Создаем необходимые директории с правильными правами
RUN mkdir -p .wwebjs_auth .wwebjs_cache data

# Компилируем TypeScript
RUN npm run build

# Удаляем dev зависимости
RUN npm prune --production

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Устанавливаем права на директории
RUN chown -R nodeuser:nodejs /app/.wwebjs_auth /app/.wwebjs_cache /app/data

# Переключаемся на non-root пользователя
USER nodeuser

# Открываем порт
EXPOSE 3000

# Используем dumb-init для правильной обработки сигналов
ENTRYPOINT ["dumb-init", "--"]

# Запускаем приложение
CMD ["node", "dist/server.js"]
EOF

echo "6. 🔧 Исправляем WhatsApp клиент для Docker..."
# Находим и обновляем файл с инициализацией WhatsApp клиента
if grep -r "new Client" src/ --include="*.ts" -l | head -1 | xargs -I {} sed -i 's/new Client(/new Client({\
        authStrategy: new LocalAuth({\
            dataPath: process.env.WHATSAPP_SESSION_PATH || ".wwebjs_auth"\
        }),\
        puppeteer: {\
            headless: true,\
            args: [\
                "--no-sandbox",\
                "--disable-setuid-sandbox",\
                "--disable-dev-shm-usage",\
                "--disable-accelerated-2d-canvas",\
                "--no-first-run",\
                "--no-zygote",\
                "--single-process",\
                "--disable-gpu",\
                "--disable-background-timer-throttling",\
                "--disable-backgrounding-occluded-windows",\
                "--disable-renderer-backgrounding"\
            ],\
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "\/usr\/bin\/chromium-browser"\
        }\
    })/g' {}; then
    echo "✅ WhatsApp client configuration updated"
else
    echo "⚠️ Could not find WhatsApp client initialization"
fi

echo "7. 🔨 Пересобираем образ Docker..."
docker-compose build --no-cache

echo "8. 🚀 Запускаем контейнер..."
docker-compose up -d

echo "9. 📋 Проверяем логи..."
sleep 5
docker-compose logs --tail=30 whatsapp-server

echo ""
echo "✅ ПОЛНОЕ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo "=================================================="
echo ""
echo "🔍 Для мониторинга логов используйте:"
echo "   docker-compose logs -f whatsapp-server"
echo ""
echo "🩺 Для проверки здоровья сервера:"
echo "   curl http://localhost:3000/health"
echo ""
echo "📱 Сервер должен быть доступен на http://VM_IP:3000"
echo "   Настройте фронтенд для подключения к этому адресу" 