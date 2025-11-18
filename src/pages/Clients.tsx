import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Filter, Calendar, ChevronDown, ChevronUp, Construction, Wallet, Home, ListFilter } from 'lucide-react';
import { doc, updateDoc, writeBatch, getDocs, query, where, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ClientContextMenu } from '../components/ClientContextMenu';
import { Client, NewClient, initialClientState } from '../types/client';
import { ClientList } from '../components/clients/ClientList';
import { ClientModal } from '../components/clients/ClientModal';
import { ClientPage } from './ClientPage';
import { DeleteClientModal } from '../components/modals/DeleteClientModal';
import { subscribeToClients } from '../services/clientService';
import { showErrorNotification } from '../utils/notifications';
import { PageContainer } from '../components/layout/PageContainer';
import { ClientSearchBar } from '../components/clients/ClientSearchBar';
import { CategoryCardType } from '../types';
import { deleteClientWithHistory, deleteClientIconOnly } from '../utils/clientDeletion';
import { format, isWithinInterval } from 'date-fns';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

// Ключи для localStorage
const CACHE_KEYS = {
  FILTERS: 'clients_filters',
} as const;

// Интерфейс для фильтров
interface CachedFilters {
  status: 'building' | 'deposit' | 'built' | 'all';
  startDate: string;
  endDate: string;
  showAllFilters: boolean;
  showDateRangeFilter: boolean;
}

// Функции для работы с кэшем
const saveFiltersToCache = (filters: CachedFilters) => {
  localStorage.setItem(CACHE_KEYS.FILTERS, JSON.stringify(filters));
};

const getFiltersFromCache = (): CachedFilters | null => {
  const cached = localStorage.getItem(CACHE_KEYS.FILTERS);
  if (!cached) return null;
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
};

const clearFiltersCache = () => {
  localStorage.removeItem(CACHE_KEYS.FILTERS);
};

export const Clients: React.FC = () => {
  const navigate = useNavigate();
  // Получаем сохраненные фильтры при инициализации
  const cachedFilters = getFiltersFromCache();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<NewClient>(initialClientState);
  const [showClientPage, setShowClientPage] = useState(false);
  const [status, setStatus] = useState<'building' | 'deposit' | 'built' | 'all'>(cachedFilters?.status ?? 'all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  // Состояния фильтров с начальными значениями из кэша
  const [showAllFilters, setShowAllFilters] = useState(cachedFilters?.showAllFilters ?? false);
  const [showDateRangeFilter, setShowDateRangeFilter] = useState(cachedFilters?.showDateRangeFilter ?? false);
  const [startDate, setStartDate] = useState<string>(cachedFilters?.startDate ?? '');
  const [endDate, setEndDate] = useState<string>(cachedFilters?.endDate ?? '');

  // Сохраняем фильтры при их изменении
  useEffect(() => {
    const filters: CachedFilters = {
      status,
      startDate,
      endDate,
      showAllFilters,
      showDateRangeFilter,
    };
    saveFiltersToCache(filters);
  }, [status, startDate, endDate, showAllFilters, showDateRangeFilter]);

  // Функция для сброса всех фильтров
  const handleResetFilters = () => {
    setStatus('all');
    setStartDate('');
    setEndDate('');
    setShowAllFilters(false);
    setShowDateRangeFilter(false);
    clearFiltersCache();
  };

  // Новые состояния для фильтров
  // Фильтрация клиентов
  const filteredClients = React.useMemo(() => {
    let filtered = clients;

    // Фильтр по поиску
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(client =>
        `${client.lastName} ${client.firstName}`.toLowerCase().includes(query) ||
        (client.phone && client.phone.includes(query)) ||
        (client.objectName && client.objectName.toLowerCase().includes(query))
      );
    }

    // Фильтр по статусу
    if (status !== 'all') {
      filtered = filtered.filter(client => client.status === status);
    }

    // Фильтр по диапазону дат
    if (startDate && endDate) {
      filtered = filtered.filter(client => {
        const clientDate = client.createdAt?.toDate();
        if (!clientDate) return false;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        return isWithinInterval(clientDate, { start, end });
      });
    }

    return filtered;
  }, [clients, searchQuery, status, startDate, endDate]);

  useEffect(() => {
    const unsubscribe = subscribeToClients(
      (allClients) => {
        setClients(allClients);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching clients:', error);
        setLoading(false);
      },
      {
        status: status === 'all' ? undefined : status
      }
    );

    return () => unsubscribe();
  }, [status]);

  const handleContextMenu = (e: React.MouseEvent, client: Client) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setSelectedClient(client);
    setShowContextMenu(true);
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setShowClientPage(true);
  };

  const handleEdit = () => {
    if (selectedClient) {
      setEditingClient({
        ...selectedClient
      });
      setShowEditModal(true);
      setShowContextMenu(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    setShowDeleteModal(true);
    setShowContextMenu(false);
  };

  const handleDeleteWithHistory = async () => {
    if (!selectedClient) return;
    
    try {
      await deleteClientWithHistory(selectedClient);
      setShowDeleteModal(false);
      setSelectedClient(null);
      showErrorNotification('Клиент успешно удален');
    } catch (error) {
      console.error('Error deleting client with history:', error);
      showErrorNotification('Ошибка при удалении клиента');
    }
  };

  const handleDeleteIconOnly = async () => {
    if (!selectedClient) return;
    
    try {
      await deleteClientIconOnly(selectedClient);
      setShowDeleteModal(false);
      setSelectedClient(null);
      showErrorNotification('Клиент успешно удален');
    } catch (error) {
      console.error('Error deleting client:', error);
      showErrorNotification('Ошибка при удалении клиента');
    }
  };

  const handleToggleVisibility = async (client: Client) => {
    try {
      if (!client.id) {
        showErrorNotification('ID клиента не найден');
        return;
      }

      // Сохраняем текущее значение видимости
      const newVisibility = !client.isIconsVisible;
      
      // Показываем уведомление о текущем состоянии
      showErrorNotification(
        newVisibility 
          ? 'Иконки клиента теперь видны'
          : 'Иконки клиента скрыты'
      );

      // Обновляем локальное состояние оптимистично
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === client.id ? { ...c, isIconsVisible: newVisibility } : c
        )
      );

      const clientRef = doc(db, 'clients', client.id);
      const batch = writeBatch(db);
      
      // Добавляем обновление клиента в batch
      batch.update(clientRef, {
        isIconsVisible: newVisibility,
        updatedAt: serverTimestamp()
      });

      // Формируем все возможные варианты названий для поиска
      const possibleTitles = [
        // Новый формат - название проекта
        client.objectName,
        // Старый формат - различные варианты имени
        `${client.lastName} ${client.firstName}`,
        `${client.lastName} ${client.firstName}`.trim(),
      ].filter(Boolean); // Удаляем пустые значения из массива

      // Создаем запросы для каждого возможного названия и row
      const queries = possibleTitles.flatMap(title => [
        query(
          collection(db, 'categories'),
          where('title', '==', title),
          where('row', '==', 1)
        ),
        query(
          collection(db, 'categories'),
          where('title', '==', title),
          where('row', '==', 3)
        )
      ]);
      
      // Выполняем все запросы параллельно
      const snapshots = await Promise.all(
        queries.map(q => getDocs(q))
      );

      // Объединяем все найденные документы
      const allDocs = snapshots.flatMap(snapshot => snapshot.docs);
      
      // Удаляем дубликаты по ID документа
      const uniqueDocs = Array.from(
        new Map(allDocs.map(doc => [doc.id, doc])).values()
      );
      
      if (uniqueDocs.length === 0) {
        console.warn('Категории не найдены для клиента:', client.lastName, client.firstName, client.objectName);
      } else {
        console.log(`Найдено ${uniqueDocs.length} категорий для клиента:`, client.lastName, client.firstName, client.objectName);
      }
      
      // Обновляем все найденные категории
      uniqueDocs.forEach(doc => {
        batch.update(doc.ref, { 
          isVisible: newVisibility,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();

    } catch (error) {
      console.error('Error toggling visibility:', error);
      showErrorNotification('Ошибка при изменении видимости иконок');
      
      // В случае ошибки откатываем состояние и показываем уведомление
      setClients(prevClients => {
        showErrorNotification('Не удалось изменить видимость иконок, состояние восстановлено');
        return prevClients.map(c => {
          if (c.id === client.id) {
            return { ...c, isIconsVisible: client.isIconsVisible };
          }
          return c;
        });
      });
    }
  };

  const handleClientSaved = () => {
    setShowAddModal(false);
    setShowEditModal(false);
  };

  // Функция для обновления порядка клиентов
  const handleReorderClients = async (updatedClients: Client[]) => {
    try {
      // Обновляем локальное состояние
      setClients(updatedClients);
      
      // Создаем batch для обновления в Firestore
      const batch = writeBatch(db);
      
      // Обновляем только клиентов с измененным порядком
      updatedClients.forEach(client => {
        if (client.id) {
          const clientRef = doc(db, 'clients', client.id);
          batch.update(clientRef, { 
            order: client.order,
            updatedAt: serverTimestamp()
          });
        }
      });
      
      // Выполняем batch
      await batch.commit();
    } catch (error) {
      console.error('Error updating client order:', error);
      showErrorNotification('Ошибка при обновлении порядка клиентов');
      
      // Загружаем клиентов заново в случае ошибки
      subscribeToClients((loadedClients) => {
        setClients(loadedClients);
        setLoading(false);
      }, (error) => {
        console.error('Error reloading clients:', error);
        setLoading(false);
      });
    }
  };

  // Если выбран клиент и нужно показать его страницу
  if (showClientPage && selectedClient) {
    return (
      <ClientPage
        client={selectedClient}
        onBack={() => setShowClientPage(false)}
        onSave={handleClientSaved}
      />
    );
  }

  return (
    <PageContainer>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Клиенты</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAllFilters(!showAllFilters)}
                className={clsx(
                  "p-2 rounded-full transition-colors",
                  showAllFilters 
                    ? "bg-emerald-100 text-emerald-600" 
                    : "text-gray-600 hover:bg-gray-100"
                )}
                title="Показать фильтры"
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="p-2 text-emerald-600 hover:text-emerald-700"
                title="Добавить клиента"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {/* Основные фильтры */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <ClientSearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                  />
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Сбросить фильтры
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatus('all')}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      status === 'all'
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    <span className="hidden sm:inline">Все</span>
                    <ListFilter className="w-5 h-5 sm:hidden" />
                  </button>
                  <button
                    onClick={() => setStatus('building')}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      status === 'building'
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                    title="Строится"
                  >
                    <span className="hidden sm:inline">Строится</span>
                    <Construction className="w-5 h-5 sm:hidden" />
                  </button>
                  <button
                    onClick={() => setStatus('deposit')}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      status === 'deposit'
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                    title="Задаток"
                  >
                    <span className="hidden sm:inline">Задаток</span>
                    <Wallet className="w-5 h-5 sm:hidden" />
                  </button>
                  <button
                    onClick={() => setStatus('built')}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      status === 'built'
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                    title="Построен"
                  >
                    <span className="hidden sm:inline">Построен</span>
                    <Home className="w-5 h-5 sm:hidden" />
                  </button>
                </div>
              </div>

              {/* Дополнительные фильтры */}
              {showAllFilters && (
                <div className="space-y-2">
                  {/* Фильтр по диапазону дат */}
                  <div className="bg-white rounded-lg shadow">
                    <button
                      onClick={() => setShowDateRangeFilter(!showDateRangeFilter)}
                      className="w-full px-4 py-2 flex items-center justify-between text-gray-700 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        <span>
                          {startDate && endDate 
                            ? `${format(new Date(startDate), 'dd.MM.yyyy')} - ${format(new Date(endDate), 'dd.MM.yyyy')}`
                            : 'Выберите период'
                          }
                        </span>
                      </div>
                      {showDateRangeFilter ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                    
                    {showDateRangeFilter && (
                      <div className="px-4 py-2 border-t space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">От</label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">До</label>
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Список клиентов */}
            <div className="mt-4">
              <ClientList
                clients={filteredClients}
                onClientClick={handleClientClick}
                onContextMenu={handleContextMenu}
                onToggleVisibility={handleToggleVisibility}
                status={status}
                loading={loading}
                onReorder={handleReorderClients}
              />
            </div>
          </>
        )}
      </div>

      {/* Модальные окна */}
      {showContextMenu && selectedClient && (
        <ClientContextMenu
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={(newStatus) => {
            if (selectedClient) {
              const clientRef = doc(db, 'clients', selectedClient.id);
              const updateData: any = {
                status: newStatus,
                updatedAt: serverTimestamp()
              };
              
              // Если переводим в "Строим" и startDate не установлена - устанавливаем текущую дату
              if (newStatus === 'building' && !selectedClient.startDate) {
                updateData.startDate = new Date().toISOString().split('T')[0]; // Формат YYYY-MM-DD
              }
              
              updateDoc(clientRef, updateData).then(() => {
                setShowContextMenu(false);
                showErrorNotification('Статус клиента обновлен');
              }).catch((error) => {
                console.error('Error updating client status:', error);
                showErrorNotification('Ошибка при обновлении статуса');
              });
            }
          }}
          clientName={`${selectedClient.lastName} ${selectedClient.firstName}`}
          currentStatus={selectedClient.status}
        />
      )}

      {showAddModal && (
        <ClientModal
          isOpen={showAddModal}
          client={initialClientState}
          onClose={() => setShowAddModal(false)}
          onSave={handleClientSaved}
        />
      )}

      {showEditModal && (
        <ClientModal
          isOpen={showEditModal}
          client={editingClient}
          onClose={() => setShowEditModal(false)}
          onSave={handleClientSaved}
          isEditMode
        />
      )}

      {showDeleteModal && selectedClient && (
        <DeleteClientModal
          isOpen={showDeleteModal}
          clientName={`${selectedClient.lastName} ${selectedClient.firstName}`}
          onClose={() => setShowDeleteModal(false)}
          onDeleteWithHistory={handleDeleteWithHistory}
          onDeleteIconOnly={handleDeleteIconOnly}
        />
      )}
    </PageContainer>
  );
};
