import React, { useEffect, useRef, useState } from 'react';
import { Edit2, Trash2, History, Info } from 'lucide-react';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { showErrorNotification } from '../utils/notifications';

interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewHistory: () => void;
  onViewClientInfo?: () => void;
  title: string;
  editLabel?: string;
  hideDelete?: boolean;
  showClientInfo?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  onClose,
  onEdit,
  onDelete,
  onViewHistory,
  onViewClientInfo,
  title,
  editLabel = "Редактировать",
  hideDelete = false,
  showClientInfo = false
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    const handleResize = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = position;

      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }

      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${Math.max(10, x)}px`;
      menuRef.current.style.top = `${Math.max(10, y)}px`;
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [onClose, position]);

  const handleClick = (e: React.MouseEvent, action: () => void, requiresAdmin = false) => {
    e.stopPropagation();
    
    if (requiresAdmin && !isAdmin) {
      showErrorNotification('Только администраторы могут выполнять это действие');
      onClose();
      return;
    }

    onClose();
    action();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg py-1 z-[1000] min-w-[200px]"
      style={{
        position: 'fixed',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
      }}
    >
      <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
        {title}
      </div>

      <button
        onClick={(e) => handleClick(e, onViewHistory)}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <History className="w-4 h-4" />
        История транзакций
      </button>

      {showClientInfo && onViewClientInfo && (
        <button
          onClick={(e) => handleClick(e, onViewClientInfo)}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <Info className="w-4 h-4" />
          Информация о клиенте
        </button>
      )}

      <button
        onClick={(e) => handleClick(e, onEdit, true)}
        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 
          ${isAdmin ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed'}`}
      >
        <Edit2 className="w-4 h-4" />
        {editLabel}
      </button>

      {!hideDelete && (
        <button
          onClick={(e) => handleClick(e, onDelete, true)}
          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 
            ${isAdmin ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 cursor-not-allowed'}`}
        >
          <Trash2 className="w-4 h-4" />
          Удалить
        </button>
      )}
    </div>
  );
};