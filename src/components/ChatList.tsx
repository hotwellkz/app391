import React, { useState, useRef, useEffect } from 'react';
import { MdSearch, MdArrowBack, MdDelete, MdEdit } from 'react-icons/md';
import { Chat, WhatsAppMessage } from '../types/WhatsAppTypes';
import { useChat } from '../context/ChatContext';
import WhatsAppAvatar from './WhatsAppAvatar';
import toast from 'react-hot-toast';

interface ChatListProps {
    chats: { [key: string]: Chat };
    activeChat: string | null;
    setActiveChat: (chatId: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onNewChat: () => void;
    isMobile: boolean;
}

interface ContextMenuState {
    isOpen: boolean;
    phoneNumber: string;
    x: number;
    y: number;
}

interface RenameModalState {
    isOpen: boolean;
    phoneNumber: string;
    currentName: string;
    newName: string;
}

const ChatList: React.FC<ChatListProps> = ({
    chats,
    activeChat,
    setActiveChat,
    searchQuery,
    setSearchQuery,
    onNewChat,
    isMobile
}) => {
    const { 
        deleteChat: deleteChatFromContext, 
        getContactName, 
        createContact, 
        updateContact,
        contacts
    } = useChat();
    
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        isOpen: false,
        phoneNumber: '',
        x: 0,
        y: 0
    });
    
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<{ phoneNumber: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Состояние для модального окна переименования
    const [renameModal, setRenameModal] = useState<RenameModalState>({
        isOpen: false,
        phoneNumber: '',
        currentName: '',
        newName: ''
    });
    const [isRenaming, setIsRenaming] = useState(false);
    
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const longPressTimeoutRef = useRef<number | null>(null);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatLastMessage = (message: WhatsAppMessage) => {
        let messageText = '';

        if (message.isVoiceMessage) {
            messageText = '🎤 Голосовое сообщение';
        } else if (message.hasMedia) {
            if (message.mediaType?.startsWith('image/') || message.mediaType === 'image') {
                messageText = '📷 Фото';
            } else if (message.mediaType?.startsWith('video/') || message.mediaType === 'video') {
                messageText = '🎥 Видео';
            } else if (message.mediaType?.startsWith('audio/')) {
                messageText = '🎵 Аудио';
            } else {
                messageText = '📎 Файл';
            }
        } else {
            messageText = message.body;
        }

        return message.fromMe ? `Вы: ${messageText}` : messageText;
    };

    // Обновленная функция форматирования имени контакта с использованием кастомных имен
    const formatContactName = (chat: Chat) => {
        // Используем функцию из контекста для получения кастомного имени
        const customName = getContactName(chat.phoneNumber);
        
        // Если есть кастомное имя, используем его
        if (customName !== "Контакт") {
            return customName;
        }
        
        // Иначе используем имя из чата или "Контакт"
        return chat.name && chat.name !== chat.phoneNumber.replace('@c.us', '') 
            ? chat.name 
            : "Контакт";
    };

    // Обработчик правого клика для контекстного меню
    const handleContextMenu = (e: React.MouseEvent, phoneNumber: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.min(e.pageX, window.innerWidth - 200); // Предотвращаем выход за границы
        const y = Math.min(e.pageY, window.innerHeight - 100);
        
        setContextMenu({
            isOpen: true,
            phoneNumber,
            x,
            y
        });
    };

    // Обработчик long press для мобильных устройств
    const handleLongPressStart = (phoneNumber: string) => {
        if (isMobile) {
            longPressTimeoutRef.current = window.setTimeout(() => {
                // Эмулируем контекстное меню в центре экрана для мобильных
                setContextMenu({
                    isOpen: true,
                    phoneNumber,
                    x: window.innerWidth / 2 - 100,
                    y: window.innerHeight / 2 - 50
                });
            }, 500); // 500ms для long press
        }
    };

    const handleLongPressEnd = () => {
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
        }
    };

    // Закрытие контекстного меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                setContextMenu(prev => ({ ...prev, isOpen: false }));
            }
        };

        if (contextMenu.isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('scroll', () => setContextMenu(prev => ({ ...prev, isOpen: false })));
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', () => setContextMenu(prev => ({ ...prev, isOpen: false })));
        };
    }, [contextMenu.isOpen]);

    // Обработчик выбора "Переименовать контакт"
    const handleRenameClick = (phoneNumber: string) => {
        const chat = chats[phoneNumber];
        const currentCustomName = getContactName(phoneNumber);
        
        setRenameModal({
            isOpen: true,
            phoneNumber,
            currentName: currentCustomName,
            newName: currentCustomName !== "Контакт" ? currentCustomName : ''
        });
        
        setContextMenu(prev => ({ ...prev, isOpen: false }));
    };

    // Обработчик сохранения нового имени
    const handleSaveRename = async () => {
        if (!renameModal.newName.trim()) {
            toast.error('Введите имя контакта');
            return;
        }

        setIsRenaming(true);
        const loadingToastId = toast.loading('Сохранение имени контакта...');

        try {
            const contactId = renameModal.phoneNumber.replace('@c.us', '');
            
            // Проверяем, существует ли уже контакт
            const existingContact = contacts[contactId];
            let success = false;
            
            if (existingContact) {
                // Обновляем существующий контакт
                success = await updateContact(contactId, renameModal.newName.trim());
            } else {
                // Создаем новый контакт
                success = await createContact(contactId, renameModal.newName.trim());
            }
            
            toast.dismiss(loadingToastId);
            
            if (success) {
                toast.success(`Контакт переименован в "${renameModal.newName.trim()}"`);
                setRenameModal({
                    isOpen: false,
                    phoneNumber: '',
                    currentName: '',
                    newName: ''
                });
            } else {
                toast.error('Не удалось сохранить имя контакта');
            }
        } catch (error: any) {
            console.error('Error renaming contact:', error);
            toast.dismiss(loadingToastId);
            toast.error('Произошла ошибка при сохранении имени');
        } finally {
            setIsRenaming(false);
        }
    };

    // Обработчик отмены переименования
    const handleCancelRename = () => {
        setRenameModal({
            isOpen: false,
            phoneNumber: '',
            currentName: '',
            newName: ''
        });
    };

    // Обработчик выбора "Удалить чат"
    const handleDeleteClick = (phoneNumber: string) => {
        const chat = chats[phoneNumber];
        if (chat) {
            setChatToDelete({
                phoneNumber,
                name: formatContactName(chat)
            });
            setShowDeleteModal(true);
        }
        setContextMenu(prev => ({ ...prev, isOpen: false }));
    };

    // Подтверждение удаления чата
    const handleConfirmDelete = async () => {
        if (!chatToDelete) return;

        setIsDeleting(true);
        const loadingToastId = toast.loading('Удаление чата...');

        try {
            console.log('Starting chat deletion process for:', chatToDelete.phoneNumber);
            const success = await deleteChatFromContext(chatToDelete.phoneNumber);
            
            toast.dismiss(loadingToastId);
            
            if (success) {
                toast.success(`Чат с ${chatToDelete.name} удален`);
                setShowDeleteModal(false);
                setChatToDelete(null);
                console.log('Chat deletion completed successfully');
            } else {
                console.error('Chat deletion failed - success was false');
                toast.error('Не удалось удалить чат. Попробуйте еще раз.');
            }
        } catch (error: any) {
            console.error('Chat deletion error:', error);
            toast.dismiss(loadingToastId);
            
            // Показываем детальную ошибку пользователю
            const errorMessage = error.message || 'Произошла неизвестная ошибка при удалении';
            toast.error(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    // Отмена удаления
    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setChatToDelete(null);
    };

    const filteredChats = Object.entries(chats)
        .filter(([_, chat]) => {
            const query = searchQuery || '';
            const name = chat.name || '';
            return name.toLowerCase().includes(query.toLowerCase()) ||
                chat.phoneNumber.includes(query);
        })
        .map(([id, chat]) => ({
            id,
            ...chat
        }));

    return (
        <div className={`flex flex-col h-full ${isMobile && activeChat ? 'hidden' : 'flex'} bg-white md:w-[400px] w-full`}>
            {/* Верхняя панель */}
            <div className="bg-[#f0f2f5] p-2 flex items-center gap-2 flex-shrink-0">
                <div className="flex-1">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Поиск или новый чат"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-2 px-4 pl-10 rounded-lg bg-white"
                        />
                        <MdSearch className="absolute left-3 top-3 text-gray-500" />
                    </div>
                </div>
                <button
                    onClick={onNewChat}
                    className="p-2 hover:bg-gray-200 rounded-full"
                >
                    +
                </button>
            </div>

            {/* Список чатов - займет всю оставшуюся высоту */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {filteredChats.map((chat) => (
                    <div
                        key={`${chat.id}-${chat.phoneNumber}`}
                        onClick={() => setActiveChat(chat.phoneNumber)}
                        onContextMenu={(e) => handleContextMenu(e, chat.phoneNumber)}
                        onTouchStart={() => handleLongPressStart(chat.phoneNumber)}
                        onTouchEnd={handleLongPressEnd}
                        onTouchCancel={handleLongPressEnd}
                        className={`flex items-center p-3 cursor-pointer hover:bg-[#f0f2f5] border-b select-none ${
                            activeChat === chat.phoneNumber ? 'bg-[#f0f2f5]' : ''
                        }`}
                    >
                        {/* Аватар с индикатором непрочитанных сообщений */}
                        <div className="relative chat-list-avatar">
                            <WhatsAppAvatar
                                src={chat.avatarUrl}
                                name={formatContactName(chat)}
                                contactId={chat.phoneNumber}
                                size="medium"
                                className="transition-all duration-200"
                            />
                            {chat.unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 bg-[#25D366] text-white rounded-full min-w-[20px] h-[20px] flex items-center justify-center text-xs font-medium px-1">
                                    {chat.unreadCount}
                                </div>
                            )}
                        </div>
                        
                        {/* Информация о чате */}
                        <div className="ml-3 flex-1">
                            <div className="flex justify-between items-center">
                                <div className="font-medium">
                                    {formatContactName(chat)}
                                </div>
                                {chat.lastMessage && (
                                    <span className="text-xs text-gray-500">
                                        {formatTime(chat.lastMessage.timestamp)}
                                    </span>
                                )}
                            </div>
                            {chat.lastMessage && (
                                <p className="text-sm text-gray-500 truncate">
                                    {formatLastMessage(chat.lastMessage)}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Контекстное меню */}
            {contextMenu.isOpen && (
                <div
                    ref={contextMenuRef}
                    className="fixed bg-white shadow-lg rounded-lg border z-50 py-2 min-w-[150px]"
                    style={{ 
                        top: contextMenu.y, 
                        left: contextMenu.x,
                        transform: isMobile ? 'translate(-50%, -50%)' : 'none'
                    }}
                >
                    <button
                        onClick={() => handleRenameClick(contextMenu.phoneNumber)}
                        className="w-full px-4 py-2 text-left text-gray-600 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                    >
                        <MdEdit className="w-4 h-4" />
                        Переименовать контакт
                    </button>
                    <button
                        onClick={() => handleDeleteClick(contextMenu.phoneNumber)}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                        <MdDelete className="w-4 h-4" />
                        Удалить чат
                    </button>
                </div>
            )}

            {/* Модальное окно подтверждения удаления */}
            {showDeleteModal && chatToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Удалить чат</h3>
                        <p className="text-gray-600 mb-6">
                            Вы уверены, что хотите удалить переписку с <strong>{chatToDelete.name}</strong>? 
                            Это действие необратимо и все сообщения будут потеряны.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCancelDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Удаление...
                                    </>
                                ) : (
                                    'Удалить'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно переименования */}
            {renameModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Переименовать контакт</h3>
                        <input
                            type="text"
                            placeholder="Новое имя контакта"
                            value={renameModal.newName}
                            onChange={(e) => setRenameModal(prev => ({ ...prev, newName: e.target.value }))}
                            className="w-full py-2 px-4 rounded-lg bg-gray-100"
                        />
                        <div className="flex gap-3 justify-end mt-4">
                            <button
                                onClick={handleCancelRename}
                                disabled={isRenaming}
                                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleSaveRename}
                                disabled={isRenaming}
                                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRenaming ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Сохранение...
                                    </>
                                ) : (
                                    'Сохранить'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatList;
