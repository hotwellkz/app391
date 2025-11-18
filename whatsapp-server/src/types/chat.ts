export interface ChatMessage {
    id: string;
    body: string;
    from?: string;
    to: string;
    timestamp: string;
    fromMe: boolean;
    hasMedia?: boolean;
    mediaUrl?: string;
    mediaType?: string;
    fileName?: string;
    fileSize?: number;
    isVoiceMessage?: boolean;
    duration?: number; // Длительность голосового сообщения в секундах
    ack?: number; // Статус сообщения: 0=отправлено, 1=доставлено на сервер, 2=доставлено получателю, 3=прочитано
}

export interface Chat {
    id: string;
    phoneNumber: string;
    name?: string;
    avatarUrl?: string; // URL аватарки контакта
    messages: ChatMessage[];
    lastMessage?: ChatMessage;
    unreadCount?: number;
    timestamp: string;
}

export interface ChatStore {
    [key: string]: Chat;
}

// Интерфейс для кэширования аватарок
export interface AvatarCache {
    [contactId: string]: {
        url: string | null;
        fetchedAt: number;
        expiresAt: number;
    };
}
