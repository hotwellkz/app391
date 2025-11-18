import React from 'react';
import { useConnectionState } from '../utils/connectionStabilizer';
import { MdSignalWifi4Bar, MdSignalWifiOff, MdWarning, MdRefresh, MdPause } from 'react-icons/md';

interface ConnectionStatusIndicatorProps {
    className?: string;
    showDetails?: boolean;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({ 
    className = '', 
    showDetails = false 
}) => {
    const connectionState = useConnectionState();

    const getStatusInfo = () => {
        // Приоритет 1: 503 ошибка (сервер есть, но WhatsApp не готов)
        if (connectionState.is503ErrorActive) {
            return {
                status: 'service-unavailable',
                text: 'Сервис временно недоступен',
                icon: MdPause,
                color: 'text-orange-600',
                bgColor: 'bg-orange-100',
                borderColor: 'border-orange-200'
            };
        }
        
        // Приоритет 2: Подключено и готово к работе
        if (connectionState.isConnected && connectionState.isServerReady) {
            return {
                status: 'connected',
                text: 'Подключено',
                icon: MdSignalWifi4Bar,
                color: 'text-green-600',
                bgColor: 'bg-green-100',
                borderColor: 'border-green-200'
            };
        } 
        
        // Приоритет 3: Сервер подключен, но не готов (без 503)
        if (connectionState.isConnected && !connectionState.isServerReady) {
            return {
                status: 'degraded',
                text: 'Сервер не готов',
                icon: MdWarning,
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-100',
                borderColor: 'border-yellow-200'
            };
        } 
        
        // Приоритет 4: Активное переподключение
        if (connectionState.retryAttempts > 0) {
            return {
                status: 'reconnecting',
                text: 'Переподключение...',
                icon: MdRefresh,
                color: 'text-blue-600',
                bgColor: 'bg-blue-100',
                borderColor: 'border-blue-200'
            };
        } 
        
        // Приоритет 5: Полное отсутствие соединения
        return {
            status: 'disconnected',
            text: 'Нет соединения',
            icon: MdSignalWifiOff,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
            borderColor: 'border-red-200'
        };
    };

    const statusInfo = getStatusInfo();
    const IconComponent = statusInfo.icon;
    const isAnimated = statusInfo.status === 'reconnecting';

    const formatLastConnected = () => {
        if (!connectionState.lastConnectedAt) return 'Никогда';
        
        const now = new Date();
        const lastConnected = new Date(connectionState.lastConnectedAt);
        const diffMs = now.getTime() - lastConnected.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);

        if (diffSeconds < 60) {
            return 'Только что';
        } else if (diffMinutes < 60) {
            return `${diffMinutes} мин назад`;
        } else if (diffHours < 24) {
            return `${diffHours} ч назад`;
        } else {
            return lastConnected.toLocaleDateString();
        }
    };

    const getDetailedStatusText = () => {
        if (connectionState.is503ErrorActive) {
            return 'WhatsApp сервис временно недоступен. Ожидаем восстановления...';
        }
        
        switch (statusInfo.status) {
            case 'connected':
                return 'Все системы работают нормально';
            case 'degraded':
                return 'Сервер подключен, но WhatsApp клиент инициализируется';
            case 'reconnecting':
                return `Попытка переподключения (${connectionState.retryAttempts})`;
            case 'disconnected':
                return 'Отсутствует соединение с сервером';
            default:
                return statusInfo.text;
        }
    };

    if (!showDetails) {
        // Компактный режим - только иконка с цветом
        return (
            <div className={`inline-flex items-center ${className}`} title={statusInfo.text}>
                <IconComponent 
                    className={`w-4 h-4 ${statusInfo.color} ${isAnimated ? 'animate-spin' : ''}`} 
                />
            </div>
        );
    }

    // Подробный режим - с текстом и дополнительной информацией
    return (
        <div className={`${className}`}>
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                <IconComponent 
                    className={`w-4 h-4 ${statusInfo.color} ${isAnimated ? 'animate-spin' : ''}`} 
                />
                <span className={`text-sm font-medium ${statusInfo.color}`}>
                    {statusInfo.text}
                </span>
            </div>

            {/* Дополнительная информация */}
            <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div className="font-medium text-gray-600">
                    {getDetailedStatusText()}
                </div>
                
                {connectionState.failureCount > 0 && (
                    <div>Ошибок соединения: {connectionState.failureCount}</div>
                )}
                
                {connectionState.retryAttempts > 0 && (
                    <div>Попыток переподключения: {connectionState.retryAttempts}</div>
                )}
                
                {connectionState.is503ErrorActive && (
                    <div className="text-orange-600 font-medium">
                        ⏳ Ожидание готовности WhatsApp сервиса
                    </div>
                )}
                
                <div>Последнее соединение: {formatLastConnected()}</div>
                
                {/* Индикатор состояния компонентов */}
                <div className="pt-1 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-1 text-xs">
                        <span className={`${connectionState.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                            🌐 Сеть: {connectionState.isConnected ? 'OK' : 'Нет'}
                        </span>
                        <span className={`${connectionState.isServerReady ? 'text-green-600' : 'text-yellow-600'}`}>
                            📱 WhatsApp: {connectionState.isServerReady ? 'OK' : 'Не готов'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConnectionStatusIndicator; 