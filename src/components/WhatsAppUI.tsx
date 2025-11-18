import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import WhatsAppConnect from './WhatsAppConnect';
import WhatsAppQRCode from './WhatsAppQRCode';
import AccountManager from './AccountManager';

interface WhatsAppUIProps {
    serverUrl: string;
}

const WhatsAppUI: React.FC<WhatsAppUIProps> = ({ serverUrl }) => {
    const { qrCode, whatsappStatus } = useChat();
    const [isMobile, setIsMobile] = useState(false);
    const [showAccountManager, setShowAccountManager] = useState(false);

    // Обработка изменения размера экрана
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Обработчик изменения аккаунта
    const handleAccountChange = () => {
        // Обновляем интерфейс при смене аккаунта
        window.location.reload(); // Простое решение для полного обновления
    };

    return (
        <div className="h-screen bg-gray-100 flex flex-col">
            {/* Верхняя панель управления аккаунтом */}
            <div className="bg-white border-b border-gray-200 p-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <h1 className="text-xl font-semibold text-gray-800">WhatsApp Web</h1>
                        <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                            whatsappStatus === 'ready' ? 'bg-green-100 text-green-800' :
                            whatsappStatus === 'qr_pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                            {whatsappStatus === 'ready' ? 'Подключен' :
                             whatsappStatus === 'qr_pending' ? 'QR-код' : 'Отключен'}
                        </span>
                    </div>
                    
                    <button
                        onClick={() => setShowAccountManager(!showAccountManager)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        {showAccountManager ? 'Скрыть управление' : 'Управление аккаунтом'}
                    </button>
                </div>
            </div>

            {/* Панель управления аккаунтом (выдвижная) */}
            {showAccountManager && (
                <div className="border-b border-gray-200 p-4 bg-gray-50">
                    <AccountManager 
                        onAccountChange={handleAccountChange}
                        className="max-w-md mx-auto"
                    />
                </div>
            )}

            {/* Основной контент */}
            <div className="flex-1 min-h-0">
                {whatsappStatus === 'qr_pending' && qrCode ? (
                    <div className="h-full flex items-center justify-center">
                        <WhatsAppQRCode />
                    </div>
                ) : whatsappStatus === 'ready' ? (
                    <WhatsAppConnect serverUrl={serverUrl} isMobile={isMobile} />
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-gray-500 mb-4">
                                {whatsappStatus === 'disconnected' ? 'Подключение к WhatsApp...' : 'Инициализация...'}
                            </div>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsAppUI; 