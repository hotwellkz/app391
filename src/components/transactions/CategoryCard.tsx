import React, { useState, useEffect } from 'react';
import { CategoryCardType } from '../../types';
import { useDraggable } from '@dnd-kit/core';
import { formatAmount } from '../../utils/formatUtils';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface CategoryCardProps {
  category: CategoryCardType;
  onHistoryClick?: (e: React.MouseEvent) => void;
  isDragging?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  onHistoryClick,
  isDragging = false
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: category.id,
    data: category
  });
  const [warehouseTotal, setWarehouseTotal] = useState(0);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const cardOpacity = isDragging ? 'opacity-50' : 'opacity-100';

  useEffect(() => {
    if (category.row === 4 && category.title === 'Склад') {
      const q = query(collection(db, 'products'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const total = snapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.quantity || 0) * (data.price || 0);
        }, 0);
        setWarehouseTotal(total);
      });

      return () => unsubscribe();
    }
  }, [category.row, category.title]);

  const handleClick = (e: React.MouseEvent) => {
    if (onHistoryClick) {
      onHistoryClick(e);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`relative flex flex-col items-center space-y-1 py-1 ${cardOpacity} ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } touch-none select-none`}
    >
      <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center shadow-lg`}>
        {category.icon}
      </div>
      <div className="text-center">
        <div className="text-[10px] font-medium text-gray-700 truncate max-w-[60px]">
          {category.title}
        </div>
        {category.row === 4 && category.title === 'Склад' ? (
          <div className="text-[10px] font-medium text-emerald-500">
            {formatAmount(warehouseTotal)}
          </div>
        ) : (
          <div className={`text-[10px] font-medium ${parseFloat(category.amount.replace(/[^\d.-]/g, '')) < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {formatAmount(parseFloat(category.amount.replace(/[^\d.-]/g, '')))}
          </div>
        )}
      </div>
    </div>
  );
};