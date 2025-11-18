import fs from 'fs';
import path from 'path';
import { ReadStatus, ReadStatusStore, UpdateReadStatusRequest } from '../types/readStatus';
import { loadChats } from './chatStorage';

const READ_STATUS_DIR = path.join(__dirname, '../../data');
const READ_STATUS_FILE = path.join(READ_STATUS_DIR, 'readStatus.json');

// Создаем директорию для данных если её нет
if (!fs.existsSync(READ_STATUS_DIR)) {
    fs.mkdirSync(READ_STATUS_DIR, { recursive: true });
}

// Загрузка статусов прочитанности из файла
export const loadReadStatuses = (): ReadStatusStore => {
    try {
        if (fs.existsSync(READ_STATUS_FILE)) {
            const data = fs.readFileSync(READ_STATUS_FILE, 'utf8');
            const readStatuses = JSON.parse(data) as ReadStatusStore;
            console.log(`📖 Read statuses loaded: ${Object.keys(readStatuses).length} chats`);
            return readStatuses;
        }
    } catch (error) {
        console.error('❌ Error loading read statuses:', error);
    }
    
    console.log('📖 No read status file found, starting with empty store');
    return {};
};

// Сохранение статусов прочитанности в файл
export const saveReadStatuses = (readStatuses: ReadStatusStore): boolean => {
    try {
        fs.writeFileSync(READ_STATUS_FILE, JSON.stringify(readStatuses, null, 2));
        console.log(`💾 Read statuses saved: ${Object.keys(readStatuses).length} chats`);
        return true;
    } catch (error) {
        console.error('❌ Error saving read statuses:', error);
        return false;
    }
};

// Получение всех статусов прочитанности
export const getAllReadStatuses = (): ReadStatusStore => {
    return loadReadStatuses();
};

// Получение статуса прочитанности для конкретного чата
export const getReadStatus = (chatId: string, userId?: string): ReadStatus | null => {
    const readStatuses = loadReadStatuses();
    const key = userId ? `${chatId}_${userId}` : chatId;
    return readStatuses[key] || null;
};

// Обновление статуса прочитанности
export const updateReadStatus = (request: UpdateReadStatusRequest): ReadStatus | null => {
    try {
        const readStatuses = loadReadStatuses();
        const key = request.userId ? `${request.chatId}_${request.userId}` : request.chatId;
        const now = new Date().toISOString();
        
        const readStatus: ReadStatus = {
            chatId: request.chatId,
            userId: request.userId,
            lastReadMessageId: request.messageId,
            lastReadTimestamp: request.timestamp,
            updatedAt: now
        };
        
        readStatuses[key] = readStatus;
        
        if (saveReadStatuses(readStatuses)) {
            console.log(`✅ Read status updated for chat ${request.chatId}: ${request.messageId} at ${request.timestamp}`);
            return readStatus;
        }
        
        return null;
    } catch (error) {
        console.error('❌ Error updating read status:', error);
        return null;
    }
};

// Подсчет непрочитанных сообщений для чата
export const calculateUnreadCount = async (chatId: string, userId?: string): Promise<number> => {
    try {
        // Получаем статус прочитанности
        const readStatus = getReadStatus(chatId, userId);
        
        // Загружаем чаты
        const chats = await loadChats();
        const chat = chats[chatId];
        
        if (!chat || !chat.messages || chat.messages.length === 0) {
            return 0;
        }
        
        // Если нет статуса прочитанности, считаем все входящие сообщения непрочитанными
        if (!readStatus) {
            const unreadCount = chat.messages.filter(msg => !msg.fromMe).length;
            console.log(`📊 No read status for ${chatId}, counting all incoming messages: ${unreadCount}`);
            return unreadCount;
        }
        
        // Считаем сообщения после последнего прочитанного
        const lastReadTime = new Date(readStatus.lastReadTimestamp).getTime();
        const unreadMessages = chat.messages.filter(msg => {
            const messageTime = new Date(msg.timestamp).getTime();
            return !msg.fromMe && messageTime > lastReadTime;
        });
        
        console.log(`📊 Unread count for ${chatId}: ${unreadMessages.length} (after ${readStatus.lastReadTimestamp})`);
        return unreadMessages.length;
        
    } catch (error) {
        console.error(`❌ Error calculating unread count for ${chatId}:`, error);
        return 0;
    }
};

// Подсчет непрочитанных сообщений для всех чатов
export const calculateUnreadCountsForAllChats = async (userId?: string): Promise<{ [chatId: string]: number }> => {
    try {
        const chats = await loadChats();
        const results: { [chatId: string]: number } = {};
        
        console.log(`📊 Calculating unread counts for ${Object.keys(chats).length} chats`);
        
        for (const chatId of Object.keys(chats)) {
            results[chatId] = await calculateUnreadCount(chatId, userId);
        }
        
        const totalUnread = Object.values(results).reduce((sum, count) => sum + count, 0);
        console.log(`📊 Total unread messages across all chats: ${totalUnread}`);
        
        return results;
    } catch (error) {
        console.error('❌ Error calculating unread counts for all chats:', error);
        return {};
    }
};

// Получение последних сообщений после определенного времени
export const getNewMessagesAfterTimestamp = async (chatId: string, timestamp: string): Promise<any[]> => {
    try {
        const chats = await loadChats();
        const chat = chats[chatId];
        
        if (!chat || !chat.messages) {
            return [];
        }
        
        const targetTime = new Date(timestamp).getTime();
        const newMessages = chat.messages.filter(msg => {
            const messageTime = new Date(msg.timestamp).getTime();
            return messageTime > targetTime;
        });
        
        console.log(`📋 Found ${newMessages.length} new messages in ${chatId} after ${timestamp}`);
        return newMessages;
        
    } catch (error) {
        console.error(`❌ Error getting new messages for ${chatId}:`, error);
        return [];
    }
};

// Пометить чат как полностью прочитанный (до последнего сообщения)
export const markChatAsRead = async (chatId: string, userId?: string): Promise<ReadStatus | null> => {
    try {
        const chats = await loadChats();
        const chat = chats[chatId];
        
        if (!chat || !chat.messages || chat.messages.length === 0) {
            console.log(`⚠️  No messages found in chat ${chatId} to mark as read`);
            return null;
        }
        
        // Находим последнее сообщение
        const lastMessage = chat.messages[chat.messages.length - 1];
        
        const request: UpdateReadStatusRequest = {
            chatId,
            messageId: lastMessage.id,
            timestamp: lastMessage.timestamp,
            userId
        };
        
        const result = updateReadStatus(request);
        
        if (result) {
            console.log(`✅ Chat ${chatId} marked as fully read up to message ${lastMessage.id}`);
        }
        
        return result;
    } catch (error) {
        console.error(`❌ Error marking chat ${chatId} as read:`, error);
        return null;
    }
};

// Удаление статуса прочитанности для чата
export const deleteReadStatus = (chatId: string, userId?: string): boolean => {
    try {
        const readStatuses = loadReadStatuses();
        const key = userId ? `${chatId}_${userId}` : chatId;
        
        if (readStatuses[key]) {
            delete readStatuses[key];
            
            if (saveReadStatuses(readStatuses)) {
                console.log(`✅ Read status deleted for chat ${chatId}`);
                return true;
            }
        } else {
            console.log(`⚠️  No read status found for chat ${chatId} to delete`);
            return true; // Считаем успехом, если статуса не было
        }
        
        return false;
    } catch (error) {
        console.error(`❌ Error deleting read status for ${chatId}:`, error);
        return false;
    }
};

// Получение статистики статусов прочитанности
export const getReadStatusStats = () => {
    try {
        const readStatuses = loadReadStatuses();
        const totalStatuses = Object.keys(readStatuses).length;
        
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;
        const recentStatuses = Object.values(readStatuses).filter(
            status => now - new Date(status.updatedAt).getTime() < day
        ).length;
        
        return {
            totalStatuses,
            recentStatuses,
            oldStatuses: totalStatuses - recentStatuses,
            memoryUsage: JSON.stringify(readStatuses).length
        };
    } catch (error) {
        console.error('❌ Error getting read status stats:', error);
        return {
            totalStatuses: 0,
            recentStatuses: 0,
            oldStatuses: 0,
            memoryUsage: 0
        };
    }
};

// Полная очистка всех статусов прочитанности (для смены аккаунта)
export const clearAllReadStatuses = (): boolean => {
    try {
        console.log('🧹 Clearing all read statuses...');
        
        // Удаляем файл статусов
        if (fs.existsSync(READ_STATUS_FILE)) {
            fs.unlinkSync(READ_STATUS_FILE);
            console.log('✅ Read status file deleted');
        } else {
            console.log('⚠️  Read status file not found');
        }
        
        console.log('✅ All read statuses cleared successfully');
        return true;
    } catch (error) {
        console.error('❌ Error clearing all read statuses:', error);
        return false;
    }
}; 