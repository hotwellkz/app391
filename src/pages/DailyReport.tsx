import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useChat } from '../context/ChatContext';

interface DailyStats {
    totalMessages: number;
    totalChats: number;
    messagesByHour: { [hour: string]: number };
    topChats: { phoneNumber: string; messageCount: number }[];
}

const DailyReport: React.FC = () => {
    const { chats } = useChat();
    const [stats, setStats] = useState<DailyStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const calculateStats = () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let totalMessages = 0;
            const messagesByHour: { [hour: string]: number } = {};
            const chatStats: { [phoneNumber: string]: number } = {};

            // Подсчитываем статистику по всем чатам
            Object.values(chats).forEach(chat => {
                const chatMessages = chat.messages || [];
                let chatMessageCount = 0;

                chatMessages.forEach(message => {
                    const messageDate = new Date(message.timestamp);
                    if (messageDate >= today) {
                        totalMessages++;
                        chatMessageCount++;

                        const hour = messageDate.getHours().toString().padStart(2, '0');
                        messagesByHour[hour] = (messagesByHour[hour] || 0) + 1;
                    }
                });

                if (chatMessageCount > 0) {
                    chatStats[chat.phoneNumber] = chatMessageCount;
                }
            });

            // Сортируем чаты по количеству сообщений
            const topChats = Object.entries(chatStats)
                .map(([phoneNumber, count]) => ({ phoneNumber, messageCount: count }))
                .sort((a, b) => b.messageCount - a.messageCount)
                .slice(0, 5);

            setStats({
                totalMessages,
                totalChats: Object.keys(chatStats).length,
                messagesByHour,
                topChats
            });
            setLoading(false);
        };

        calculateStats();
    }, [chats]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!stats) {
        return <div className="flex justify-center items-center h-screen">No data available</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Daily Report</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Общая статистика */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Overview</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-gray-600">Total Messages</p>
                            <p className="text-2xl font-bold">{stats.totalMessages}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Active Chats</p>
                            <p className="text-2xl font-bold">{stats.totalChats}</p>
                        </div>
                    </div>
                </div>

                {/* Топ чатов */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Top Active Chats</h2>
                    <div className="space-y-3">
                        {stats.topChats.map((chat, index) => (
                            <div key={chat.phoneNumber} className="flex justify-between items-center">
                                <span className="text-gray-600">
                                    {index + 1}. {chat.phoneNumber}
                                </span>
                                <span className="font-semibold">{chat.messageCount} messages</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* График сообщений по часам */}
                <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">Messages by Hour</h2>
                    <div className="h-64 flex items-end space-x-2">
                        {Array.from({ length: 24 }).map((_, hour) => {
                            const hourStr = hour.toString().padStart(2, '0');
                            const count = stats.messagesByHour[hourStr] || 0;
                            const maxCount = Math.max(...Object.values(stats.messagesByHour));
                            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

                            return (
                                <div key={hour} className="flex-1 flex flex-col items-center">
                                    <div
                                        className="w-full bg-blue-500 rounded-t"
                                        style={{ height: `${height}%` }}
                                    />
                                    <span className="text-xs mt-1">{hourStr}:00</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyReport;