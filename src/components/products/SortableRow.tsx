import React from 'react';
import { Edit2, Trash2, GripVertical } from 'lucide-react';
import { Product } from '../../types/product';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useIsAdmin } from '../../hooks/useIsAdmin';

interface SortableRowProps {
  product: Product;
  index: number;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  view: 'table' | 'card';
}

export const SortableRow: React.FC<SortableRowProps> = ({
  product,
  index,
  onEdit,
  onDelete,
  view
}) => {
  const { isAdmin } = useIsAdmin();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? '#F3F4F6' : undefined,
  };

  if (view === 'card') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="text-sm text-gray-500">№{index + 1}</div>
              {isAdmin && (
                <button
                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="text-sm font-medium text-gray-900 mb-1">{product.name}</div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>{product.unit}</div>
              <div className="font-medium text-gray-900">{product.price.toLocaleString()} ₸</div>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-start space-x-2 ml-4">
              <button
                onClick={() => onEdit(product)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full"
                title="Редактировать"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(product)}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-gray-50">
      <td className="hidden sm:table-cell px-2 sm:px-6 py-4">
        {isAdmin && (
          <button
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
      </td>
      <td className="hidden sm:table-cell px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {index + 1}
      </td>
      <td className="px-2 sm:px-6 py-4 text-sm text-gray-900">
        <div className="sm:hidden text-xs text-gray-500 mb-1">№{index + 1}</div>
        <div className="line-clamp-2 sm:line-clamp-none">{product.name}</div>
      </td>
      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {product.unit}
      </td>
      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {product.price.toLocaleString()}
      </td>
      {isAdmin && (
        <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
          <button
            onClick={() => onEdit(product)}
            className="text-blue-600 hover:text-blue-800 mr-3"
            title="Редактировать"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="text-red-600 hover:text-red-800"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      )}
      {!isAdmin && <td></td>}
    </tr>
  );
};