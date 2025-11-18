import { createClient } from '@supabase/supabase-js';
import { ChatStore, Chat } from '../types/chat';
import dotenv from 'dotenv';
import path from 'path';

// Загружаем переменные окружения
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Проверяем флаг отключения Supabase
const isSupabaseDisabled = process.env.DISABLE_SUPABASE === 'true';
console.log(`🔧 Supabase status: ${isSupabaseDisabled ? 'DISABLED' : 'ENABLED'}`);

// Создаем клиент Supabase только если он не отключен
let supabase: any = null;

if (!isSupabaseDisabled) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'disabled' || supabaseKey === 'disabled') {
        console.warn('⚠️ Supabase credentials missing or disabled - working in offline mode');
        // Не бросаем ошибку, просто работаем без Supabase
    } else {
        try {
            supabase = createClient(supabaseUrl, supabaseKey);
            console.log('✅ Supabase client initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Supabase client:', error);
            // Продолжаем работу без Supabase
        }
    }
}

export { supabase };

// Загрузка чатов из Supabase
export async function getChatsFromSupabase(): Promise<ChatStore> {
    if (isSupabaseDisabled || !supabase) {
        console.log('📱 Supabase disabled - returning empty chats store');
        return {};
    }

    try {
        const { data, error } = await supabase
            .from('whatsapp_chats')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            throw error;
        }

        if (data && data.length > 0 && data[0].chats) {
            console.log('Loaded chats from Supabase:', Object.keys(data[0].chats).length);
            return data[0].chats as ChatStore;
        }

        return {};
    } catch (error) {
        console.error('Error loading chats from Supabase:', error);
        return {};
    }
}

// Сохранение чата в Supabase
export async function saveChatToSupabase(chat: Chat): Promise<void> {
    if (isSupabaseDisabled || !supabase) {
        console.log('📱 Supabase disabled - skipping chat save for:', chat.phoneNumber);
        return;
    }

    try {
        // Получаем текущие чаты
        const { data, error: fetchError } = await supabase
            .from('whatsapp_chats')
            .select('chats')
            .order('created_at', { ascending: false })
            .limit(1);

        let currentChats: ChatStore = {};
        if (data && data.length > 0 && data[0].chats) {
            currentChats = data[0].chats as ChatStore;
        }

        // Обновляем чаты
        currentChats[chat.phoneNumber] = chat;

        // Сохраняем обновленные чаты
        const { error } = await supabase
            .from('whatsapp_chats')
            .insert({
                chats: currentChats,
                created_at: new Date().toISOString()
            });

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error saving chat to Supabase:', error);
        throw error;
    }
}

// Инициализация бакета для медиафайлов
export async function initializeMediaBucket() {
    if (isSupabaseDisabled || !supabase) {
        console.log('📱 Supabase disabled - skipping media bucket initialization');
        return;
    }

    try {
        // Проверяем существование бакета
        const { data: buckets, error: listError } = await supabase
            .storage
            .listBuckets();

        if (listError) {
            throw listError;
        }

        const whatsappBucket = buckets?.find((b: any) => b.name === 'whatsapp-media');

        if (!whatsappBucket) {
            // Создаем бакет, если он не существует
            const { error: createError } = await supabase
                .storage
                .createBucket('whatsapp-media', {
                    public: true,
                    fileSizeLimit: 50000000 // 50MB лимит
                });

            if (createError) {
                throw createError;
            }
            console.log('Created whatsapp-media bucket');
        } else {
            console.log('whatsapp-media bucket already exists');
        }
    } catch (error) {
        console.error('Error initializing media bucket:', error);
        throw error;
    }
}

// Загрузка медиафайла в Supabase Storage
export async function uploadMediaToSupabase(
    file: Buffer,
    fileName: string,
    mediaType: string
): Promise<string> {
    if (isSupabaseDisabled || !supabase) {
        console.log('📱 Supabase disabled - cannot upload media:', fileName);
        throw new Error('Media upload disabled - Supabase not available');
    }

    try {
        const fileExt = fileName.split('.').pop() || '';
        const timestamp = new Date().getTime();
        const uniqueFileName = `${timestamp}_${fileName}`;
        
        let folderPath = 'other';
        if (mediaType.startsWith('image/')) {
            folderPath = 'images';
        } else if (mediaType.startsWith('video/')) {
            folderPath = 'videos';
        } else if (mediaType.startsWith('audio/')) {
            folderPath = 'audio';
        }

        const filePath = `${folderPath}/${uniqueFileName}`;

        const { error: uploadError } = await supabase
            .storage
            .from('whatsapp-media')
            .upload(filePath, file, {
                contentType: mediaType,
                cacheControl: '3600'
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from('whatsapp-media')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading media to Supabase:', error);
        throw error;
    }
}
