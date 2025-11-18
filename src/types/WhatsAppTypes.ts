export interface WhatsAppMessage {
    id: string;
    body: string;
    from?: string;
    to?: string;
    timestamp: string;
    fromMe: boolean;
    sender?: string;
    hasMedia?: boolean;
    mediaUrl?: string;
    mediaType?: string;
    fileName?: string;
    fileSize?: number;
    isVoiceMessage?: boolean;
    duration?: number;
    ack?: number; // Статус сообщения: 0=отправлено, 1=доставлено на сервер, 2=доставлено получателю, 3=прочитано
}

export interface Chat {
    phoneNumber: string;
    name: string;
    avatarUrl?: string;
    lastMessage?: WhatsAppMessage;
    messages: WhatsAppMessage[];
    unreadCount: number;
}

export interface ChatStore {
    [key: string]: Chat;
}

export type WhatsAppStatus = 'connecting' | 'qr_pending' | 'ready' | 'disconnected' | 'restarting';

export interface WhatsAppStatusResponse {
    isReady: boolean;
    hasQr: boolean;
    status: WhatsAppStatus;
    accountInfo?: WhatsAppAccountInfo | null;
}

export interface LogoutResponse {
    success: boolean;
    message?: string;
    error?: string;
}

export interface DeleteChatResponse {
    success: boolean;
    message?: string;
    error?: string;
}

export interface UploadMediaResponse {
    success: boolean;
    url?: string;
    mediaId?: string;
    message?: string;
    error?: string;
}

// Новый интерфейс для аватарок
export interface AvatarResponse {
    success: boolean;
    avatarUrl?: string;
    contactId?: string;
    error?: string;
}

// Новые типы для системы кастомных имен контактов
export interface Contact {
    contactId: string; // Номер телефона без @c.us
    customName: string;
    createdAt: string;
    updatedAt: string;
}

export interface ContactsStore {
    [contactId: string]: Contact;
}

export interface CreateContactResponse {
    success: boolean;
    contact?: Contact;
    message?: string;
    error?: string;
}

export interface UpdateContactResponse {
    success: boolean;
    contact?: Contact;
    message?: string;
    error?: string;
}

export interface GetContactsResponse {
    success: boolean;
    contacts?: ContactsStore;
    message?: string;
    error?: string;
}

export interface DeleteContactResponse {
    success: boolean;
    message?: string;
    error?: string;
}

// =============================================================================
// READ STATUS TYPES
// =============================================================================

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
    error?: string;
    message?: string;
}

export interface GetReadStatusResponse {
    success: boolean;
    readStatus?: ReadStatus | null;
    error?: string;
}

export interface UnreadCountResponse {
    success: boolean;
    unreadCount?: number;
    error?: string;
}

export interface UnreadCountsResponse {
    success: boolean;
    unreadCounts?: { [chatId: string]: number };
    error?: string;
}

// =============================================================================
// ACCOUNT MANAGEMENT TYPES
// =============================================================================

export interface WhatsAppAccountInfo {
    phoneNumber?: string;
    name?: string;
    profilePicUrl?: string;
    isReady: boolean;
    connectedAt?: string;
}

export interface AccountStatusResponse {
    success: boolean;
    account?: WhatsAppAccountInfo;
    hasActiveAccount?: boolean;
    error?: string;
}

export interface ResetAccountResponse {
    success: boolean;
    message?: string;
    requiresNewAuth?: boolean;
    error?: string;
}

export interface ChatsSummaryResponse {
    success: boolean;
    summary?: {
        totalChats: number;
        totalMessages: number;
        totalUnreadChats: number;
        currentAccount: string | null;
        hasMultipleAccountData: boolean;
        readStatusEntries: number;
    };
    chats?: string[];
    accountInfo?: WhatsAppAccountInfo;
    error?: string;
}
