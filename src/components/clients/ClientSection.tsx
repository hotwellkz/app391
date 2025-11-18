import React, { useState, useEffect } from 'react';
import { Client } from '../../types/client';
import { ChevronDown, ChevronRight, Building2, Wallet, CheckCircle2, GripVertical, Move, Lock } from 'lucide-react';
import { ClientCard } from './ClientCard';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, TouchSensor, MouseSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableClientCard } from './SortableClientCard';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// Ключ для localStorage
const DRAG_ENABLED_KEY = 'clientDragEnabled';

interface ClientSectionProps {
  title: string;
  subtitle: string;
  clients: Client[];
  onContextMenu: (e: React.MouseEvent, client: Client) => void;
  onClientClick: (client: Client) => void;
  onToggleVisibility: (client: Client) => Promise<void>;
  type: 'building' | 'deposit' | 'built';
  onReorder?: (clients: Client[]) => void;
}

export const ClientSection: React.FC<ClientSectionProps> = ({
  title,
  subtitle,
  clients,
  onContextMenu,
  onClientClick,
  onToggleVisibility,
  type,
  onReorder
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [items, setItems] = useState<Client[]>(clients);
  const [isMobile, setIsMobile] = useState(false);
  
  // Получаем сохраненное состояние из localStorage или используем true по умолчанию
  const getSavedDragState = (): boolean => {
    try {
      const saved = localStorage.getItem(DRAG_ENABLED_KEY);
      return saved === null ? true : saved === 'true';
    } catch (e) {
      // В случае ошибки (например, если localStorage недоступен) возвращаем true
      return true;
    }
  };
  
  const [dragEnabled, setDragEnabled] = useState(getSavedDragState());

  // Определяем, является ли устройство мобильным
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Обновляем локальное состояние при изменении props
  useEffect(() => {
    setItems(clients);
  }, [clients]);

  // Используем разные сенсоры в зависимости от типа устройства
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Настройки для мыши
      activationConstraint: {
        distance: 10, // Минимальное расстояние для активации
      },
    }),
    useSensor(TouchSensor, {
      // Специальные настройки для сенсорных устройств
      activationConstraint: {
        delay: 250, // Задержка перед активацией (мс)
        tolerance: 5, // Допустимое отклонение в пикселях
        distance: 15, // Минимальное расстояние для активации
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getIcon = () => {
    switch (type) {
      case 'building':
        return <Building2 className="w-5 h-5 text-emerald-600" />;
      case 'deposit':
        return <Wallet className="w-5 h-5 text-amber-600" />;
      case 'built':
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'building':
        return {
          icon: 'text-emerald-600',
          title: 'text-emerald-900',
          badge: 'text-emerald-600 bg-emerald-50'
        };
      case 'deposit':
        return {
          icon: 'text-amber-600',
          title: 'text-amber-900',
          badge: 'text-amber-600 bg-amber-50'
        };
      case 'built':
        return {
          icon: 'text-blue-600',
          title: 'text-blue-900',
          badge: 'text-blue-600 bg-blue-50'
        };
    }
  };

  const colors = getColors();

  // Обработчик окончания перетаскивания
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex(item => item.id === active.id);
        const newIndex = prevItems.findIndex(item => item.id === over.id);
        
        const newItems = arrayMove(prevItems, oldIndex, newIndex);
        
        // Обновляем порядок элементов
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order: index
        }));
        
        // Вызываем колбэк для сохранения порядка в базе данных
        if (onReorder) {
          onReorder(updatedItems);
        }
        
        return updatedItems;
      });
    }
  };

  // Generate row numbers for clients
  const clientsWithRowNumbers = items.map((client, index) => ({
    ...client,
    rowNumber: String(index + 1).padStart(3, '0')
  }));

  // Переключение режима перетаскивания
  const toggleDragMode = (e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем срабатывание onClick родительского элемента
    const newState = !dragEnabled;
    setDragEnabled(newState);
    
    // Сохраняем состояние в localStorage
    try {
      localStorage.setItem(DRAG_ENABLED_KEY, String(newState));
    } catch (e) {
      // Игнорируем ошибки при сохранении (например, если localStorage недоступен)
      console.warn('Failed to save drag state to localStorage:', e);
    }
  };

  return (
    <div>
      <div 
        className="flex items-center justify-between mb-3 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className={`w-5 h-5 ${colors.icon}`} />
          ) : (
            <ChevronDown className={`w-5 h-5 ${colors.icon}`} />
          )}
          {getIcon()}
          <h3 className={`font-medium ${colors.title}`}>
            {title} ({clients.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isMobile && clients.length > 1 && !isCollapsed && (
            <button 
              onClick={toggleDragMode}
              className={`p-1 rounded-full ${dragEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}
              title={dragEnabled ? 'Отключить перетаскивание' : 'Включить перетаскивание'}
            >
              {dragEnabled ? <Move className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          )}
          <div className={`text-xs px-2 py-1 rounded-full ${colors.badge}`}>
            {subtitle}
          </div>
        </div>
      </div>
      
      {!isCollapsed && (
        <>
          {/* Подсказка о возможности перетаскивания */}
          {clients.length > 1 && dragEnabled && (
            <div className="text-xs text-gray-500 mb-2 flex items-center">
              <span className="mr-1">Используйте</span>
              <GripVertical className="w-3 h-3 inline-block mx-1" />
              <span>для изменения порядка элементов</span>
            </div>
          )}
          
          {dragEnabled ? (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext 
                items={clientsWithRowNumbers.map(client => client.id)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {clientsWithRowNumbers.map(client => (
                    <SortableClientCard
                      key={client.id}
                      client={client}
                      onContextMenu={onContextMenu}
                      onClientClick={onClientClick}
                      onToggleVisibility={onToggleVisibility}
                      type={type}
                      rowNumber={client.rowNumber}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="space-y-2">
              {clientsWithRowNumbers.map(client => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onContextMenu={onContextMenu}
                  onClientClick={onClientClick}
                  onToggleVisibility={onToggleVisibility}
                  type={type}
                  rowNumber={client.rowNumber}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};