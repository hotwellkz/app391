import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Filter, Calendar, ChevronDown, ChevronUp, Construction, Wallet, Home, ListFilter } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { supabase, CLIENTS_BUCKET } from '../lib/supabase/config';
import { Client } from '../types/client';
import { format, isWithinInterval } from 'date-fns';
import { ClientSearchBar } from '../components/clients/ClientSearchBar';
import clsx from 'clsx';

// Ключи для localStorage
const CACHE_KEYS = {
  FILTERS: 'client_files_filters',
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

interface ClientFolder {
  id: string;
  name: string;
  filesCount: number;
  status: 'building' | 'deposit' | 'built';
  createdAt: Date;
}

export const AllClientFiles: React.FC = () => {
  const navigate = useNavigate();
  const cachedFilters = getFiltersFromCache();

  const [folders, setFolders] = useState<ClientFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Состояния фильтров
  const [status, setStatus] = useState<'building' | 'deposit' | 'built' | 'all'>(cachedFilters?.status ?? 'all');
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

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsSnapshot = await getDocs(collection(db, 'clients'));
        const clientFoldersPromises = clientsSnapshot.docs.map(async (doc) => {
          const clientData = doc.data() as Client;
          
          // Получаем список файлов для каждого клиента
          const { data: files, error } = await supabase.storage
            .from(CLIENTS_BUCKET)
            .list(`clients/${doc.id}`);

          if (error) {
            console.error('Ошибка при получении файлов:', error);
            return {
              id: doc.id,
              name: clientData.objectName || 'Без названия',
              filesCount: 0,
              status: clientData.status || 'building',
              createdAt: clientData.createdAt?.toDate() || new Date()
            };
          }

          return {
            id: doc.id,
            name: clientData.objectName || 'Без названия',
            filesCount: files?.length || 0,
            status: clientData.status || 'building',
            createdAt: clientData.createdAt?.toDate() || new Date()
          };
        });

        const clientFolders = await Promise.all(clientFoldersPromises);
        setFolders(clientFolders);
      } catch (error) {
        console.error('Ошибка при загрузке клиентов:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  // Функция для сброса всех фильтров
  const handleResetFilters = () => {
    setStatus('all');
    setStartDate('');
    setEndDate('');
    setShowAllFilters(false);
    setShowDateRangeFilter(false);
    clearFiltersCache();
  };

  // Фильтрация папок
  const filteredFolders = useMemo(() => {
    let filtered = folders;

    // Фильтр по поиску
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(folder =>
        folder.name.toLowerCase().includes(query)
      );
    }

    // Фильтр по статусу
    if (status !== 'all') {
      filtered = filtered.filter(folder => folder.status === status);
    }

    // Фильтр по диапазону дат
    if (startDate && endDate) {
      filtered = filtered.filter(folder => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return isWithinInterval(folder.createdAt, { start, end });
      });
    }

    return filtered;
  }, [folders, searchQuery, status, startDate, endDate]);

  const handleFolderClick = (folderId: string) => {
    navigate(`/clients/${folderId}/files`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1920px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 pl-8 sm:pl-0">Файлы клиентов</h1>
          
          {/* Кнопка фильтров */}
          <button
            onClick={() => setShowAllFilters(!showAllFilters)}
            className={clsx(
              'flex items-center px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
              showAllFilters
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50'
            )}
            title="Фильтры"
          >
            <Filter size={16} className="flex-shrink-0" />
            <span className="hidden sm:inline ml-2">Фильтры</span>
            {showAllFilters ? (
              <ChevronUp size={16} className="ml-2" />
            ) : (
              <ChevronDown size={16} className="ml-2" />
            )}
          </button>
        </div>
        
        {/* Поиск */}
        <div className="mb-4">
          <ClientSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Поиск по названию объекта..."
          />
        </div>

        {/* Фильтры */}
        {showAllFilters && (
          <div className="space-y-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Категории статуса */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatus('all')}
                className={clsx(
                  'px-3 sm:px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors duration-200',
                  status === 'all'
                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                )}
                title="Все"
              >
                <ListFilter size={16} className="flex-shrink-0" />
                <span className="hidden sm:inline ml-2">Все</span>
              </button>
              <button
                onClick={() => setStatus('building')}
                className={clsx(
                  'px-3 sm:px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors duration-200',
                  status === 'building'
                    ? 'bg-green-50 text-green-700 border-2 border-green-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                )}
                title="Строим"
              >
                <Construction size={16} className="flex-shrink-0" />
                <span className="hidden sm:inline ml-2">Строим</span>
              </button>
              <button
                onClick={() => setStatus('deposit')}
                className={clsx(
                  'px-3 sm:px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors duration-200',
                  status === 'deposit'
                    ? 'bg-yellow-50 text-yellow-700 border-2 border-yellow-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                )}
                title="Задаток"
              >
                <Wallet size={16} className="flex-shrink-0" />
                <span className="hidden sm:inline ml-2">Задаток</span>
              </button>
              <button
                onClick={() => setStatus('built')}
                className={clsx(
                  'px-3 sm:px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors duration-200',
                  status === 'built'
                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                )}
                title="Построено"
              >
                <Home size={16} className="flex-shrink-0" />
                <span className="hidden sm:inline ml-2">Построено</span>
              </button>
            </div>

            {/* Фильтр по дате */}
            <div className="border-t border-gray-100 pt-4">
              <button
                onClick={() => setShowDateRangeFilter(!showDateRangeFilter)}
                className={clsx(
                  'flex items-center text-sm font-medium transition-colors duration-200',
                  showDateRangeFilter ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Calendar size={16} className="mr-2" />
                Диапазон дат
                {showDateRangeFilter ? (
                  <ChevronUp size={16} className="ml-2" />
                ) : (
                  <ChevronDown size={16} className="ml-2" />
                )}
              </button>

              {showDateRangeFilter && (
                <div className="mt-3 flex flex-wrap gap-3">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Кнопка сброса фильтров */}
            <div className="border-t border-gray-100 pt-4">
              <button
                onClick={handleResetFilters}
                className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors duration-200"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Сетка папок */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFolders.map((folder) => (
          <div
            key={folder.id}
            onClick={() => handleFolderClick(folder.id)}
            className="group bg-white rounded-xl p-4 cursor-pointer border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-gray-300"
          >
            <div className="flex items-start space-x-3">
              <div className={clsx(
                'p-2 rounded-lg transition-colors duration-200 group-hover:bg-gray-50',
                folder.status === 'building' && 'text-green-500',
                folder.status === 'deposit' && 'text-yellow-500',
                folder.status === 'built' && 'text-blue-500'
              )}>
                <Folder size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{folder.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {folder.filesCount} файлов
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {format(folder.createdAt, 'dd.MM.yyyy')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFolders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Папки не найдены</p>
        </div>
      )}
    </div>
  );
};

export default AllClientFiles;
