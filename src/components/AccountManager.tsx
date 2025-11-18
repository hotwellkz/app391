import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    WhatsAppAccountInfo, 
    AccountStatusResponse, 
    ResetAccountResponse, 
    ChatsSummaryResponse,
    WhatsAppStatusResponse 
} from '../types/WhatsAppTypes';
import { MdAccountCircle, MdExitToApp, MdRefresh, MdWarning, MdInfo, MdDelete } from 'react-icons/md';
import WhatsAppAvatar from './WhatsAppAvatar';
import { API_CONFIG } from '../config/api';

const BACKEND_URL = API_CONFIG.BASE_URL;

interface AccountManagerProps {
    onAccountChange?: () => void;
    className?: string;
}

const AccountManager: React.FC<AccountManagerProps> = ({ onAccountChange, className = '' }) => {
    const [accountInfo, setAccountInfo] = useState<WhatsAppAccountInfo | null>(null);
    const [whatsappStatus, setWhatsappStatus] = useState<'ready' | 'qr_pending' | 'disconnected'>('disconnected');
    const [chatsSummary, setChatsSummary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Загрузка информации об аккаунте
    const loadAccountInfo = async () => {
        try {
            // Получаем статус WhatsApp
            const statusResponse = await axios.get<WhatsAppStatusResponse>(`${BACKEND_URL}/whatsapp/status`);
            
            // Приводим статус к нужному типу, если необходимо
            const status = statusResponse.data.status;
            if (status === 'ready' || status === 'qr_pending' || status === 'disconnected') {
                setWhatsappStatus(status);
            } else {
                setWhatsappStatus('disconnected'); // Значение по умолчанию
            }
            
            if (statusResponse.data.accountInfo) {
                setAccountInfo(statusResponse.data.accountInfo);
            }

            // Получаем сводку по чатам
            const summaryResponse = await axios.get<ChatsSummaryResponse>(`${BACKEND_URL}/whatsapp/chats-summary`);
            if (summaryResponse.data.success) {
                setChatsSummary(summaryResponse.data.summary);
            }

        } catch (error: any) {
            console.error('Error loading account info:', error);
            setError('Ошибка загрузки информации об аккаунте');
        }
    };

    // Мягкий выход (сохраняем данные)
    const handleSoftLogout = async () => {
        try {
            setIsLoading(true);
            setError('');

            const response = await axios.post<ResetAccountResponse>(`${BACKEND_URL}/whatsapp/soft-logout`);
            
            if (response.data.success) {
                setAccountInfo(null);
                setWhatsappStatus('disconnected');
                setShowLogoutConfirm(false);
                onAccountChange?.();
            } else {
                setError(response.data.error || 'Ошибка выхода из аккаунта');
            }
        } catch (error: any) {
            console.error('Error during soft logout:', error);
            setError('Ошибка выхода из аккаунта');
        } finally {
            setIsLoading(false);
        }
    };

    // Полный сброс (удаляем все данные)
    const handleFullReset = async () => {
        try {
            setIsLoading(true);
            setError('');

            const response = await axios.post<ResetAccountResponse>(`${BACKEND_URL}/whatsapp/reset`);
            
            if (response.data.success) {
                setAccountInfo(null);
                setWhatsappStatus('disconnected');
                setChatsSummary(null);
                setShowResetConfirm(false);
                onAccountChange?.();
            } else {
                setError(response.data.error || 'Ошибка сброса аккаунта');
            }
        } catch (error: any) {
            console.error('Error during reset:', error);
            setError('Ошибка сброса аккаунта');
        } finally {
            setIsLoading(false);
        }
    };

    // Форматирование номера телефона
    const formatPhoneNumber = (phoneNumber: string) => {
        return phoneNumber.replace('@c.us', '');
    };

    // Загружаем данные при монтировании компонента
    useEffect(() => {
        loadAccountInfo();
        
        // Обновляем каждые 30 секунд
        const interval = setInterval(loadAccountInfo, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = () => {
        switch (whatsappStatus) {
            case 'ready': return 'text-green-600';
            case 'qr_pending': return 'text-yellow-600';
            case 'disconnected': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusText = () => {
        switch (whatsappStatus) {
            case 'ready': return 'Подключен';
            case 'qr_pending': return 'Ожидание QR-кода';
            case 'disconnected': return 'Отключен';
            default: return 'Неизвестно';
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <MdAccountCircle className="mr-2" size={24} />
                    Управление аккаунтом
                </h3>
                <button
                    onClick={loadAccountInfo}
                    disabled={isLoading}
                    className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                    <MdRefresh className={isLoading ? 'animate-spin' : ''} size={20} />
                </button>
            </div>

            {/* Ошибка */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md flex items-center">
                    <MdWarning className="text-red-600 mr-2" size={20} />
                    <span className="text-red-800">{error}</span>
                    <button
                        onClick={() => setError('')}
                        className="ml-auto text-red-600 hover:text-red-800"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Статус подключения */}
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between">
                    <span className="text-gray-700">Статус:</span>
                    <span className={`font-medium ${getStatusColor()}`}>
                        {getStatusText()}
                    </span>
                </div>
            </div>

            {/* Информация об аккаунте */}
            {accountInfo && accountInfo.isReady ? (
                <div className="mb-4 p-3 border border-gray-200 rounded-md">
                    <div className="flex items-center mb-3">
                        <WhatsAppAvatar
                            src={accountInfo.profilePicUrl}
                            name={accountInfo.name || 'Пользователь'}
                            contactId={accountInfo.phoneNumber || ''}
                            size="medium"
                            className="mr-3"
                        />
                        <div className="flex-1">
                            <div className="font-medium text-gray-800">
                                {accountInfo.name || 'Пользователь'}
                            </div>
                            <div className="text-sm text-gray-600">
                                {accountInfo.phoneNumber ? formatPhoneNumber(accountInfo.phoneNumber) : 'Неизвестный номер'}
                            </div>
                        </div>
                    </div>
                    
                    {accountInfo.connectedAt && (
                        <div className="text-xs text-gray-500">
                            Подключен: {new Date(accountInfo.connectedAt).toLocaleString()}
                        </div>
                    )}
                </div>
            ) : (
                <div className="mb-4 p-3 border border-gray-200 rounded-md text-center text-gray-500">
                    Аккаунт не подключен
                </div>
            )}

            {/* Сводка по чатам */}
            {chatsSummary && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center mb-2">
                        <MdInfo className="text-blue-600 mr-2" size={16} />
                        <span className="text-sm font-medium text-blue-800">Статистика чатов</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <span className="text-gray-600">Всего чатов:</span>
                            <span className="ml-1 font-medium">{chatsSummary.totalChats}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Сообщений:</span>
                            <span className="ml-1 font-medium">{chatsSummary.totalMessages}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Непрочитанных:</span>
                            <span className="ml-1 font-medium">{chatsSummary.totalUnreadChats}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Статусов:</span>
                            <span className="ml-1 font-medium">{chatsSummary.readStatusEntries}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Действия */}
            <div className="space-y-2">
                {/* Выход из аккаунта */}
                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    disabled={!accountInfo?.isReady || isLoading}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <MdExitToApp className="mr-2" size={16} />
                    Выйти из аккаунта
                </button>

                {/* Полный сброс */}
                <button
                    onClick={() => setShowResetConfirm(true)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <MdDelete className="mr-2" size={16} />
                    Полный сброс
                </button>
            </div>

            {/* Модальное окно подтверждения выхода */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">Подтвердите выход</h3>
                        <p className="text-gray-600 mb-6">
                            Вы выйдете из текущего аккаунта WhatsApp. Все чаты и сообщения будут сохранены, 
                            но потребуется повторная аутентификация.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleSoftLogout}
                                disabled={isLoading}
                                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                            >
                                {isLoading ? 'Выходим...' : 'Выйти'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно подтверждения сброса */}
            {showResetConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ Полный сброс</h3>
                        <p className="text-gray-600 mb-6">
                            <strong>ВНИМАНИЕ!</strong> Это действие удалит:
                            <br />• Все сохраненные чаты и сообщения
                            <br />• Все статусы прочитанности
                            <br />• Данные аутентификации
                            <br />• Кэш аватарок
                            <br /><br />
                            Это необходимо для полного переключения на новый аккаунт.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowResetConfirm(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleFullReset}
                                disabled={isLoading}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                            >
                                {isLoading ? 'Сбрасываем...' : 'Сбросить все'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountManager; 