import React, { useState, useEffect } from 'react';
import { getSettingsFromCache, saveSettingsToCache } from '../lib/cache';
import { deleteCategory } from '../lib/firebase/categories';

// Ключ для кэша транзакций
const TRANSACTIONS_CACHE_KEY = 'transactions_page_cache';

import { Helmet } from 'react-helmet-async';
import { 
  DndContext, 
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { CategoryRow } from '../components/transactions/CategoryRow';
import { useCategories } from '../hooks/useCategories';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CategoryCardType } from '../types';
import { TransactionHistory } from '../components/transactions/history/TransactionHistory';
import { TransferModal } from '../components/transactions/transfer/TransferModal';
import { AddWarehouseItemModal } from '../components/transactions/AddWarehouseItemModal';
import { useNavigate } from 'react-router-dom';
import { RayBackground } from '../components/RayBackground';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { PageMetadata } from '../components/PageMetadata';

export const Transactions: React.FC = () => {
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const { categories: loadedCategories, loading, error } = useCategories();
  const [categories, setCategories] = useState<CategoryCardType[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  // При монтировании: сначала пробуем взять из кэша
  useEffect(() => {
    let mounted = true;
    (async () => {
      const cached = await getSettingsFromCache(TRANSACTIONS_CACHE_KEY, null);
      if (cached && mounted) {
        setCategories(cached);
        setFromCache(true);
        setLocalLoading(false);
      } else {
        setLocalLoading(true); // Только если кэша нет, показываем лоадер
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Когда пришли новые данные с сервера — обновляем кэш
  useEffect(() => {
    if (loadedCategories && loadedCategories.length > 0) {
      setCategories(loadedCategories);
      setFromCache(false);
      // Оставляем только сериализуемые поля
      const serializable = loadedCategories.map(({id, title, amount, color, row, isVisible}) => ({id, title, amount, color, row, isVisible}));
      saveSettingsToCache(TRANSACTIONS_CACHE_KEY, serializable);
    }
  }, [loadedCategories]);

  // Экспортируем функцию обновления глобально для StickyNavigation
  useEffect(() => {
    (window as any).refreshTransactionsPage = () => {
      // Сброс кэша и форс-загрузка
      localStorage.removeItem(TRANSACTIONS_CACHE_KEY);
      caches.open('hotwell-settings-v1').then(cache => cache.delete(`/settings/${TRANSACTIONS_CACHE_KEY}`));
      window.location.reload(); // Самый надёжный способ форс-обновления данных useCategories
    };
    return () => { delete (window as any).refreshTransactionsPage; };
  }, []);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryCardType | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [transferData, setTransferData] = useState<{
    sourceCategory: CategoryCardType;
    targetCategory: CategoryCardType;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  const navigate = useNavigate();

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      const sourceCategory = active.data.current as CategoryCardType;
      const targetCategory = categories.find(c => c.id === over.id);
      
      if (targetCategory) {
        // Проверяем, является ли цель складом или "Общ Расх"
        if (targetCategory.row === 4) {
          // Если цель - категория "Склад"
          if (targetCategory.title === 'Склад') {
            if (targetCategory.title === 'Склад') {
              // Перенаправляем на страницу нового прихода
              navigate('/warehouse/income/new', { 
                state: { 
                  selectedEmployee: sourceCategory.title
                }
              });
            }
            return;
          }
          
          // Если цель - "Общ Расх"
          if (targetCategory.title === 'Общ Расх') {
            // Проверяем источник
            if (sourceCategory.row === 2) {
              // Если источник - сотрудник, открываем модальное окно перевода
              setTransferData({
                sourceCategory,
                targetCategory
              });
              setShowTransferModal(true);
            } else if (sourceCategory.row === 4) {
              // Перенаправляем на страницу нового расхода
              navigate('/warehouse/expense/new', {
                state: {
                  selectedProject: targetCategory.id,
                  projectTitle: targetCategory.title
                }
              });
            }
            return;
          } else {
            // Для остальных категорий склада открываем модальное окно перевода
            setTransferData({
              sourceCategory,
              targetCategory
            });
            setShowTransferModal(true);
            return;
          }
        }

        // Проверяем, является ли источник складом, а цель - проектом
        if (sourceCategory.row === 4 && targetCategory.row === 3) {
          // Перенаправляем на страницу нового расхода с предварительно выбранным проектом
          navigate('/warehouse/expense/new', { 
            state: { 
              selectedProject: targetCategory.id,
              projectTitle: targetCategory.title
            }
          });
          return;
        }

        setTransferData({
          sourceCategory,
          targetCategory
        });
        setShowTransferModal(true);
      }
    }
  };

  const handleHistoryClick = (category: CategoryCardType) => {
    setSelectedCategory(category);
    setShowHistory(true);
  };

  const handleDeleteCategory = async (category: CategoryCardType) => {
    console.log('handleDeleteCategory вызван в Transactions с категорией:', category);
    if (deleteInProgress) return;
    
    try {
      setDeleteInProgress(true);
      await deleteCategory(category.id, category.title, false);
      console.log('Категория удалена успешно:', category.id);
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setDeleteInProgress(false);
    }
  };

  const handleEditCategory = (category: CategoryCardType) => {
    // Функция вызывается после успешного редактирования категории
    // Обновляем список категорий, чтобы отобразить изменения
    // Данные уже обновлены в EditCategoryModal, просто обновляем кэш
    if (window.refreshTransactionsPage) {
      // Используем существующую функцию обновления
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  // SEO-оптимизация
  const seoData = {
    title: 'CRM система для строительных компаний | Управление финансами и транзакциями',
    description: 'Эффективное управление финансами в строительном бизнесе. CRM система для строительных компаний с функциями учета транзакций, управления складом и контроля движения средств.',
    keywords: 'CRM система для строительных компаний, управление строительством, учет транзакций, строительный бизнес, управление финансами строительной компании, складской учет строительство',
    focusKeyword: 'CRM система для строительных компаний'
  };

  if (!fromCache && (localLoading || loading)) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-xl text-red-500 p-4 bg-white rounded-lg shadow">
          {error}
        </div>
      </div>
    );
  }

  // Показываем, что данные из кэша (опционально)
  // Можно добавить индикатор: {fromCache && <span>Данные из кэша</span>}


  // Фильтруем категории по видимости
  const visibleCategories = categories.filter(c => c.isVisible !== false);

  const clientCategories = visibleCategories.filter(c => c.row === 1);
  const employeeCategories = visibleCategories.filter(c => c.row === 2);
  const projectCategories = visibleCategories.filter(c => c.row === 3);
  const warehouseCategories = visibleCategories.filter(c => c.row === 4);

  return (
    <div className="container mx-auto px-4 py-8">
      <PageMetadata 
        title="Транзакции | HotWell.KZ"
        description="Управление транзакциями и финансами"
      />
      <Helmet>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <meta name="keywords" content={seoData.keywords} />
        {/* Open Graph теги для социальных сетей */}
        <meta property="og:title" content={seoData.title} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:type" content="website" />
        {/* Дополнительные мета-теги */}
        <link rel="canonical" href="https://yourdomain.com/transactions" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <Scrollbars
        style={{ width: '100%', height: '100vh' }}
        universal={true}
        renderThumbVertical={props => <div {...props} className="thumb-vertical" />}
        autoHide
        autoHideTimeout={1000}
        autoHideDuration={200}
      >
        <DndContext 
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="relative min-h-screen">
            <RayBackground theme="light" />
            <div className="relative z-10 p-2 sm:p-3 space-y-2">
              <CategoryRow
                title="Клиенты"
                categories={clientCategories}
                onHistoryClick={handleHistoryClick}
                onDeleteCategory={handleDeleteCategory}
                onEditCategory={handleEditCategory}
                rowNumber={1}
              />
              
              <CategoryRow
                title="Сотрудники"
                categories={employeeCategories}
                onHistoryClick={handleHistoryClick}
                onDeleteCategory={handleDeleteCategory}
                onEditCategory={handleEditCategory}
                rowNumber={2}
              />
              
              <CategoryRow
                title="Проекты"
                categories={projectCategories}
                onHistoryClick={handleHistoryClick}
                onDeleteCategory={handleDeleteCategory}
                rowNumber={3}
              />
              
              <CategoryRow
                title="Склад"
                categories={warehouseCategories}
                onHistoryClick={handleHistoryClick}
                onDeleteCategory={handleDeleteCategory}
                onEditCategory={handleEditCategory}
                onAddCategory={() => setShowAddWarehouseModal(true)}
                rowNumber={4}
              />
            </div>

            {showHistory && selectedCategory && (
              <TransactionHistory
                category={selectedCategory}
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
              />
            )}

            {showTransferModal && transferData && (
              <TransferModal
                sourceCategory={transferData.sourceCategory}
                targetCategory={transferData.targetCategory}
                isOpen={showTransferModal}
                onClose={() => {
                  setShowTransferModal(false);
                  setTransferData(null);
                }}
              />
            )}

            {showAddWarehouseModal && (
              <AddWarehouseItemModal
                isOpen={showAddWarehouseModal}
                onClose={() => setShowAddWarehouseModal(false)}
              />
            )}
          </div>
        </DndContext>
      </Scrollbars>
    </div>
  );
};