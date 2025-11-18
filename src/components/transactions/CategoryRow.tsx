import React, { useState, useRef, useEffect } from 'react';
import { CategoryCardType } from '../../types';
import { DroppableCategory } from './DroppableCategory';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';

interface CategoryRowProps {
  title: string;
  categories: CategoryCardType[];
  onHistoryClick: (category: CategoryCardType) => void;
  onDeleteCategory?: (category: CategoryCardType) => Promise<void>;
  onEditCategory?: (category: CategoryCardType) => void;
  onAddCategory?: () => void;
  rowNumber: number;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({
  title,
  categories,
  onHistoryClick,
  onDeleteCategory,
  onEditCategory,
  onAddCategory,
  rowNumber
}) => {
  console.log('CategoryRow получил onDeleteCategory:', !!onDeleteCategory);
  const [isCollapsed, setIsCollapsed] = useState(rowNumber === 1);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollStartX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current || rowNumber > 2) return;
    
    setIsScrolling(true);
    scrollStartX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeft.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScrolling || !scrollContainerRef.current || rowNumber > 2) return;

    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - scrollStartX.current) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    setIsScrolling(false);
  };

  const handleMouseLeave = () => {
    setIsScrolling(false);
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="p-2 relative">
      {rowNumber === 1 && (
        <div className={`${isMobile ? 'absolute top-0 right-0 z-10 mt-1 mr-1' : 'flex justify-end mb-2'}`}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      )}

      {!isCollapsed && (
        <div 
          ref={scrollContainerRef}
          className={`${isMobile ? 'grid grid-cols-4 gap-2' : 'flex space-x-4'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ userSelect: 'none', paddingTop: rowNumber === 1 && isMobile ? '40px' : '0' }}
        >
          {categories.map((category) => (
            <div 
              key={category.id} 
              className={rowNumber <= 2 ? 'flex-shrink-0' : ''}
            >
              <DroppableCategory
                category={category}
                onHistoryClick={() => onHistoryClick(category)}
                onDelete={onDeleteCategory ? () => {
                  console.log('onDelete вызван в CategoryRow для категории:', category.title);
                  return onDeleteCategory(category);
                } : undefined}
                onEdit={onEditCategory ? () => {
                  onEditCategory(category);
                } : undefined}
              />
            </div>
          ))}
          
          {rowNumber === 4 && onAddCategory && (
            <div className="flex items-center justify-center">
              <div 
                className="w-12 h-12 bg-purple-100 hover:bg-purple-200 rounded-full flex items-center justify-center shadow-sm transition-colors cursor-pointer" 
                onClick={onAddCategory}
              >
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};