import React from 'react';
import { Edit2, Trash2, GripVertical } from 'lucide-react';
import { Product } from '../../types/product';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableRow } from './SortableRow';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onReorder: (products: Product[]) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onEdit,
  onDelete,
  onReorder
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((item) => item.id === active.id);
      const newIndex = products.findIndex((item) => item.id === over.id);

      const newProducts = arrayMove(products, oldIndex, newIndex).map((product, index) => ({
        ...product,
        order: index
      }));

      onReorder(newProducts);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="hidden sm:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-10 px-2 sm:px-6 py-3"></th>
              <th scope="col" className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                №
              </th>
              <th scope="col" className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Наименование
              </th>
              <th scope="col" className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ед.изм
              </th>
              <th scope="col" className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Цена (₸)
              </th>
              <th scope="col" className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <SortableContext
              items={products.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {products.map((product, index) => (
                <SortableRow
                  key={product.id}
                  product={product}
                  index={index}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  view="table"
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </div>

      {/* Мобильный вид */}
      <div className="block sm:hidden">
        <SortableContext
          items={products.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {products.map((product, index) => (
              <SortableRow
                key={product.id}
                product={product}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
                view="card"
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </DndContext>
  );
};