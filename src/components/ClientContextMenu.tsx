import React, { useEffect, useRef } from 'react';
import { Edit2, Trash2, Building2, Wallet, CheckCircle2 } from 'lucide-react';
import { useModalPosition } from '../hooks/useModalPosition';

interface ClientContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: 'building' | 'deposit' | 'built') => void;
  clientName: string;
  currentStatus?: 'building' | 'deposit' | 'built';
}

export const ClientContextMenu: React.FC<ClientContextMenuProps> = ({
  position,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  clientName,
  currentStatus
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPosition = useModalPosition(position, 200, 200);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg py-1 z-50 min-w-[200px]"
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
      }}
    >
      <button
        onClick={onEdit}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <Edit2 className="w-4 h-4" />
        Редактировать
      </button>

      {currentStatus !== 'building' && (
        <button
          onClick={() => {
            onStatusChange('building');
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-gray-100 flex items-center gap-2"
        >
          <Building2 className="w-4 h-4" />
          Перевести в "Строим"
        </button>
      )}

      {currentStatus !== 'deposit' && (
        <button
          onClick={() => {
            onStatusChange('deposit');
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-gray-100 flex items-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          Перевести в "Задаток"
        </button>
      )}

      {currentStatus !== 'built' && (
        <button
          onClick={() => {
            onStatusChange('built');
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-gray-100 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Перевести в "Построено"
        </button>
      )}

      <button
        onClick={onDelete}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Удалить
      </button>
    </div>
  );
};