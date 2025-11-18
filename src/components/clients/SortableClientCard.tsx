import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ClientCard } from './ClientCard';
import { Client } from '../../types/client';
import { GripVertical } from 'lucide-react';

interface SortableClientCardProps {
  client: Client;
  onContextMenu: (e: React.MouseEvent, client: Client) => void;
  onClientClick: (client: Client) => void;
  onToggleVisibility: (client: Client) => Promise<void>;
  type: 'building' | 'deposit' | 'built';
  rowNumber: string;
}

export const SortableClientCard: React.FC<SortableClientCardProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: props.client.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    position: 'relative' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 flex items-center px-1 cursor-grab active:cursor-grabbing touch-none select-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      <div className="pl-6">
        <ClientCard {...props} />
      </div>
    </div>
  );
}; 