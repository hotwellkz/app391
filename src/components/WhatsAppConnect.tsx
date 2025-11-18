import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { WhatsAppMessage } from '../types/WhatsAppTypes';
import { useChat } from '../context/ChatContext';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import WhatsAppAvatar from './WhatsAppAvatar';
import { MdArrowBack } from 'react-icons/md';
import axios from 'axios';
import { UploadMediaResponse, ReadStatusResponse, UnreadCountsResponse, UnreadCountResponse } from '../types/WhatsAppTypes';

import { API_CONFIG } from '../config/api';

const BACKEND_URL = API_CONFIG.BASE_URL;

interface WhatsAppConnectProps {
    serverUrl: string;
    isMobile: boolean;
}

interface Chat {
    phoneNumber: string;
    name: string;
    avatarUrl?: string;
    lastMessage?: WhatsAppMessage;
    messages: WhatsAppMessage[];
    unreadCount: number;
}

interface AvatarBatchResponse {
    success: boolean;
    avatars?: { [phoneNumber: string]: string | null };
    message?: string;
    error?: string;
}

const WhatsAppConnect: React.FC<WhatsAppConnectProps> = ({ serverUrl, isMobile }) => {
    const { setQrCode, chats: contextChats, loadChats, setWhatsappStatus } = useChat();
    const [socket, setSocket] = useState<any>(null);
    const [isQrScanned, setIsQrScanned] = useState<boolean>(false);
    const [status, setStatus] = useState<string>('Подключение...');
    const [message, setMessage] = useState<string>('');
    const [chats, setChats] = useState<{ [key: string]: Chat }>({});
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showNewChatDialog, setShowNewChatDialog] = useState(false);
    const [newChatPhone, setNewChatPhone] = useState('');
    const [newChatName, setNewChatName] = useState('');

    // Функция для форматирования номера телефона
    const formatPhoneNumber = (phoneNumber: string) => {
        const cleaned = phoneNumber.replace(/\D/g, '');
        return cleaned.endsWith('@c.us') ? cleaned : `${cleaned}@c.us`;
    };

    // Функция для форматирования имени контакта
    const formatContactName = (chat: Chat) => {
        // Если есть кастомное имя (отличное от номера телефона), используем его
        if (chat.name && chat.name !== chat.phoneNumber.replace('@c.us', '')) {
            return chat.name;
        }
        // Иначе отображаем номер телефона без @c.us
        return chat.phoneNumber.replace('@c.us', '');
    };

    // =============================================================================
    // READ STATUS FUNCTIONS
    // =============================================================================

    // Функция для пометки чата как прочитанного
    const markChatAsRead = async (chatId: string) => {
        try {
            console.log(`📖 Marking chat ${chatId} as read`);
            
            const response = await axios.post<ReadStatusResponse>(`${BACKEND_URL}/read-status/mark-read/${chatId}`, {
                userId: undefined // Можно добавить userId если нужна многопользовательская система
            });

            if (response.data.success) {
                console.log(`✅ Chat ${chatId} marked as read:`, response.data.readStatus);
                
                // Обновляем UI - убираем счетчик непрочитанных
                setChats(prevChats => ({
                    ...prevChats,
                    [chatId]: {
                        ...prevChats[chatId],
                        unreadCount: 0
                    }
                }));
                
            } else {
                console.error('❌ Failed to mark chat as read:', response.data.error);
            }
        } catch (error) {
            console.error('❌ Error marking chat as read:', error);
        }
    };

    // Функция для загрузки корректных счетчиков непрочитанных
    const loadCorrectUnreadCounts = async () => {
        try {
            console.log('📊 Loading correct unread counts for all chats');
            
            const response = await axios.get<UnreadCountsResponse>(`${BACKEND_URL}/read-status/unread-counts/all`);
            
            if (response.data.success && response.data.unreadCounts) {
                const unreadCounts = response.data.unreadCounts;
                console.log('📊 Received unread counts:', unreadCounts);
                
                // Обновляем счетчики в чатах
                setChats(prevChats => {
                    const updatedChats = { ...prevChats };
                    
                    Object.keys(updatedChats).forEach(chatId => {
                        const correctCount = unreadCounts[chatId] || 0;
                        updatedChats[chatId] = {
                            ...updatedChats[chatId],
                            unreadCount: correctCount
                        };
                    });
                    
                    return updatedChats;
                });
                
                console.log('✅ Unread counts updated in UI');
            }
        } catch (error) {
            console.error('❌ Error loading unread counts:', error);
        }
    };

    // Функция для получения количества непрочитанных для конкретного чата
    const getUnreadCountForChat = async (chatId: string): Promise<number> => {
        try {
            const response = await axios.get<UnreadCountResponse>(`${BACKEND_URL}/read-status/${chatId}/unread-count`);
            
            if (response.data.success && typeof response.data.unreadCount === 'number') {
                return response.data.unreadCount;
            }
            
            return 0;
        } catch (error) {
            console.error(`❌ Error getting unread count for ${chatId}:`, error);
            return 0;
        }
    };

    // Функция создания нового контакта
    const handleCreateNewChat = () => {
        if (!newChatPhone) {
            alert('Пожалуйста, введите номер телефона');
            return;
        }

        const formattedPhone = formatPhoneNumber(newChatPhone);
        
        const newChat: Chat = {
            phoneNumber: formattedPhone,
            name: newChatName || formattedPhone.replace('@c.us', ''),
            avatarUrl: undefined, // Аватарка будет загружена позже
            messages: [],
            unreadCount: 0
        };

        setChats(prevChats => ({
            ...prevChats,
            [formattedPhone]: newChat
        }));

        setActiveChat(formattedPhone);
        setNewChatPhone('');
        setNewChatName('');
        setShowNewChatDialog(false);
        setSearchQuery('');
    };

    // Функция загрузки аватарок для чатов
    const loadAvatarsForChats = async (chatsToUpdate: { [key: string]: Chat }) => {
        try {
            const contactIds = Object.keys(chatsToUpdate);
            if (contactIds.length === 0) return;

            console.log('Loading avatars for', contactIds.length, 'chats');
            
            const response = await axios.post<AvatarBatchResponse>(`${BACKEND_URL}/avatars/batch`, {
                contactIds
            });

            if (response.data.success && response.data.avatars) {
                const avatars = response.data.avatars;
                
                setChats(prevChats => {
                    const updatedChats = { ...prevChats };
                    
                    Object.keys(avatars).forEach(phoneNumber => {
                        if (updatedChats[phoneNumber]) {
                            updatedChats[phoneNumber].avatarUrl = avatars[phoneNumber] || undefined;
                        }
                    });
                    
                    return updatedChats;
                });
                
                console.log('Avatars loaded for', Object.keys(avatars).length, 'contacts');
            }
        } catch (error) {
            console.error('Error loading avatars:', error);
        }
    };

    // Функция для добавления сообщения в чат
    const addMessageToChat = async (message: WhatsAppMessage) => {
        const phoneNumber = message.fromMe ? message.to : message.from;
        
        if (!phoneNumber) {
            console.error('Cannot determine phone number for message:', message);
            return;
        }
        
        setChats(prevChats => {
            const updatedChats = { ...prevChats };
            if (!updatedChats[phoneNumber]) {
                updatedChats[phoneNumber] = {
                    phoneNumber,
                    name: message.sender || formatPhoneNumber(phoneNumber).replace('@c.us', ''),
                    avatarUrl: undefined, // Аватарка будет загружена позже
                    messages: [],
                    unreadCount: 0 // Будет обновлено через API
                };
                
                // Загружаем аватарку для нового чата
                setTimeout(() => {
                    loadAvatarsForChats({ [phoneNumber]: updatedChats[phoneNumber] });
                }, 100);
            }

            const existingChat = updatedChats[phoneNumber];
            
            // Проверяем, существует ли уже сообщение с таким ID
            const existingMessageIndex = existingChat.messages.findIndex(msg => msg.id === message.id);
            
            if (existingMessageIndex !== -1) {
                // Сообщение уже существует - обновляем его (например, статус ack)
                const updatedMessages = [...existingChat.messages];
                updatedMessages[existingMessageIndex] = { ...message };
                
                updatedChats[phoneNumber] = {
                    ...existingChat,
                    messages: updatedMessages,
                    lastMessage: existingChat.lastMessage?.id === message.id ? message : existingChat.lastMessage
                };
                
                console.log(`🔄 Updated existing message ${message.id} with new data`);
            } else {
                // Проверяем на дублирование по содержимому для временных сообщений
                const messageExists = existingChat.messages.some(
                    (existingMsg: WhatsAppMessage) => {
                        // Проверяем по временному ID или реальному ID
                        if (existingMsg.id.startsWith('temp_') && message.id.startsWith('temp_')) {
                            return existingMsg.body === message.body && 
                                   existingMsg.fromMe === message.fromMe &&
                                   Math.abs(new Date(existingMsg.timestamp).getTime() - new Date(message.timestamp).getTime()) < 2000;
                        }
                        return false; // Не дублируем по ID выше
                    }
                );

                if (!messageExists) {
                    // Если это реальное сообщение, заменяем временное
                    let updatedMessages = existingChat.messages;
                    if (!message.id.startsWith('temp_')) {
                        updatedMessages = existingChat.messages.filter(
                            msg => !msg.id.startsWith('temp_') || 
                                   msg.body !== message.body || 
                                   msg.fromMe !== message.fromMe
                        );
                    }
                    
                    updatedMessages = [...updatedMessages, message];
                    
                    updatedChats[phoneNumber] = {
                        ...existingChat,
                        messages: updatedMessages,
                        lastMessage: message
                    };
                    
                    console.log(`✅ Added new message ${message.id} to chat ${phoneNumber}`);
                    
                    // *** ОБНОВЛЕННАЯ ЛОГИКА ПОДСЧЕТА НЕПРОЧИТАННЫХ ***
                    // Не увеличиваем счетчик здесь - получим корректное значение через API
                    if (!message.fromMe && phoneNumber !== activeChat) {
                        // Получаем корректное количество непрочитанных через API
                        setTimeout(async () => {
                            const correctUnreadCount = await getUnreadCountForChat(phoneNumber);
                            
                            setChats(currentChats => ({
                                ...currentChats,
                                [phoneNumber]: {
                                    ...currentChats[phoneNumber],
                                    unreadCount: correctUnreadCount
                                }
                            }));
                        }, 100);
                    }
                }
            }

            return updatedChats;
        });
    };

    // Функция для сброса счетчика непрочитанных сообщений
    const resetUnreadCount = async (phoneNumber: string) => {
        // Сначала обновляем UI мгновенно для лучшего UX
        setChats(prevChats => ({
            ...prevChats,
            [phoneNumber]: {
                ...prevChats[phoneNumber],
                unreadCount: 0
            }
        }));
        
        // Затем отправляем сигнал на сервер
        await markChatAsRead(phoneNumber);
    };

    // Загрузка существующих чатов при монтировании компонента
    useEffect(() => {
        if (!contextChats) return;
        
        const formattedChats: { [key: string]: Chat } = {};
        Object.entries(contextChats).forEach(([phoneNumber, chat]) => {
            formattedChats[phoneNumber] = {
                phoneNumber,
                name: chat.name,
                avatarUrl: chat.avatarUrl, // Сохраняем avatarUrl из контекста
                messages: Array.isArray(chat.messages) ? chat.messages.map(msg => ({
                    ...msg,
                    isVoiceMessage: msg.isVoiceMessage || false,
                    duration: msg.duration || 0,
                    hasMedia: msg.hasMedia || false,
                    mediaUrl: msg.mediaUrl || '',
                    mediaType: msg.mediaType || '',
                    fileName: msg.fileName || '',
                    fileSize: msg.fileSize || 0
                })) : [],
                lastMessage: chat.lastMessage ? {
                    ...chat.lastMessage,
                    isVoiceMessage: chat.lastMessage.isVoiceMessage || false,
                    duration: chat.lastMessage.duration || 0,
                    hasMedia: chat.lastMessage.hasMedia || false,
                    mediaUrl: chat.lastMessage.mediaUrl || '',
                    mediaType: chat.lastMessage.mediaType || '',
                    fileName: chat.lastMessage.fileName || '',
                    fileSize: chat.lastMessage.fileSize || 0
                } : undefined,
                unreadCount: chat.unreadCount || 0
            };
        });
        setChats(formattedChats);
        
        // Загружаем аватарки для чатов, которые их не имеют
        const chatsWithoutAvatars = Object.fromEntries(
            Object.entries(formattedChats).filter(([_, chat]) => !chat.avatarUrl)
        );
        
        if (Object.keys(chatsWithoutAvatars).length > 0) {
            loadAvatarsForChats(chatsWithoutAvatars);
        }
        
        // *** ЗАГРУЖАЕМ КОРРЕКТНЫЕ СЧЕТЧИКИ НЕПРОЧИТАННЫХ ***
        setTimeout(() => {
            loadCorrectUnreadCounts();
        }, 500); // Небольшая задержка для стабильности
    }, [contextChats]);

    useEffect(() => {
        const newSocket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
            console.log('Connected to server, socket id:', newSocket.id);
            setStatus('Подключено к серверу');
        });

        newSocket.on('connect_error', (error: Error) => {
            console.error('Connection error:', error);
            setStatus('Ошибка подключения к серверу');
        });

        // Обработчик подтверждения отправки сообщения
        newSocket.on('message-sent', (data: { success: boolean; message?: WhatsAppMessage; error?: string; chat?: Chat }) => {
            console.log('Получено подтверждение отправки:', data);
            if (data.success && data.message) {
                // Обновляем сообщение с правильными данными от сервера
                addMessageToChat(data.message);
                if (data.chat) {
                    // Обновляем весь чат если предоставлен
                    setChats(prevChats => ({
                        ...prevChats,
                        [data.chat!.phoneNumber]: {
                            ...data.chat!,
                            avatarUrl: data.chat!.avatarUrl || prevChats[data.chat!.phoneNumber]?.avatarUrl, // Сохраняем существующую аватарку
                            messages: Array.isArray(data.chat!.messages) ? data.chat!.messages.map(msg => ({
                                ...msg,
                                isVoiceMessage: msg.isVoiceMessage || false,
                                duration: msg.duration || 0,
                                hasMedia: msg.hasMedia || false,
                                mediaUrl: msg.mediaUrl || '',
                                mediaType: msg.mediaType || '',
                                fileName: msg.fileName || '',
                                fileSize: msg.fileSize || 0
                            })) : []
                        }
                    }));
                }
            } else if (!data.success) {
                console.error('Ошибка отправки сообщения:', data.error);
                alert(`Ошибка отправки: ${data.error}`);
            }
        });

        newSocket.on('qr', (qrData: string) => {
            console.log('Получен QR-код, длина:', qrData.length);
            try {
                const parsedData = JSON.parse(qrData);
                console.log('QR данные в формате JSON:', parsedData);
                
                if (typeof parsedData === 'object') {
                    const qrString = parsedData.code || parsedData.qr || parsedData.data || qrData;
                    console.log('Извлеченная строка QR:', qrString);
                    setQrCode(qrString);
                } else {
                    setQrCode(qrData);
                }
            } catch (e) {
                console.log('QR данные в обычном формате:', qrData);
                setQrCode(qrData);
            }
            
            setIsQrScanned(false);
            setStatus('Ожидание сканирования QR-кода');
            setWhatsappStatus('qr_pending');
        });

        newSocket.on('ready', () => {
            console.log('WhatsApp готов');
            setStatus('WhatsApp подключен');
            setIsQrScanned(true);
            setQrCode('');
            setWhatsappStatus('ready');
        });

        newSocket.on('restarting', (data: { message: string }) => {
            console.log('WhatsApp перезапускается:', data.message);
            setStatus(data.message);
            setIsQrScanned(false);
            setQrCode('');
            setWhatsappStatus('restarting');
        });

        newSocket.on('whatsapp-message', (message: WhatsAppMessage) => {
            console.log('Получено новое сообщение:', message);
            addMessageToChat(message);
        });

        newSocket.on('chat-updated', async (updatedChat: Chat) => {
            console.log('Получено обновление чата:', updatedChat);
            if (updatedChat && updatedChat.phoneNumber) {
                
                // Получаем корректное количество непрочитанных через API
                let correctUnreadCount = 0;
                if (updatedChat.phoneNumber !== activeChat) {
                    correctUnreadCount = await getUnreadCountForChat(updatedChat.phoneNumber);
                }
                
                setChats(prevChats => ({
                    ...prevChats,
                    [updatedChat.phoneNumber]: {
                        ...updatedChat,
                        avatarUrl: updatedChat.avatarUrl || prevChats[updatedChat.phoneNumber]?.avatarUrl,
                        messages: Array.isArray(updatedChat.messages) ? updatedChat.messages.map(msg => ({
                            ...msg,
                            isVoiceMessage: msg.isVoiceMessage || false,
                            duration: msg.duration || 0,
                            hasMedia: msg.hasMedia || false,
                            mediaUrl: msg.mediaUrl || '',
                            mediaType: msg.mediaType || '',
                            fileName: msg.fileName || '',
                            fileSize: msg.fileSize || 0
                        })) : [],
                        lastMessage: updatedChat.lastMessage ? {
                            ...updatedChat.lastMessage,
                            isVoiceMessage: updatedChat.lastMessage.isVoiceMessage || false,
                            duration: updatedChat.lastMessage.duration || 0,
                            hasMedia: updatedChat.lastMessage.hasMedia || false,
                            mediaUrl: updatedChat.lastMessage.mediaUrl || '',
                            mediaType: updatedChat.lastMessage.mediaType || '',
                            fileName: updatedChat.lastMessage.fileName || '',
                            fileSize: updatedChat.lastMessage.fileSize || 0
                        } : undefined,
                        // *** ИСПОЛЬЗУЕМ КОРРЕКТНЫЙ СЧЕТЧИК ИЗ API ***
                        unreadCount: correctUnreadCount
                    }
                }));
            }
        });

        // =============================================================================
        // НОВЫЕ ОБРАБОТЧИКИ СОБЫТИЙ АККАУНТА
        // =============================================================================

        // Обработчик подключения аккаунта
        newSocket.on('account-connected', (accountInfo: any) => {
            console.log('🔗 Account connected:', accountInfo);
            // Можно показать уведомление о подключении нового аккаунта
        });

        // Обработчик отключения аккаунта
        newSocket.on('account-disconnected', (data: { reason: string }) => {
            console.log('🔌 Account disconnected:', data.reason);
            // Очищаем чаты при отключении аккаунта
            setChats({});
            setActiveChat(null);
        });

        // Обработчик сброса аккаунта
        newSocket.on('account-reset', (data: { message: string }) => {
            console.log('🔄 Account reset:', data.message);
            // Очищаем все данные
            setChats({});
            setActiveChat(null);
            alert('Аккаунт WhatsApp был сброшен. Требуется повторная аутентификация.');
        });

        // Обработчик выхода из аккаунта
        newSocket.on('account-logout', (data: { message: string }) => {
            console.log('🚪 Account logout:', data.message);
            // Сохраняем чаты, но сбрасываем активный
            setActiveChat(null);
        });

        // Обработчик ошибки аутентификации
        newSocket.on('account-auth-failed', (data: { error: string }) => {
            console.log('❌ Account auth failed:', data.error);
            setChats({});
            setActiveChat(null);
            alert('Ошибка аутентификации WhatsApp. Попробуйте подключиться заново.');
        });

        // =============================================================================
        // КОНЕЦ НОВЫХ ОБРАБОТЧИКОВ
        // =============================================================================

        newSocket.on('disconnected', () => {
            console.log('WhatsApp отключен');
            setStatus('WhatsApp отключен');
            setIsQrScanned(false);
            setQrCode('');
            setWhatsappStatus('disconnected');
        });

        newSocket.on('auth_failure', (error: string) => {
            console.error('Ошибка аутентификации:', error);
            setStatus(`Ошибка: ${error}`);
            setWhatsappStatus('disconnected');
        });

        newSocket.on('error', (error: { message: string }) => {
            console.error('Ошибка Socket.IO:', error);
            setStatus(`Ошибка: ${error.message}`);
        });

        // Обработчик обновления статуса сообщений (ACK)
        newSocket.on('message-ack-updated', (data: { messageId: string; ack: number; chatId: string; timestamp: string }) => {
            console.log('📊 Message ACK updated:', data);
            
            setChats(prevChats => {
                const updatedChats = { ...prevChats };
                const chat = updatedChats[data.chatId];
                
                if (chat && chat.messages) {
                    // Создаем новый массив сообщений с обновленным статусом
                    const updatedMessages = chat.messages.map(msg => {
                        if (msg.id === data.messageId) {
                            console.log(`🔄 Updating message ${data.messageId} ACK from ${msg.ack} to ${data.ack}`);
                            return { ...msg, ack: data.ack };
                        }
                        return msg;
                    });
                    
                    // Обновляем чат с новыми сообщениями
                    updatedChats[data.chatId] = {
                        ...chat,
                        messages: updatedMessages,
                        // Обновляем последнее сообщение если это оно
                        lastMessage: chat.lastMessage && chat.lastMessage.id === data.messageId 
                            ? { ...chat.lastMessage, ack: data.ack }
                            : chat.lastMessage
                    };
                }
                
                return updatedChats;
            });
        });

        setSocket(newSocket);

        fetch(`${BACKEND_URL}/chats`, {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(chatsData => {
                console.log('Received chats from server:', chatsData);
                if (chatsData && typeof chatsData === 'object') {
                    const formattedChats: { [key: string]: Chat } = {};
                    Object.entries(chatsData).forEach(([phoneNumber, chat]: [string, any]) => {
                        if (chat && chat.phoneNumber) {
                            formattedChats[phoneNumber] = {
                                phoneNumber: chat.phoneNumber,
                                name: chat.name || chat.phoneNumber.replace('@c.us', ''),
                                avatarUrl: chat.avatarUrl, // Включаем avatarUrl с сервера
                                messages: Array.isArray(chat.messages) ? chat.messages.map((msg: any) => ({
                                    ...msg,
                                    isVoiceMessage: msg.isVoiceMessage || false,
                                    duration: msg.duration || 0,
                                    hasMedia: msg.hasMedia || false,
                                    mediaUrl: msg.mediaUrl || '',
                                    mediaType: msg.mediaType || '',
                                    fileName: msg.fileName || '',
                                    fileSize: msg.fileSize || 0
                                })) : [],
                                lastMessage: chat.lastMessage ? {
                                    ...chat.lastMessage,
                                    isVoiceMessage: chat.lastMessage.isVoiceMessage || false,
                                    duration: chat.lastMessage.duration || 0,
                                    hasMedia: chat.lastMessage.hasMedia || false,
                                    mediaUrl: chat.lastMessage.mediaUrl || '',
                                    mediaType: chat.lastMessage.mediaType || '',
                                    fileName: chat.lastMessage.fileName || '',
                                    fileSize: chat.lastMessage.fileSize || 0
                                } : undefined,
                                unreadCount: typeof chat.unreadCount === 'number' ? chat.unreadCount : 0
                            };
                        }
                    });
                    console.log('Formatted chats:', formattedChats);
                    setChats(formattedChats);
                    
                    // Загружаем аватарки для чатов, которые их не имеют
                    const chatsWithoutAvatars = Object.fromEntries(
                        Object.entries(formattedChats).filter(([_, chat]) => !chat.avatarUrl)
                    );
                    
                    if (Object.keys(chatsWithoutAvatars).length > 0) {
                        loadAvatarsForChats(chatsWithoutAvatars);
                    }
                    
                    // *** ЗАГРУЖАЕМ КОРРЕКТНЫЕ СЧЕТЧИКИ НЕПРОЧИТАННЫХ ***
                    setTimeout(() => {
                        loadCorrectUnreadCounts();
                    }, 500); // Небольшая задержка для стабильности
                } else {
                    console.warn('Received invalid chats data:', chatsData);
                    setChats({});
                }
            })
            .catch(error => {
                console.error('Error loading chats:', error);
                setChats({});
            });

        return () => {
            newSocket.close();
        };
    }, [serverUrl, setQrCode, setWhatsappStatus]);

    // Функция для отправки сообщения
    const handleSendMessage = async (phoneNumber: string, message: string, file?: File) => {
        if (!socket) return;

        try {
            let mediaUrl = '';
            let mediaType = '';
            let fileName = '';
            let fileSize = 0;

            if (file) {
                // Создаем FormData для загрузки файла
                const formData = new FormData();
                formData.append('file', file);

                // Загружаем файл на сервер
                const response = await axios.post<UploadMediaResponse>(`${BACKEND_URL}/upload-media`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    withCredentials: true
                });

                if (response.data.url) {
                    mediaUrl = response.data.url;
                    mediaType = file.type || 'application/octet-stream';
                    fileName = file.name;
                    fileSize = file.size;
                }
            }

            // Создаем временное сообщение для немедленного отображения
            const tempMessage: WhatsAppMessage = {
                id: `temp_${Date.now()}`,
                body: message,
                from: phoneNumber.replace('@c.us', ''), // Убираем @c.us для отображения
                to: phoneNumber,
                timestamp: new Date().toISOString(),
                fromMe: true,
                hasMedia: !!mediaUrl,
                mediaUrl,
                mediaType,
                fileName,
                fileSize,
                isVoiceMessage: false,
                duration: 0
            };

            // Добавляем временное сообщение в UI для немедленного отображения
            addMessageToChat(tempMessage);

            // Отправляем сообщение через сокет
            socket.emit('send_message', {
                phoneNumber,
                message,
                mediaUrl,
                mediaType,
                fileName,
                fileSize
            });

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    const handleNewChat = () => {
        setShowNewChatDialog(true);
    };

    return (
        <div className="flex h-full">
            {/* Модальное окно создания нового чата */}
            {showNewChatDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg w-96 mx-4">
                        <h2 className="text-lg font-semibold mb-4">Новый чат</h2>
                        <input
                            type="text"
                            placeholder="Номер телефона"
                            value={newChatPhone}
                            onChange={(e) => setNewChatPhone(e.target.value)}
                            className="w-full p-2 mb-2 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Имя (необязательно)"
                            value={newChatName}
                            onChange={(e) => setNewChatName(e.target.value)}
                            className="w-full p-2 mb-4 border rounded"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowNewChatDialog(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleCreateNewChat}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Создать
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Список чатов (скрывается на мобильных при открытом чате) */}
            <div className={`${isMobile && activeChat ? 'hidden' : 'flex flex-col h-full md:w-[400px] md:flex-shrink-0'}`}>
                <ChatList
                    chats={chats}
                    activeChat={activeChat}
                    setActiveChat={(chatId) => {
                        setActiveChat(chatId);
                        resetUnreadCount(chatId);
                    }}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onNewChat={handleNewChat}
                    isMobile={isMobile}
                />
            </div>
            
            {/* Окно чата (на мобильных занимает весь экран) */}
            <div className={`${isMobile && !activeChat ? 'hidden' : 'flex-1 flex flex-col h-full min-w-0'}`}>
                {activeChat && chats[activeChat] ? (
                    <div className="flex flex-col h-full">
                        {/* Шапка чата с кнопкой "Назад" для мобильной версии */}
                        {isMobile ? (
                            <div className="sticky top-0 z-10 bg-[#f0f2f5] flex items-center p-2 border-b border-gray-200 flex-shrink-0">
                                <button
                                    onClick={() => setActiveChat(null)}
                                    className="p-2 hover:bg-gray-200 rounded-full mr-2 transition-colors"
                                >
                                    <MdArrowBack size={24} />
                                </button>
                                <WhatsAppAvatar
                                    src={chats[activeChat].avatarUrl}
                                    name={formatContactName(chats[activeChat])}
                                    contactId={chats[activeChat].phoneNumber}
                                    size="medium"
                                    className="mr-3"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold">{formatContactName(chats[activeChat])}</div>
                                    <div className="text-sm text-gray-500">онлайн</div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#f0f2f5] p-2 flex items-center border-b border-gray-200 flex-shrink-0">
                                <WhatsAppAvatar
                                    src={chats[activeChat].avatarUrl}
                                    name={formatContactName(chats[activeChat])}
                                    contactId={chats[activeChat].phoneNumber}
                                    size="medium"
                                    className="mr-3"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold">{formatContactName(chats[activeChat])}</div>
                                    <div className="text-sm text-gray-500">онлайн</div>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex-1 min-h-0">
                            <ChatWindow
                                chat={activeChat ? chats[activeChat] : null}
                                onSendMessage={(text, file) => handleSendMessage(activeChat!, text, file)}
                                isMobile={isMobile}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#f0f2f5] p-2 flex items-center justify-center border-b border-gray-200 h-full">
                        <div className="text-gray-500">Выберите чат для начала общения</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsAppConnect;
