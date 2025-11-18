import { supabase, getChatsFromSupabase } from '../config/supabase';
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
        throw error;
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

        // Для голосовых сообщений проверяем все необходимые поля
        if (messageToSave.isVoiceMessage) {
            console.log('Processing voice message:', {
                mediaUrl: messageToSave.mediaUrl,
                mediaType: messageToSave.mediaType,
                duration: messageToSave.duration
            });
            
            if (!messageToSave.mediaUrl) {
                console.error('Voice message missing mediaUrl');
            }
            if (!messageToSave.mediaType) {
                console.error('Voice message missing mediaType');
            }
            if (!messageToSave.duration) {
                console.warn('Voice message missing duration');
            }
        }

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

        // Сохраняем в Supabase
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
                console.error('Supabase error:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            console.log('Successfully saved message:', {
                chatId: chat.id,
                messageId: message.id,
                type: messageToSave.isVoiceMessage ? 'voice' : 'regular'
            });
        } catch (error) {
            console.error('Failed to save to Supabase:', error);
            throw error;
        }

        return chat;
    } catch (error) {
        console.error('Error in addMessage:', error);
        throw error;
    }
};

// Сохранение чатов в Supabase
export const saveChats = async (): Promise<void> => {
    try {
        console.log('Saving chats to Supabase...');
        // Получаем массив чатов
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
        throw error;
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
            
            console.log(`[DELETE CHAT] Chat found in database but not in cache: ${phoneNumber}`);
        } else {
            console.log(`[DELETE CHAT] Chat found in cache: ${chat.id}, messages count: ${chat.messages?.length || 0}`);
        }

        // Удаляем из кэша (если есть)
        if (chat) {
            delete chatsCache[phoneNumber];
            console.log(`[DELETE CHAT] Chat removed from cache for phoneNumber: ${phoneNumber}`);
        }

        // Удаляем из Supabase
        console.log(`[DELETE CHAT] Deleting from Supabase database...`);
        const { data: deletedData, error } = await supabase
            .from('whatsapp_chats')
            .delete()
            .eq('phoneNumber', phoneNumber)
            .select(); // Добавляем select() чтобы получить информацию об удаленных записях

        if (error) {
            console.error('[DELETE CHAT] Supabase deletion error:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            
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

        if (!deletedData || deletedData.length === 0) {
            console.warn(`[DELETE CHAT] No records were deleted from database for phoneNumber: ${phoneNumber}`);
            return false;
        }

        console.log(`[DELETE CHAT] Successfully deleted chat from database for phoneNumber: ${phoneNumber}`);
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
        
        // Очищаем из Supabase
        const { error } = await supabase
            .from('whatsapp_chats')
            .delete()
            .neq('id', '0'); // Удаляем все записи
            
        if (error) {
            console.error('Error clearing chats from database:', error);
            throw error;
        }
        
        console.log('✅ All chats cleared successfully');
    } catch (error) {
        console.error('❌ Error clearing all chats:', error);
        throw error;
    }
};
