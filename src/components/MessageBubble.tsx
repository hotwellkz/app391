import React, { memo } from 'react';
import { WhatsAppMessage } from '../types/WhatsAppTypes';
import { MdAttachFile } from 'react-icons/md';
import MessageStatus from './MessageStatus';

interface MessageBubbleProps {
    message: WhatsAppMessage;
    className?: string;
}

/**
 * Оптимизированный компонент для отображения отдельного сообщения
 * Использует React.memo для предотвращения лишних перерендеров
 */
const MessageBubble: React.FC<MessageBubbleProps> = memo(({ message, className = '' }) => {
    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const renderMedia = (message: WhatsAppMessage) => {
        // Сначала проверяем, является ли это голосовым сообщением
        if (message.isVoiceMessage && message.mediaUrl) {
            return (
                <div className="flex items-center gap-2 bg-white/50 rounded p-2">
                    <audio src={message.mediaUrl} controls className="max-w-[200px]" controlsList="nodownload" />
                    {message.duration && (
                        <span className="text-sm text-gray-500">
                            {formatDuration(message.duration)}
                        </span>
                    )}
                </div>
            );
        }

        // Затем проверяем остальные типы медиа
        if (!message.hasMedia || !message.mediaUrl) return null;

        const mediaType = message.mediaType?.toLowerCase() || '';

        if (mediaType.startsWith('image/') || mediaType === 'image') {
            return (
                <img
                    src={message.mediaUrl}
                    alt="Изображение"
                    className="max-w-[200px] max-h-[200px] rounded-lg cursor-pointer"
                    onClick={() => window.open(message.mediaUrl, '_blank')}
                />
            );
        } else if (mediaType.startsWith('video/') || mediaType === 'video') {
            return (
                <video
                    src={message.mediaUrl}
                    controls
                    className="max-w-[200px] max-h-[200px] rounded-lg"
                />
            );
        } else if (mediaType.startsWith('audio/')) {
            return (
                <div className="flex items-center gap-2">
                    <audio src={message.mediaUrl} controls className="max-w-[200px]" />
                    {message.duration && (
                        <span className="text-sm text-gray-500">
                            {formatDuration(message.duration)}
                        </span>
                    )}
                </div>
            );
        } else {
            return (
                <a
                    href={message.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
                >
                    <MdAttachFile />
                    <span>{message.fileName || 'Скачать файл'}</span>
                    {message.fileSize && (
                        <span className="text-sm text-gray-500">
                            ({(message.fileSize / 1024 / 1024).toFixed(2)} MB)
                        </span>
                    )}
                </a>
            );
        }
    };

    return (
        <div
            className={`whatsapp-message-container flex ${
                message.fromMe 
                    ? 'justify-end whatsapp-message-outgoing' 
                    : 'justify-start whatsapp-message-incoming'
            } ${className}`}
        >
            <div
                className={`whatsapp-message rounded-lg p-3 ${
                    message.fromMe 
                        ? 'outgoing' 
                        : 'incoming'
                }`}
            >
                {renderMedia(message)}
                {message.body && <p className="break-words">{message.body}</p>}
                <MessageStatus 
                    ack={message.ack}
                    fromMe={message.fromMe}
                    timestamp={message.timestamp}
                />
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Кастомная функция сравнения для оптимизации
    const prevMsg = prevProps.message;
    const nextMsg = nextProps.message;
    
    // Сравниваем только важные поля, которые могут измениться
    return (
        prevMsg.id === nextMsg.id &&
        prevMsg.ack === nextMsg.ack &&
        prevMsg.body === nextMsg.body &&
        prevMsg.mediaUrl === nextMsg.mediaUrl &&
        prevMsg.fromMe === nextMsg.fromMe &&
        prevMsg.timestamp === nextMsg.timestamp
    );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble; 