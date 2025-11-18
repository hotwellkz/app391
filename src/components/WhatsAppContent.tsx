import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import WhatsAppConnect from './WhatsAppConnect';
import { MdArrowBack, MdQrCode2, MdLogout } from 'react-icons/md';
import toast from 'react-hot-toast';
import { API_CONFIG } from '../config/api';

const WhatsAppContent: React.FC = () => {
    const { qrCode, whatsappStatus, logoutWhatsApp, isAdmin } = useChat();
    const [showQR, setShowQR] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Определяем, является ли устройство мобильным
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    // Функция обработки отключения WhatsApp
    const handleLogout = async () => {
        if (!isAdmin) {
            toast.error('У вас нет прав для выполнения этого действия');
            return;
        }

        const confirmLogout = window.confirm(
            'Вы уверены, что хотите отключиться от WhatsApp? Потребуется повторное сканирование QR-кода.'
        );

        if (!confirmLogout) return;

        setIsLoggingOut(true);
        toast.loading('Отключение от WhatsApp...');

        try {
            const success = await logoutWhatsApp();
            if (success) {
                toast.dismiss();
                toast.success('WhatsApp отключен. Ожидаем сканирования нового QR-кода.');
            } else {
                toast.dismiss();
                toast.error('Ошибка при отключении от WhatsApp');
            }
        } catch (error) {
            console.error('Logout error:', error);
            toast.dismiss();
            toast.error('Произошла ошибка при отключении');
        } finally {
            setIsLoggingOut(false);
        }
    };

    // Функция получения текста статуса
    const getStatusText = () => {
        switch (whatsappStatus) {
            case 'ready':
                return 'WhatsApp подключен';
            case 'qr_pending':
                return 'Ожидается сканирование QR-кода';
            case 'restarting':
                return 'Перезапуск WhatsApp клиента...';
            case 'disconnected':
            default:
                return 'WhatsApp не подключен';
        }
    };

    // Функция получения цвета статуса
    const getStatusColor = () => {
        switch (whatsappStatus) {
            case 'ready':
                return 'bg-green-500';
            case 'qr_pending':
                return 'bg-yellow-500';
            case 'restarting':
                return 'bg-blue-500';
            case 'disconnected':
            default:
                return 'bg-red-500';
        }
    };

    return (
        <div className="flex flex-col h-full w-full">
            {/* Верхняя панель */}
            <div className={`${getStatusColor()} text-white px-4 py-2 flex items-center justify-between shadow-sm flex-shrink-0`}>
                {/* Левая часть */}
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        <span className="text-lg font-semibold">{getStatusText()}</span>
                    </div>
                </div>

                {/* Правая часть */}
                <div className="flex items-center space-x-2">
                    {(whatsappStatus === 'qr_pending' || qrCode) && (
                        <button
                            onClick={() => setShowQR(true)}
                            className="flex items-center space-x-2 hover:bg-black hover:bg-opacity-20 px-3 py-1 rounded transition-colors"
                        >
                            <MdQrCode2 className="w-5 h-5" />
                            <span className="text-sm hidden md:inline">Показать QR-код</span>
                        </button>
                    )}
                    
                    {/* Кнопка отключения (только для админов) */}
                    {isAdmin && whatsappStatus === 'ready' && (
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="flex items-center space-x-2 hover:bg-red-600 hover:bg-opacity-30 px-3 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Отключить WhatsApp"
                        >
                            <MdLogout className="w-5 h-5" />
                            <span className="text-sm hidden md:inline">
                                {isLoggingOut ? 'Отключение...' : 'Отключить'}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Модальное окно с QR-кодом */}
            {showQR && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Сканируйте QR-код</h2>
                            <button
                                onClick={() => setShowQR(false)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="flex justify-center">
                            {qrCode ? (
                                <img 
                                    src={qrCode}
                                    alt="WhatsApp QR Code"
                                    className="mx-auto"
                                    width={256}
                                    height={256}
                                />
                            ) : (
                                <div className="flex items-center justify-center w-64 h-64 bg-gray-100 rounded-lg">
                                    <span className="text-gray-500">QR-код загружается...</span>
                                </div>
                            )}
                        </div>
                        <p className="mt-4 text-center text-gray-600">
                            Откройте WhatsApp на вашем телефоне и отсканируйте QR-код
                        </p>
                        {whatsappStatus === 'restarting' && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-blue-800 text-sm text-center">
                                    ⏳ Ожидаем сканирования нового QR-кода после перезапуска
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Основной контент - займет всю оставшуюся высоту */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <WhatsAppConnect serverUrl={API_CONFIG.BASE_URL} isMobile={isMobile} />
            </div>
        </div>
    );
};

export default WhatsAppContent;
