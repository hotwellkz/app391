import React, { useState, useRef, useEffect } from 'react';
import { CategoryCard } from './CategoryCard';
import { CategoryCardType } from '../types';
import { AddCategoryButton } from './AddCategoryButton';
import { ChevronDown, ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { AddCategoryModal } from './AddCategoryModal';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CategoryGridProps {
  categories: CategoryCardType[];
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories: initialCategories }) => {
  const [categories, setCategories] = useState<CategoryCardType[]>(initialCategories);
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({
    row1: false,
    row2: false,
    row3: false,
    row4: false
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const scrollContainers = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCategory, setDraggedCategory] = useState<CategoryCardType | null>(null);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const activeContainer = useRef<string | null>(null);

  // Подписываемся на изменения в категориях
  useEffect(() => {
    const unsubscribeCallbacks: (() => void)[] = [];

    // Подписка на каждую строку категорий
    [1, 2, 3, 4].forEach(row => {
      const q = query(
        collection(db, 'categories'),
        where('row', '==', row)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setCategories(prev => {
          const updatedCategories = [...prev];
          snapshot.docChanges().forEach(change => {
            const categoryData = {
              id: change.doc.id,
              ...change.doc.data()
            } as CategoryCardType;

            const index = updatedCategories.findIndex(cat => cat.id === categoryData.id);
            
            if (change.type === 'added' && index === -1) {
              updatedCategories.push(categoryData);
            } else if (change.type === 'modified' && index !== -1) {
              updatedCategories[index] = categoryData;
            } else if (change.type === 'removed') {
              if (index !== -1) {
                updatedCategories.splice(index, 1);
              }
            }
          });
          return updatedCategories;
        });
      });

      unsubscribeCallbacks.push(unsubscribe);
    });

    return () => {
      unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const categoriesByRow = {
    row1: categories.filter(cat => !cat.row || cat.row === 1),
    row2: categories.filter(cat => cat.row === 2),
    row3: categories.filter(cat => cat.row === 3),
    row4: categories.filter(cat => cat.row === 4),
  };

  const rowTitles = {
    row1: 'Клиенты',
    row2: 'Сотрудники',
    row3: 'Проекты',
    row4: 'Склад',
  };

  const toggleSection = (rowKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  };

  const handleAddClick = (row: number) => {
    setSelectedRow(row);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
  };

  const scroll = (rowKey: string, direction: 'left' | 'right') => {
    const container = scrollContainers.current[rowKey];
    if (container) {
      const scrollAmount = 240;
      container.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  const handleMouseDown = (e: React.MouseEvent, rowKey: string) => {
    if (draggedCategory) return;

    const container = scrollContainers.current[rowKey];
    if (container) {
      setIsDragging(true);
      activeContainer.current = rowKey;
      dragStartX.current = e.clientX;
      scrollStartX.current = container.scrollLeft;
      container.style.cursor = 'grabbing';
      container.style.userSelect = 'none';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !activeContainer.current || draggedCategory) return;
    
    const container = scrollContainers.current[activeContainer.current];
    if (container) {
      e.preventDefault();
      const deltaX = e.clientX - dragStartX.current;
      container.scrollLeft = scrollStartX.current - deltaX;
    }
  };

  const handleMouseUp = () => {
    if (!activeContainer.current) return;
    
    const container = scrollContainers.current[activeContainer.current];
    if (container) {
      setIsDragging(false);
      activeContainer.current = null;
      container.style.cursor = 'grab';
      container.style.removeProperty('user-select');
    }
  };

  const handleDragStart = (category: CategoryCardType) => {
    setDraggedCategory(category);
  };

  const handleDragEnd = () => {
    setDraggedCategory(null);
  };

  const handleDrop = (sourceCategory: CategoryCardType, targetCategory: CategoryCardType) => {
    console.log('Drop:', { source: sourceCategory.title, target: targetCategory.title });
  };

  const handleCategoryDelete = (categoryId: string) => {
    setCategories(prevCategories => 
      prevCategories.filter(category => category.id !== categoryId)
    );
  };

  return (
    <div className="space-y-6">
      {Object.entries(categoriesByRow).map(([rowKey, rowCategories], index) => {
        const isCollapsed = collapsedSections[rowKey];
        const rowNumber = index + 1;
        
        return (
          <div key={rowKey} className="space-y-4">
            <button 
              onClick={() => toggleSection(rowKey)}
              className="flex items-center space-x-2 w-full px-4"
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
              <span className="text-base font-medium text-gray-700">
                {rowTitles[rowKey as keyof typeof rowTitles]}
              </span>
            </button>
            
            {!isCollapsed && (
              <div className="relative group">
                <div 
                  ref={el => scrollContainers.current[rowKey] = el}
                  className="overflow-x-hidden cursor-grab"
                  onMouseDown={(e) => handleMouseDown(e, rowKey)}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div className="grid grid-cols-4 gap-2 px-2 sm:grid-cols-none sm:gap-0 sm:px-4 sm:inline-flex sm:space-x-4">
                    {rowCategories.map((category) => (
                      <div key={category.id} className="sm:w-[120px] flex-shrink-0">
                        <CategoryCard 
                          category={category}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onDrop={handleDrop}
                          onDelete={handleCategoryDelete}
                        />
                      </div>
                    ))}
                    <div className="sm:w-[120px] flex-shrink-0">
                      <AddCategoryButton onClick={() => handleAddClick(rowNumber)} />
                    </div>
                  </div>
                </div>
                
                {rowCategories.length > 5 && (
                  <>
                    <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent">
                      <button
                        onClick={() => scroll(rowKey, 'left')}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent">
                      <button
                        onClick={() => scroll(rowKey, 'right')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {isModalOpen && selectedRow && (
        <AddCategoryModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          selectedRow={selectedRow}
        />
      )}
    </div>
  );
};