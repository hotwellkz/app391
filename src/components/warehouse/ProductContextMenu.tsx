import React, { useState } from 'react';
import { Edit2, ArrowRight, Trash2 } from 'lucide-react';
import { Product } from '../../types/warehouse';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PasswordPrompt } from '../PasswordPrompt';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';

interface ProductContextMenuProps {
  position: { x: number; y: number };
  product: Product;
  onClose: () => void;
}

export const ProductContextMenu: React.FC<ProductContextMenuProps> = ({
  position,
  product,
  onClose
}) => {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuantity, setEditedQuantity] = useState(product.quantity || 0);
  const [editedPrice, setEditedPrice] = useState(product.averagePurchasePrice || 0);
  const [editedMinQuantity, setEditedMinQuantity] = useState(product.minQuantity || 5);
  const [editedWarehouse, setEditedWarehouse] = useState(product.warehouse || '1');

  const handleEdit = () => {
    setShowPasswordPrompt(true);
  };

  const handlePasswordSuccess = () => {
    setShowPasswordPrompt(false);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (editedQuantity < 0) {
        showErrorNotification('Количество не может быть отрицательным');
        return;
      }

      if (editedPrice < 0) {
        showErrorNotification('Цена не может быть отрицательной');
        return;
      }

      if (editedMinQuantity < 0) {
        showErrorNotification('Минимальное количество не может быть отрицательным');
        return;
      }
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        quantity: editedQuantity,
        averagePurchasePrice: editedPrice,
        minQuantity: editedMinQuantity,
        warehouse: editedWarehouse,
        totalPurchasePrice: editedQuantity * editedPrice,
        updatedAt: serverTimestamp()
      });

      showSuccessNotification('Товар успешно обновлен');
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      showErrorNotification('Ошибка при обновлении товара');
    }
  };

  const handleMoveToWarehouse = async (warehouseNumber: string) => {
    try {
      const productRef = doc(db, 'products', product.id);
      const currentWarehouse = product.warehouse;
      
      if (currentWarehouse === warehouseNumber) {
        showErrorNotification('Товар уже находится на этом складе');
        return;
      }
      
      await updateDoc(productRef, {
        warehouse: warehouseNumber,
        updatedAt: serverTimestamp()
      });
      showSuccessNotification(`Товар перемещен на Склад ${warehouseNumber}`);
      onClose();
    } catch (error) {
      console.error('Error moving product:', error);
      showErrorNotification('Ошибка при перемещении товара');
    }
  };

  const handleDelete = async () => {
    try {
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        isDeleted: true,
        updatedAt: serverTimestamp()
      });
      showSuccessNotification('Товар успешно удален');
      onClose();
    } catch (error) {
      console.error('Error deleting product:', error);
      showErrorNotification('Ошибка при удалении товара');
    }
  };

  if (showPasswordPrompt) {
    return (
      <PasswordPrompt
        isOpen={showPasswordPrompt}
        onClose={() => {
          setShowPasswordPrompt(false);
          onClose();
        }}
        onSuccess={handlePasswordSuccess}
      />
    );
  }

  if (showDeleteConfirm) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setShowDeleteConfirm(false)}
      >
        <div 
          className="bg-white rounded-lg p-6 max-w-sm mx-4"
          onClick={e => e.stopPropagation()}
        >
          <h3 className="text-lg font-medium mb-4">Удалить товар?</h3>
          <p className="text-gray-600 mb-6">
            Вы уверены, что хотите удалить товар "{product.name}"?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-gray-600"
            >
              Отмена
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setIsEditing(false)}
      >
        <div 
          className="bg-white rounded-lg p-6 max-w-sm mx-4"
          onClick={e => e.stopPropagation()}
        >
          <h3 className="text-lg font-medium mb-4">Редактирование товара</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Количество ({product.unit})
              </label>
              <input
                type="number"
                value={editedQuantity}
                onChange={(e) => setEditedQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Средняя цена (₸)
              </label>
              <input
                type="number"
                value={editedPrice}
                onChange={(e) => setEditedPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Минимальное количество
              </label>
              <input
                type="number"
                value={editedMinQuantity}
                onChange={(e) => setEditedMinQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                min="0"
              />
              <p className="mt-1 text-xs text-gray-500">
                При достижении этого количества товар будет помечен как "Мало на складе"
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Склад
              </label>
              <select
                value={editedWarehouse}
                onChange={(e) => setEditedWarehouse(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="1">Склад 1</option>
                <option value="2">Склад 2</option>
                <option value="3">Склад 3</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed bg-white rounded-lg shadow-lg py-1 z-50 min-w-[200px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b">
        {product.name}
      </div>

      <button
        onClick={handleEdit}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <Edit2 className="w-4 h-4" />
        Редактировать
      </button>

      {/* Показываем опции перемещения в зависимости от текущего склада */}
      {product.warehouse === '1' ? (
        <>
          <button
            onClick={() => handleMoveToWarehouse('2')}
            className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-gray-100 flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Переместить на Склад 2
          </button>
          <button
            onClick={() => handleMoveToWarehouse('3')}
            className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-gray-100 flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Переместить на Склад 3
          </button>
        </>
      ) : product.warehouse === '2' ? (
        <>
          <button
            onClick={() => handleMoveToWarehouse('1')}
            className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-gray-100 flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Переместить на Склад 1
          </button>
          <button
            onClick={() => handleMoveToWarehouse('3')}
            className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-gray-100 flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Переместить на Склад 3
          </button>
        </>
      ) : product.warehouse === '3' ? (
        <>
          <button
            onClick={() => handleMoveToWarehouse('1')}
            className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-gray-100 flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Переместить на Склад 1
          </button>
          <button
            onClick={() => handleMoveToWarehouse('2')}
            className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-gray-100 flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Переместить на Склад 2
          </button>
        </>
      ) : null}

      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Удалить
      </button>
    </div>
  );
};