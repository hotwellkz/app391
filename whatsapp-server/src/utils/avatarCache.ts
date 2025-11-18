import { Client } from 'whatsapp-web.js';
import { AvatarCache } from '../types/chat';

// Кэш аватарок в памяти
let avatarCache: AvatarCache = {};

// Время жизни кэша аватарок (24 часа)
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

/**
 * Очистка просроченных записей из кэша
 */
export const cleanExpiredAvatars = (): void => {
    const now = Date.now();
    const expiredKeys = Object.keys(avatarCache).filter(
        key => avatarCache[key].expiresAt < now
    );
    
    expiredKeys.forEach(key => {
        delete avatarCache[key];
    });
    
    if (expiredKeys.length > 0) {
        console.log(`🗑️  Cleaned ${expiredKeys.length} expired avatar cache entries`);
    }
};

/**
 * Получение аватарки контакта с кэшированием
 * @param client - WhatsApp клиент
 * @param contactId - ID контакта (номер телефона с @c.us или без)
 * @returns URL аватарки или null если не найдена
 */
export const getContactAvatar = async (client: Client, contactId: string): Promise<string | null> => {
    try {
        // Нормализуем contactId
        const normalizedId = contactId.includes('@c.us') ? contactId : `${contactId}@c.us`;
        
        // Проверяем кэш
        const cached = avatarCache[normalizedId];
        const now = Date.now();
        
        if (cached && cached.expiresAt > now) {
            console.log(`💾 Avatar cache hit for ${normalizedId}`);
            return cached.url;
        }
        
        console.log(`🔍 Fetching avatar for ${normalizedId}`);
        
        // Получаем аватарку из WhatsApp
        let avatarUrl: string | null = null;
        
        try {
            avatarUrl = await client.getProfilePicUrl(normalizedId);
        } catch (error: any) {
            // Если аватарки нет, getProfilePicUrl может выдать ошибку
            console.log(`⚠️  No avatar found for ${normalizedId}: ${error.message}`);
            avatarUrl = null;
        }
        
        // Сохраняем в кэш
        avatarCache[normalizedId] = {
            url: avatarUrl,
            fetchedAt: now,
            expiresAt: now + CACHE_DURATION
        };
        
        console.log(`✅ Avatar ${avatarUrl ? 'found' : 'not found'} for ${normalizedId}`);
        return avatarUrl;
        
    } catch (error: any) {
        console.error(`❌ Error fetching avatar for ${contactId}:`, error);
        return null;
    }
};

/**
 * Получение аватарок для массива контактов
 * @param client - WhatsApp клиент
 * @param contactIds - Массив ID контактов
 * @returns Объект с аватарками { contactId: avatarUrl }
 */
export const getMultipleContactAvatars = async (
    client: Client, 
    contactIds: string[]
): Promise<{ [contactId: string]: string | null }> => {
    const results: { [contactId: string]: string | null } = {};
    
    // Очищаем просроченные записи перед массовой загрузкой
    cleanExpiredAvatars();
    
    console.log(`🎭 Fetching avatars for ${contactIds.length} contacts`);
    
    // Загружаем аватарки параллельно с ограничением
    const batchSize = 5; // Ограничиваем количество одновременных запросов
    for (let i = 0; i < contactIds.length; i += batchSize) {
        const batch = contactIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (contactId) => {
            const avatar = await getContactAvatar(client, contactId);
            return { contactId, avatar };
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(({ contactId, avatar }) => {
            const normalizedId = contactId.includes('@c.us') ? contactId : `${contactId}@c.us`;
            results[normalizedId] = avatar;
        });
        
        // Небольшая задержка между батчами
        if (i + batchSize < contactIds.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    console.log(`✅ Fetched avatars for ${Object.keys(results).length} contacts`);
    return results;
};

/**
 * Очистка всего кэша аватарок
 */
export const clearAvatarCache = (): void => {
    avatarCache = {};
    console.log('🗑️  Avatar cache cleared');
};

/**
 * Получение статистики кэша аватарок
 */
export const getAvatarCacheStats = () => {
    const now = Date.now();
    const totalEntries = Object.keys(avatarCache).length;
    const expiredEntries = Object.keys(avatarCache).filter(
        key => avatarCache[key].expiresAt < now
    ).length;
    const validEntries = totalEntries - expiredEntries;
    
    return {
        totalEntries,
        validEntries,
        expiredEntries,
        memoryUsage: JSON.stringify(avatarCache).length
    };
};

// Периодическая очистка кэша каждые 30 минут
setInterval(() => {
    cleanExpiredAvatars();
}, 30 * 60 * 1000); 