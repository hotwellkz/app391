import React, { useState, useEffect } from 'react';
import { FaCheck, FaCheckDouble } from 'react-icons/fa';

interface MessageStatusProps {
    ack?: number;
    fromMe: boolean;
    timestamp: string;
    className?: string;
}

/**
 * Компонент для отображения статуса сообщений
 * 
 * Значения ack:
 * 0 — отправлено (одна серая галочка)
 * 1 — доставлено на сервер (одна серая галочка)  
 * 2 — доставлено получателю (две серые галочки)
 * 3 — прочитано (две синие галочки)
 */
const MessageStatus: React.FC<MessageStatusProps> = ({ ack, fromMe, timestamp, className = '' }) => {
    const [currentAck, setCurrentAck] = useState<number | undefined>(ack);

    // Обновляем локальный статус при изменении props.ack
    useEffect(() => {
        if (ack !== currentAck) {
            setCurrentAck(ack);
        }
    }, [ack, currentAck]);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusIcon = (ackValue: number) => {
        switch (ackValue) {
            case 0:
            case 1:
                return (
                    <FaCheck 
                        style={{ 
                            color: '#667781', 
                            fontSize: '12px',
                            opacity: 0.8
                        }} 
                        title="Отправлено"
                    />
                );
            case 2:
                return (
                    <FaCheckDouble 
                        style={{ 
                            color: '#667781', 
                            fontSize: '12px',
                            opacity: 0.8
                        }} 
                        title="Доставлено"
                    />
                );
            case 3:
                return (
                    <FaCheckDouble 
                        style={{ 
                            color: '#53bdeb', 
                            fontSize: '12px'
                        }} 
                        title="Прочитано"
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className={`message-status flex items-center justify-end gap-1 mt-1 ${className}`}>
            <span className="text-xs opacity-60" style={{ color: '#667781', fontSize: '11px' }}>
                {formatTime(timestamp)}
            </span>
            {fromMe && currentAck !== undefined && (
                <span className="status-icon">
                    {getStatusIcon(currentAck)}
                </span>
            )}
        </div>
    );
};

export default MessageStatus; 