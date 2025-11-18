import React from 'react';
import { FolderInput, Edit2, Trash2 } from 'lucide-react';
import { ProductFolder } from '../../types/warehouse';

interface FolderContextMenuProps {
  folder: ProductFolder;
  position: { x: number; y: number };
  onClose: () => void;
  onMove: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const FolderContextMenu: React.FC<FolderContextMenuProps> = ({
  folder,
  position,
  onClose,
  onMove,
  onEdit,
  onDelete
}) => {
  const actions = [
    {
      icon: <FolderInput className="w-4 h-4" />,
      label: 'Переместить в папку',
      onClick: onMove,
      color: 'text-blue-600'
    },
    {
      icon: <Edit2 className="w-4 h-4" />,
      label: 'Редактировать',
      onClick: onEdit,
      color: 'text-emerald-600'
    },
    {
      icon: <Trash2 className="w-4 h-4" />,
      label: 'Удалить',
      onClick: onDelete,
      color: 'text-red-600'
    }
  ];

  return (
    <div
      className="fixed bg-white rounded-lg shadow-lg py-1 z-50 min-w-[200px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => {
            action.onClick();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        >
          <span className={action.color}>{action.icon}</span>
          <span className="text-gray-700">{action.label}</span>
        </button>
      ))}
    </div>
  );
};