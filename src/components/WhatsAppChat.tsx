import React, { useEffect, useRef, useState } from 'react';
import { WhatsAppMessage } from '../types/WhatsAppTypes';

const io = require('socket.io-client');

interface WhatsAppChatProps {
    serverUrl: string;
}

const WhatsAppChat: React.FC<WhatsAppChatProps> = ({ serverUrl }) => {
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [socket, setSocket] = useState<any>(null);
    const [connected, setConnected] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const newSocket = io(serverUrl, {
            withCredentials: true
        });

        newSocket.on('connect', () => {
            setConnected(true);
            console.log('Connected to WebSocket server');
        });

        newSocket.on('disconnect', () => {
            setConnected(false);
            console.log('Disconnected from WebSocket server');
        });

        newSocket.on('whatsapp-message', (message: WhatsAppMessage) => {
            console.log('Received message:', message);
            setMessages(prev => [...prev, message]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [serverUrl]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-100">
            {/* Статус подключения */}
            <div className="bg-white p-4 shadow-sm">
                <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                        connected ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm text-gray-600">
                        {connected ? 'Подключено' : 'Отключено'}
                    </span>
                </div>
            </div>

            {/* Область сообщений */}
            <div className="flex-1 overflow-y-auto whatsapp-messages-container whatsapp-messages-list">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-4">
                        Нет сообщений
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={index}
                            className={`whatsapp-message-container flex ${
                                message.fromMe 
                                    ? 'justify-end whatsapp-message-outgoing' 
                                    : 'justify-start whatsapp-message-incoming'
                            }`}
                        >
                            <div
                                className={`whatsapp-message rounded-lg p-3 ${
                                    message.fromMe
                                        ? 'outgoing text-gray-800'
                                        : 'incoming text-gray-800'
                                }`}
                            >
                                <div className="break-words">{message.body}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {formatTime(message.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default WhatsAppChat;
