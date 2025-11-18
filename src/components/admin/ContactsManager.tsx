import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, User, Phone } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Contact } from '../../types/WhatsAppTypes';
import toast from 'react-hot-toast';

interface ContactsManagerProps {
    className?: string;
}

interface EditContactModal {
    isOpen: boolean;
    contact: Contact | null;
    isNew: boolean;
}

export const ContactsManager: React.FC<ContactsManagerProps> = ({ className = '' }) => {
    const { 
        contacts, 
        loadContacts, 
        createContact, 
        updateContact, 
        deleteContact 
    } = useChat();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [editModal, setEditModal] = useState<EditContactModal>({
        isOpen: false,
        contact: null,
        isNew: false
    });
    const [formData, setFormData] = useState({
        contactId: '',
        customName: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    // Загрузка контактов при монтировании
    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    // Фильтрация контактов по поисковому запросу
    const filteredContacts = Object.values(contacts).filter(contact =>
        contact.customName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.contactId.includes(searchQuery)
    );

    // Обработчик открытия модального окна для создания
    const handleCreate = () => {
        setFormData({ contactId: '', customName: '' });
        setEditModal({
            isOpen: true,
            contact: null,
            isNew: true
        });
    };

    // Обработчик открытия модального окна для редактирования
    const handleEdit = (contact: Contact) => {
        setFormData({
            contactId: contact.contactId,
            customName: contact.customName
        });
        setEditModal({
            isOpen: true,
            contact,
            isNew: false
        });
    };

    // Обработчик сохранения контакта
    const handleSave = async () => {
        if (!formData.contactId.trim() || !formData.customName.trim()) {
            toast.error('Заполните все поля');
            return;
        }

        setIsLoading(true);
        const loadingToastId = toast.loading(editModal.isNew ? 'Создание контакта...' : 'Обновление контакта...');

        try {
            let success = false;
            
            if (editModal.isNew) {
                success = await createContact(formData.contactId, formData.customName);
            } else {
                success = await updateContact(formData.contactId, formData.customName);
            }

            toast.dismiss(loadingToastId);

            if (success) {
                toast.success(editModal.isNew ? 'Контакт создан' : 'Контакт обновлен');
                setEditModal({ isOpen: false, contact: null, isNew: false });
                setFormData({ contactId: '', customName: '' });
                await loadContacts(); // Перезагружаем контакты
            } else {
                toast.error('Не удалось сохранить контакт');
            }
        } catch (error) {
            console.error('Error saving contact:', error);
            toast.dismiss(loadingToastId);
            toast.error('Произошла ошибка при сохранении');
        } finally {
            setIsLoading(false);
        }
    };

    // Обработчик удаления контакта
    const handleDelete = async (contact: Contact) => {
        if (!window.confirm(`Удалить контакт "${contact.customName}"?`)) {
            return;
        }

        const loadingToastId = toast.loading('Удаление контакта...');

        try {
            const success = await deleteContact(contact.contactId);
            toast.dismiss(loadingToastId);

            if (success) {
                toast.success('Контакт удален');
                await loadContacts(); // Перезагружаем контакты
            } else {
                toast.error('Не удалось удалить контакт');
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            toast.dismiss(loadingToastId);
            toast.error('Произошла ошибка при удалении');
        }
    };

    // Обработчик закрытия модального окна
    const handleCloseModal = () => {
        setEditModal({ isOpen: false, contact: null, isNew: false });
        setFormData({ contactId: '', customName: '' });
    };

    const formatPhoneNumber = (contactId: string) => {
        // Форматируем номер телефона для отображения
        return contactId.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1 ($2) $3-$4-$5');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ru-RU');
    };

    return (
        <div className={`bg-white rounded-lg shadow ${className}`}>
            {/* Заголовок и поиск */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Управление контактами WhatsApp
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Всего контактов: {Object.keys(contacts).length}
                        </p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Добавить контакт
                    </button>
                </div>

                {/* Поиск */}
                <div className="mt-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Поиск по имени или номеру телефона..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
            </div>

            {/* Список контактов */}
            <div className="p-6">
                {filteredContacts.length === 0 ? (
                    <div className="text-center py-8">
                        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchQuery ? 'Контакты не найдены' : 'Нет контактов'}
                        </h3>
                        <p className="text-gray-500">
                            {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Добавьте первый контакт'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredContacts.map((contact) => (
                            <div
                                key={contact.contactId}
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                {contact.customName}
                                            </h3>
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <Phone className="w-3 h-3" />
                                                {formatPhoneNumber(contact.contactId)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 ml-13">
                                        Создан: {formatDate(contact.createdAt)} • 
                                        Обновлен: {formatDate(contact.updatedAt)}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(contact)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Редактировать"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(contact)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Удалить"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Модальное окно редактирования/создания */}
            {editModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold">
                                {editModal.isNew ? 'Добавить контакт' : 'Редактировать контакт'}
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Номер телефона (без @c.us)
                                </label>
                                <input
                                    type="text"
                                    placeholder="79001234567"
                                    value={formData.contactId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, contactId: e.target.value }))}
                                    disabled={!editModal.isNew}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Имя контакта
                                </label>
                                <input
                                    type="text"
                                    placeholder="Введите имя контакта"
                                    value={formData.customName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customName: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                            <button
                                onClick={handleCloseModal}
                                disabled={isLoading}
                                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                {editModal.isNew ? 'Создать' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 