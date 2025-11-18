export interface ReadStatus {
    chatId: string; // phoneNumber чата
    userId?: string; // ID пользователя (для многопользовательской системы)
    lastReadMessageId: string; // ID последнего прочитанного сообщения
    lastReadTimestamp: string; // Timestamp последнего прочитанного сообщения
    updatedAt: string; // Когда был обновлен статус
}

export interface ReadStatusStore {
    [chatId: string]: ReadStatus;
}

export interface UpdateReadStatusRequest {
    chatId: string;
    messageId: string;
    timestamp: string;
    userId?: string;
}

export interface ReadStatusResponse {
    success: boolean;
    readStatus?: ReadStatus;
    message?: string;
    error?: string;
}

export interface GetReadStatusResponse {
    success: boolean;
    readStatuses?: ReadStatusStore;
    message?: string;
    error?: string;
}

export interface UnreadCountResponse {
    success: boolean;
    chatId?: string;
    unreadCount?: number;
    lastMessages?: any[];
    message?: string;
    error?: string;
} 