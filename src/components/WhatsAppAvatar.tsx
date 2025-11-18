import React, { useState } from 'react';

interface WhatsAppAvatarProps {
    src?: string | null;
    alt?: string;
    name?: string;
    size?: 'small' | 'medium' | 'large';
    showStatus?: boolean;
    isOnline?: boolean;
    className?: string;
    contactId?: string;
}

const WhatsAppAvatar: React.FC<WhatsAppAvatarProps> = ({
    src,
    alt,
    name = '',
    size = 'medium',
    showStatus = false,
    isOnline = false,
    className = '',
    contactId = ''
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Получаем первую букву имени для заглушки
    const getInitial = () => {
        if (name && name.trim()) {
            return name.trim()[0].toUpperCase();
        }
        return '?';
    };

    // Получаем цвет заглушки на основе contactId или имени
    const getPlaceholderColor = () => {
        const str = contactId || name || '';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIndex = Math.abs(hash) % 6;
        return colorIndex === 0 ? '' : `color-${colorIndex}`;
    };

    // Определяем размеры
    const sizeClasses = {
        small: 'whatsapp-avatar-small',
        medium: '',
        large: 'whatsapp-avatar-large'
    };

    const containerClasses = [
        'whatsapp-avatar-container',
        className
    ].filter(Boolean).join(' ');

    const avatarClasses = [
        'whatsapp-avatar',
        sizeClasses[size],
        (!src || imageError) && !imageLoaded ? 'whatsapp-avatar-placeholder' : '',
        (!src || imageError) && !imageLoaded ? getPlaceholderColor() : '',
        !imageLoaded && src && !imageError ? 'whatsapp-avatar-loading' : ''
    ].filter(Boolean).join(' ');

    const handleImageLoad = () => {
        setImageLoaded(true);
        setImageError(false);
    };

    const handleImageError = () => {
        setImageLoaded(false);
        setImageError(true);
    };

    return (
        <div className={containerClasses}>
            <div className={avatarClasses}>
                {src && !imageError ? (
                    <img
                        src={src}
                        alt={alt || name || 'Аватар контакта'}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        style={{ display: imageLoaded ? 'block' : 'none' }}
                    />
                ) : null}
                
                {/* Показываем заглушку если нет изображения или оно не загрузилось */}
                {(!src || imageError || !imageLoaded) && (
                    <span className="avatar-initial">
                        {getInitial()}
                    </span>
                )}
            </div>
            
            {/* Индикатор статуса */}
            {showStatus && (
                <div className={`whatsapp-avatar-status ${isOnline ? 'online' : 'offline'}`} />
            )}
        </div>
    );
};

export default WhatsAppAvatar; 