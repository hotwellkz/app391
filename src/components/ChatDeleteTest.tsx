import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { MdDelete, MdRefresh, MdInfo } from 'react-icons/md';
import toast from 'react-hot-toast';

/**
 * Тестовый компонент для демонстрации исправления проблемы с удалением чатов
 * 
 * Показывает:
 * - Список всех чатов с кнопками удаления
 * - Статистику чатов в реальном времени
 * - Возможность перезагрузки списка чатов
 * - Логи операций удаления
 */
const ChatDeleteTest: React.FC = () => {
    const { chats, loadChats, deleteChat, activeChat, setActiveChat } = useChat();
    const [isLoading, setIsLoading] = useState(false);
    const [testLog, setTestLog] = useState<string[]>([]);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setTestLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
    };

    const handleDeleteTest = async (phoneNumber: string, chatName: string) => {
        try {
            addLog(`🗑️ Начинаем удаление чата: ${chatName}`);
            
            const success = await deleteChat(phoneNumber);
            
            if (success) {
                addLog(`✅ Чат ${chatName} успешно удален`);
                toast.success(`Чат ${chatName} удален`);
            } else {
                addLog(`❌ Не удалось удалить чат ${chatName}`);
                toast.error(`Не удалось удалить чат ${chatName}`);
            }
        } catch (error: any) {
            addLog(`💥 Ошибка при удалении ${chatName}: ${error.message}`);
            toast.error(`Ошибка: ${error.message}`);
        }
    };

    const handleRefreshChats = async () => {
        setIsLoading(true);
        try {
            addLog('🔄 Принудительная перезагрузка чатов...');
            await loadChats();
            addLog('✅ Чаты перезагружены');
            toast.success('Чаты перезагружены');
        } catch (error: any) {
            addLog(`❌ Ошибка перезагрузки: ${error.message}`);
            toast.error('Ошибка перезагрузки');
        } finally {
            setIsLoading(false);
        }
    };

    const chatsList = Object.entries(chats);
    const chatsCount = chatsList.length;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
                    <h2 className="text-2xl font-bold mb-2">🧪 Тест удаления чатов</h2>
                    <p className="opacity-90">Демонстрация исправления проблемы с исчезающими чатами</p>
                </div>

                <div className="p-6">
                    {/* Статистика */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{chatsCount}</div>
                            <div className="text-sm text-blue-800">Всего чатов</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {activeChat ? '1' : '0'}
                            </div>
                            <div className="text-sm text-green-800">Активный чат</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{testLog.length}</div>
                            <div className="text-sm text-purple-800">Записей в логе</div>
                        </div>
                    </div>

                    {/* Кнопки управления */}
                    <div className="flex gap-3 mb-6">
                        <button
                            onClick={handleRefreshChats}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                        >
                            <MdRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'Перезагрузка...' : 'Перезагрузить чаты'}
                        </button>
                    </div>

                    {/* Список чатов */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                💬 Чаты ({chatsCount})
                            </h3>
                            
                            {chatsCount === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <MdInfo className="w-8 h-8 mx-auto mb-2" />
                                    <p>Нет доступных чатов</p>
                                    <p className="text-sm">Создайте чат для тестирования</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {chatsList.map(([phoneNumber, chat]) => (
                                        <div
                                            key={phoneNumber}
                                            className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                                                activeChat === phoneNumber 
                                                    ? 'bg-blue-50 border-blue-200' 
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex-1">
                                                <div className="font-medium">
                                                    {chat.name || phoneNumber.replace('@c.us', '')}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {phoneNumber}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Сообщений: {chat.messages?.length || 0} | 
                                                    Непрочитанных: {chat.unreadCount || 0}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteTest(
                                                    phoneNumber, 
                                                    chat.name || phoneNumber.replace('@c.us', '')
                                                )}
                                                className="ml-3 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Удалить чат"
                                            >
                                                <MdDelete className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Лог операций */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                📝 Лог операций
                            </h3>
                            
                            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                                {testLog.length === 0 ? (
                                    <div className="text-gray-500">Лог пуст. Попробуйте удалить чат.</div>
                                ) : (
                                    testLog.map((logEntry, index) => (
                                        <div key={index} className="mb-1">
                                            {logEntry}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Инструкции */}
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 mb-2">📋 Инструкции для тестирования:</h4>
                        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
                            <li>Убедитесь, что у вас есть несколько чатов</li>
                            <li>Нажмите кнопку 🗑️ рядом с любым чатом</li>
                            <li>Проверьте, что чат исчез, а остальные остались</li>
                            <li>Убедитесь, что не требуется обновление страницы</li>
                            <li>Смотрите лог операций для отладки</li>
                        </ol>
                    </div>

                    {/* Активный чат информация */}
                    {activeChat && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2">🎯 Активный чат:</h4>
                            <p className="text-blue-700">
                                {chats[activeChat]?.name || activeChat.replace('@c.us', '')} ({activeChat})
                            </p>
                            <p className="text-sm text-blue-600">
                                При удалении активного чата он должен автоматически деактивироваться
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatDeleteTest; 