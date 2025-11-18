import React from 'react';
import { useChat } from '../context/ChatContext';

const WhatsAppQRCode: React.FC = () => {
    const { qrCode } = useChat();

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <h2 className="text-xl font-bold mb-4">Подключение WhatsApp</h2>
            <div className="p-4 bg-white rounded-lg shadow-lg">
                {!qrCode ? (
                    <div className="text-gray-600">Ожидание QR-кода...</div>
                ) : (
                    <img 
                        src={`data:image/png;base64,${qrCode}`}
                        alt="WhatsApp QR Code"
                        className="w-64 h-64" // 256x256 pixels
                    />
                )}
            </div>
            {qrCode && (
                <p className="mt-4 text-gray-600">
                    Отсканируйте QR-код в приложении WhatsApp
                </p>
            )}
        </div>
    );
};

export default WhatsAppQRCode;
