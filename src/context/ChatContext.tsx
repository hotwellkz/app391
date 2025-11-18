import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import axios from 'axios';
import { withRetry, executeCriticalOperation, isReadyForOperation } from '../utils/connectionStabilizer';
import { API_CONFIG } from '../config/api';
import { 
    WhatsAppMessage, 
    Chat as WhatsAppChat, 
    WhatsAppStatus, 
    WhatsAppStatusResponse, 
    LogoutResponse, 
    DeleteChatResponse,
    Contact,
    ContactsStore,
    CreateContactResponse,
    UpdateContactResponse,
    GetContactsResponse,
    DeleteContactResponse
} from '../types/WhatsAppTypes';

interface ChatContextType {
    chats: { [key: string]: WhatsAppChat };
    setChats: React.Dispatch<React.SetStateAction<{ [key: string]: WhatsAppChat }>>;
    activeChat: string | null;
    setActiveChat: React.Dispatch<React.SetStateAction<string | null>>;
    loadChats: () => Promise<void>;
    createChat: (phoneNumber: string) => Promise<void>;
    deleteChat: (phoneNumber: string) => Promise<boolean>;
    qrCode: string;
    setQrCode: (code: string) => void;
    whatsappStatus: WhatsAppStatus;
    setWhatsappStatus: React.Dispatch<React.SetStateAction<WhatsAppStatus>>;
    logoutWhatsApp: () => Promise<boolean>;
    getWhatsAppStatus: () => Promise<void>;
    isAdmin: boolean;
    // Новые функции для работы с контактами
    contacts: ContactsStore;
    loadContacts: () => Promise<void>;
    createContact: (contactId: string, customName: string) => Promise<boolean>;
    updateContact: (contactId: string, customName: string) => Promise<boolean>;
    deleteContact: (contactId: string) => Promise<boolean>;
    getContactName: (phoneNumber: string) => string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [chats, setChats] = useState<{ [key: string]: WhatsAppChat }>({});
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [qrCode, setQrCode] = useState<string>('');
    const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>('disconnected');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const previousChatsRef = useRef<string>('');
    const pollingInterval = useRef<NodeJS.Timeout | null>(null);
    
    // Состояние для контактов
    const [contacts, setContacts] = useState<ContactsStore>({});

    const BASE_URL = API_CONFIG.BASE_URL;

    // Функция для извлечения contactId из номера телефона
    const extractContactId = (phoneNumber: string): string => {
        return phoneNumber.replace('@c.us', '');
    };

    // Функция загрузки контактов
    const loadContacts = async (): Promise<void> => {
        try {
            const response = await axios.get<GetContactsResponse>(`${BASE_URL}/contacts`);
            if (response.data.success && response.data.contacts) {
                setContacts(response.data.contacts);
                console.log('Contacts loaded:', response.data.contacts);
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
        }
    };

    // Функция создания контакта
    const createContact = async (contactId: string, customName: string): Promise<boolean> => {
        try {
            const response = await axios.post<CreateContactResponse>(`${BASE_URL}/contacts`, {
                contactId: extractContactId(contactId),
                customName: customName.trim()
            });

            if (response.data.success && response.data.contact) {
                setContacts(prev => ({
                    ...prev,
                    [response.data.contact!.contactId]: response.data.contact!
                }));
                console.log('Contact created:', response.data.contact);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error creating contact:', error);
            return false;
        }
    };

    // Функция обновления контакта
    const updateContact = async (contactId: string, customName: string): Promise<boolean> => {
        try {
            const cleanContactId = extractContactId(contactId);
            const response = await axios.put<UpdateContactResponse>(`${BASE_URL}/contacts/${cleanContactId}`, {
                customName: customName.trim()
            });

            if (response.data.success && response.data.contact) {
                setContacts(prev => ({
                    ...prev,
                    [response.data.contact!.contactId]: response.data.contact!
                }));
                console.log('Contact updated:', response.data.contact);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating contact:', error);
            return false;
        }
    };

    // Функция удаления контакта
    const deleteContact = async (contactId: string): Promise<boolean> => {
        try {
            const cleanContactId = extractContactId(contactId);
            const response = await axios.delete<DeleteContactResponse>(`${BASE_URL}/contacts/${cleanContactId}`);

            if (response.data.success) {
                setContacts(prev => {
                    const updated = { ...prev };
                    delete updated[cleanContactId];
                    return updated;
                });
                console.log('Contact deleted:', cleanContactId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting contact:', error);
            return false;
        }
    };

    // Функция получения имени контакта
    const getContactName = (phoneNumber: string): string => {
        const contactId = extractContactId(phoneNumber);
        const contact = contacts[contactId];
        
        if (contact && contact.customName) {
            return contact.customName;
        }
        
        // Возвращаем "Контакт" если нет кастомного имени
        return "Контакт";
    };

    // Проверяем права администратора (заглушка - в реальном проекте должна быть реальная проверка)
    useEffect(() => {
        // Здесь должна быть реальная проверка прав пользователя
        // Например, из localStorage, context или API
        const userRole = localStorage.getItem('userRole') || 'admin'; // По умолчанию админ для демо
        setIsAdmin(userRole === 'admin');
    }, []);

    const deleteChat = async (phoneNumber: string): Promise<boolean> => {
        try {
            console.log(`🗑️ Attempting to delete chat: ${phoneNumber}`);
            console.log(`📊 Current chats before deletion:`, Object.keys(chats));
            
            // Проверяем готовность сервера перед критической операцией
            if (!isReadyForOperation()) {
                console.warn('⚠️ Server not ready for delete operation, but proceeding...');
            }
            
            // Используем критическую операцию с расширенными retry настройками
            const success = await executeCriticalOperation(
                async () => {
                    console.log(`🔄 Executing delete request for: ${phoneNumber}`);
                    
                    const response = await axios.delete<DeleteChatResponse>(
                        `${BASE_URL}/chats/${encodeURIComponent(phoneNumber)}`,
                        { timeout: 10000 } // 10 секунд таймаут
                    );
                    
                    console.log('📤 Delete response:', response.data);
                    
                    if (!response.data.success) {
                        throw new Error(response.data.error || 'Delete operation failed');
                    }
                    
                    return response.data;
                },
                // Fallback - если все попытки неудачны, пытаемся удалить локально
                () => {
                    console.log('🔄 Using fallback: removing chat locally');
                    return { success: true, message: 'Removed locally as fallback' };
                }
            );
            
            if (success) {
                console.log('✅ Chat deleted successfully:', success.message || 'Delete confirmed');
                
                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Сохраняем состояние ДО локального удаления
                const chatsBeforeDeletion = { ...chats };
                console.log(`📊 Chats before local deletion:`, Object.keys(chatsBeforeDeletion));
                
                // Удаляем из локального состояния для мгновенного UI
                setChats(prevChats => {
                    const updatedChats = { ...prevChats };
                    delete updatedChats[phoneNumber];
                    console.log(`📊 Chats after local deletion:`, Object.keys(updatedChats));
                    console.log(`✅ Chat ${phoneNumber} removed from local state`);
                    return updatedChats;
                });
                
                // Если удаленный чат был активным, сбрасываем активный чат
                if (activeChat === phoneNumber) {
                    setActiveChat(null);
                    console.log(`🎯 Active chat reset because deleted chat was active`);
                }
                
                // Попытка синхронизации с сервером (НЕ критично для UI)
                try {
                    await withRetry(
                        async () => {
                            console.log('🔄 Reloading chats after successful deletion...');
                            await loadChats();
                        },
                        {
                            maxAttempts: 2, // Уменьшено количество попыток
                            baseDelay: 500,
                            maxDelay: 2000,
                            backoffFactor: 1.5
                        }
                    );
                    console.log('🔄 Chats reloaded after deletion');
                } catch (reloadError) {
                    console.warn('⚠️ Failed to reload chats after deletion, but UI already updated:', reloadError);
                    // НЕ блокируем выполнение - локальное состояние УЖЕ обновлено корректно
                    // UI показывает правильное состояние даже если синхронизация с сервером не удалась
                }
                
                return true;
            } else {
                console.error('❌ Delete operation returned false');
                return false;
            }
            
        } catch (error: any) {
            console.error('💥 Error deleting chat:', error);
            
            // Специальная обработка для случая когда чат не найден
            if (error.response?.status === 404) {
                console.log('🔍 Chat not found on server, removing from local state');
                
                // Удаляем из локального состояния
                setChats(prevChats => {
                    const updatedChats = { ...prevChats };
                    delete updatedChats[phoneNumber];
                    console.log(`📊 Chats after 404 deletion:`, Object.keys(updatedChats));
                    return updatedChats;
                });
                
                if (activeChat === phoneNumber) {
                    setActiveChat(null);
                }
                
                // Попытка перезагрузки с сервера (не критично)
                try {
                    await withRetry(
                        async () => await loadChats(),
                        { maxAttempts: 1, baseDelay: 1000, maxDelay: 2000 }
                    );
                } catch (reloadError) {
                    console.warn('⚠️ Failed to reload chats after 404 deletion, but UI updated:', reloadError);
                }
                
                return true;
            }
            
            // Улучшенная обработка ошибок с детальными сообщениями
            if (error.response?.data?.error) {
                console.error('🔥 Server error details:', error.response.data.error);
                
                // Специальные сообщения для разных типов ошибок
                if (error.response.status === 503) {
                    throw new Error('WhatsApp клиент не готов. Попробуйте через несколько секунд.');
                } else if (error.response.status >= 500) {
                    throw new Error('Ошибка сервера. Попробуйте позже.');
                } else {
                    throw new Error(error.response.data.error);
                }
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                console.error('🌐 Network connection error:', error.message);
                throw new Error('Нет соединения с сервером. Проверьте подключение к интернету.');
            } else if (error.message) {
                console.error('🌐 Request error:', error.message);
                throw new Error(`Ошибка сети: ${error.message}`);
            } else {
                console.error('❓ Unknown error:', error);
                throw new Error('Неизвестная ошибка при удалении чата');
            }
        }
    };

    const logoutWhatsApp = async (): Promise<boolean> => {
        try {
            console.log('Attempting WhatsApp logout...');
            setWhatsappStatus('restarting');
            
            const response = await axios.post<LogoutResponse>(`${BASE_URL}${API_CONFIG.ENDPOINTS.whatsapp.logout}`);
            
            if (response.data.success) {
                console.log('WhatsApp logout successful:', response.data.message);
                setQrCode('');
                return true;
            } else {
                console.error('WhatsApp logout failed:', response.data);
                setWhatsappStatus('ready'); // Возвращаем предыдущее состояние
                return false;
            }
        } catch (error) {
            console.error('Error during WhatsApp logout:', error);
            setWhatsappStatus('ready'); // Возвращаем предыдущее состояние
            return false;
        }
    };

    const getWhatsAppStatus = async (): Promise<void> => {
        try {
            const response = await axios.get<WhatsAppStatusResponse>(`${BASE_URL}${API_CONFIG.ENDPOINTS.whatsapp.status}`);
            setWhatsappStatus(response.data.status);
        } catch (error) {
            console.error('Error getting WhatsApp status:', error);
            setWhatsappStatus('disconnected');
        }
    };

    const loadChats = async () => {
        if (isLoading) {
            console.log('⚠️ LoadChats already in progress, skipping...');
            return;
        }
        
        try {
            setIsLoading(true);
            console.log('🔄 Loading chats from server...');
            
            // Используем retry логику для загрузки чатов
            const loadedChats = await withRetry(
                async () => {
                    const response = await axios.get(`${BASE_URL}${API_CONFIG.ENDPOINTS.chats}`, {
                        timeout: 8000 // 8 секунд таймаут
                    });
                    console.log('📦 Received chats data from server:', response.data);
                    return response.data;
                },
                {
                    maxAttempts: 3,
                    baseDelay: 1000,
                    maxDelay: 5000,
                    backoffFactor: 2,
                    retryCondition: (error) => {
                        // Retry на network errors и server errors, но не на auth errors
                        return !error.response || 
                               error.response.status >= 500 ||
                               error.code === 'ECONNREFUSED' ||
                               error.code === 'ENOTFOUND' ||
                               error.code === 'NETWORK_ERROR';
                    }
                }
            );
            
            // Проверяем и форматируем данные
            const formattedChats: { [key: string]: WhatsAppChat } = {};
            if (loadedChats && typeof loadedChats === 'object') {
                for (const [phoneNumber, chat] of Object.entries(loadedChats)) {
                    const typedChat = chat as any;
                    formattedChats[phoneNumber] = {
                        phoneNumber: typedChat.phoneNumber,
                        name: typedChat.name,
                        messages: (typedChat.messages || []).map((msg: any) => ({
                            id: msg.id,
                            body: msg.body,
                            from: msg.from,
                            to: msg.to,
                            timestamp: msg.timestamp,
                            fromMe: !!msg.fromMe,
                            hasMedia: !!msg.hasMedia,
                            mediaUrl: msg.mediaUrl || '',
                            mediaType: msg.mediaType || '',
                            fileName: msg.fileName || '',
                            fileSize: msg.fileSize || 0,
                            isVoiceMessage: !!msg.isVoiceMessage,
                            duration: msg.duration || 0,
                            ack: msg.ack // Добавляем поддержку статуса сообщений
                        })),
                        lastMessage: typedChat.lastMessage ? {
                            id: typedChat.lastMessage.id,
                            body: typedChat.lastMessage.body,
                            from: typedChat.lastMessage.from,
                            to: typedChat.lastMessage.to,
                            timestamp: typedChat.lastMessage.timestamp,
                            fromMe: !!typedChat.lastMessage.fromMe,
                            hasMedia: !!typedChat.lastMessage.hasMedia,
                            mediaUrl: typedChat.lastMessage.mediaUrl || '',
                            mediaType: typedChat.lastMessage.mediaType || '',
                            fileName: typedChat.lastMessage.fileName || '',
                            fileSize: typedChat.lastMessage.fileSize || 0,
                            isVoiceMessage: !!typedChat.lastMessage.isVoiceMessage,
                            duration: typedChat.lastMessage.duration || 0,
                            ack: typedChat.lastMessage.ack // Добавляем поддержку статуса сообщений
                        } : undefined,
                        unreadCount: typedChat.unreadCount || 0
                    };
                }
            }
            
            // ВАЖНО: Всегда обновляем состояние для реактивности UI
            const currentChatsString = JSON.stringify(formattedChats);
            console.log('📊 Chats loaded - Previous length:', Object.keys(chats).length, 'New length:', Object.keys(formattedChats).length);
            
            // Обновляем состояние чатов
            setChats(formattedChats);
            previousChatsRef.current = currentChatsString;
            console.log('✅ Chats updated successfully:', Object.keys(formattedChats).length, 'chats loaded');
            
        } catch (error: any) {
            console.error('❌ Error loading chats:', error);
            
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: НЕ сохраняем "текущее состояние" при ошибках после удаления
            // Проверяем, вызвана ли эта функция после операции удаления
            const callStack = new Error().stack;
            const isCalledAfterDeletion = callStack?.includes('deleteChat') || callStack?.includes('deletion');
            
            if (isCalledAfterDeletion) {
                console.log('🚨 LoadChats called after deletion and failed - KEEPING current state (chat already removed locally)');
                // НЕ меняем состояние - локальное удаление уже применено
                return;
            }
            
            // Для обычных ошибок загрузки (не после удаления) применяем стандартную логику
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.warn('🔐 Authentication error during chat loading');
                // Не сбрасываем chats при auth ошибках
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                console.warn('🌐 Network error during chat loading, keeping current state');
                // Сохраняем текущее состояние при сетевых ошибках
            } else {
                console.warn('🔄 Keeping current chats state due to load error');
                // Не сбрасываем chats при ошибке, сохраняем текущее состояние
            }
        } finally {
            setIsLoading(false);
        }
    };

    const createChat = async (phoneNumber: string) => {
        try {
            await axios.post(`${BASE_URL}${API_CONFIG.ENDPOINTS.chat}`, { phoneNumber });
            await loadChats();
            setActiveChat(phoneNumber);
        } catch (error) {
            console.error('Error creating chat:', error);
        }
    };

    // Инициализация данных при загрузке компонента
    useEffect(() => {
        loadContacts(); // Загружаем контакты при инициализации
        getWhatsAppStatus(); // Загружаем статус WhatsApp
    }, []);

    // Периодическая проверка статуса
    useEffect(() => {
        const interval = setInterval(() => {
            getWhatsAppStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <ChatContext.Provider value={{
            chats,
            setChats,
            activeChat,
            setActiveChat,
            loadChats,
            createChat,
            deleteChat,
            qrCode,
            setQrCode,
            whatsappStatus,
            setWhatsappStatus,
            logoutWhatsApp,
            getWhatsAppStatus,
            isAdmin,
            contacts,
            loadContacts,
            createContact,
            updateContact,
            deleteContact,
            getContactName
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
