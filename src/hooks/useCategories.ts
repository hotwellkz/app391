import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Building2, Car, Globe, Hammer, Home, Package, User, Wallet } from 'lucide-react';
import { CategoryCardType } from '../types';
import React from 'react';

const iconMap: { [key: string]: React.ElementType } = {
  Car,
  User,
  Building2,
  Wallet,
  Home,
  Hammer,
  Globe,
  Package
};

// Кэш для иконок
const iconCache = new Map<string, React.ReactElement>();

// Функция для создания иконки с кэшированием
const createCachedIcon = (iconName: string): React.ReactElement => {
  const cacheKey = `${iconName}_24_text-white`;
  
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  const IconComponent = iconMap[iconName] || Home;
  const icon = React.createElement(IconComponent, { 
    size: 24,
    className: "text-white"
  });
  
  iconCache.set(cacheKey, icon);
  return icon;
};

interface ProcessedCategory {
  id: string;
  title: string;
  amount: string;
  icon: React.ReactElement;
  iconName: string;
  color: string;
  row: number;
  isVisible: boolean;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Мемоизированная функция обработки изменений
  const processChanges = useCallback((changes: any[]) => {
    const updates = new Map<string, ProcessedCategory | null>();
    
    changes.forEach(change => {
      if (change.type === 'removed') {
        updates.set(change.doc.id, null);
      } else {
        const data = change.doc.data();
        const icon = createCachedIcon(data.icon);
        
        updates.set(change.doc.id, {
          id: change.doc.id,
          title: data.title,
          amount: String(data.amount || 0),
          icon,
          iconName: data.icon,
          color: data.color || 'bg-emerald-500',
          row: parseInt(data.row) || 1,
          isVisible: data.isVisible !== undefined ? data.isVisible : true
        });
      }
    });
    
    return updates;
  }, []);

  // Мемоизированная функция обновления состояния
  const updateCategories = useCallback((updates: Map<string, ProcessedCategory | null>) => {
    setCategories(prev => {
      const newCategories = [...prev];

      updates.forEach((value, key) => {
        const index = newCategories.findIndex(cat => cat.id === key);
        
        if (value === null && index !== -1) {
          // Удаляем категорию
          newCategories.splice(index, 1);
        } else if (value) {
          if (index === -1) {
            // Добавляем новую категорию
            newCategories.push(value as CategoryCardType);
          } else {
            // Обновляем существующую категорию
            newCategories[index] = value as CategoryCardType;
          }
        }
      });

      // Сортируем по строкам для стабильного порядка
      return newCategories.sort((a, b) => (a.row || 0) - (b.row || 0));
    });
  }, []);

  // Мемоизированные производные значения
  const derivedValues = useMemo(() => {
    const visibleCategories = categories.filter(c => c.isVisible !== false);
    
    return {
      visibleCategories,
      clientCategories: visibleCategories.filter(c => c.row === 1),
      employeeCategories: visibleCategories.filter(c => c.row === 2),
      projectCategories: visibleCategories.filter(c => c.row === 3),
      warehouseCategories: visibleCategories.filter(c => c.row === 4),
      totalCategories: categories.length,
      visibleCount: visibleCategories.length
    };
  }, [categories]);

  useEffect(() => {
    let unsubscribe: () => void;

    try {
      const q = query(collection(db, 'categories'));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const changes = snapshot.docChanges();
            
            if (changes.length === 0) {
              setLoading(false);
              return;
            }

            const updates = processChanges(changes);
            updateCategories(updates);
            
            setLoading(false);
            setError(null);
          } catch (snapshotError) {
            console.error('Error processing snapshot:', snapshotError);
            setError('Ошибка обработки данных');
          }
        },
        (error) => {
          console.error('Categories subscription error:', error);
          setError('Ошибка получения данных');
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error in useCategories:', error);
      setError('Ошибка при инициализации подписки');
      setLoading(false);
      unsubscribe = () => {};
    }

    return () => unsubscribe?.();
  }, [processChanges, updateCategories]);

  // Функции для работы с категориями
  const getCategoryById = useCallback((id: string) => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  const getCategoriesByRow = useCallback((row: number) => {
    return categories.filter(cat => cat.row === row && cat.isVisible !== false);
  }, [categories]);

  return { 
    categories, 
    loading, 
    error,
    ...derivedValues,
    getCategoryById,
    getCategoriesByRow
  };
};