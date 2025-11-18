import React, { useState } from 'react';
import { X, FolderInput, Activity, Database, Trash2, PackagePlus, PackageMinus } from 'lucide-react';
import { Edit2 } from 'lucide-react';
import { Product } from '../../types/product';
import { MoveFolderModal } from './MoveFolderModal';
import { ProductMovementModal } from './ProductMovementModal';
import { ProductStockModal } from './ProductStockModal';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import { useNavigate } from 'react-router-dom';

interface ProductActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const ProductActionsModal: React.FC<ProductActionsModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const [showMoveFolder, setShowMoveFolder] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showExpenseQuantity, setShowExpenseQuantity] = useState(false);
  const [showIncomeQuantity, setShowIncomeQuantity] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuantity, setEditedQuantity] = useState(product.quantity || 0);
  const [editedPrice, setEditedPrice] = useState(product.averagePurchasePrice || 0);
  const [editedMinQuantity, setEditedMinQuantity] = useState(product.minQuantity || 5);
  const [editedWarehouse, setEditedWarehouse] = useState(product.warehouse || '1');

  if (!isOpen) return null;

  const handleEdit = () => {
    if (!isAdmin) {
      showErrorNotification('У вас нет прав для редактирования товаров');
      return;
    }
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

  const handleExpenseQuantityConfirm = (quantity: number) => {
    navigate('/warehouse/expense/new', {
      state: {
        addedProduct: {
          product,
          quantity
        }
      }
    });
    onClose();
  };

  const handleIncomeQuantityConfirm = (quantity: number) => {
    navigate('/warehouse/income/new', {
      state: {
        addedProduct: {
          product,
          quantity: quantity
        }
      }
    });
    onClose();
  };

  const actions = [
    {
      icon: <Edit2 className="w-5 h-5" />,
      label: 'Редактировать',
      onClick: handleEdit,
      color: 'text-blue-600'
    },
    {
      icon: <PackageMinus className="w-5 h-5" />,
      label: 'Добавить в расход',
      onClick: () => setShowExpenseQuantity(true),
      color: 'text-red-600'
    },
    {
      icon: <PackagePlus className="w-5 h-5" />,
      label: 'Добавить в приход',
      onClick: () => setShowIncomeQuantity(true),
      color: 'text-emerald-600'
    },
    {
      icon: <FolderInput className="w-5 h-5" />,
      label: 'Переместить в папку',
      onClick: () => setShowMoveFolder(true),
      color: 'text-blue-600'
    },
    {
      icon: <Activity className="w-5 h-5" />,
      label: 'Движение товара',
      onClick: () => setShowMovement(true),
      color: 'text-emerald-600'
    },
    {
      icon: <Database className="w-5 h-5" />,
      label: 'Наличие на складах',
      onClick: () => setShowStock(true),
      color: 'text-amber-600'
    },
    {
      icon: <Trash2 className="w-5 h-5" />,
      label: 'Удалить',
      onClick: () => setShowDelete(true),
      color: 'text-red-600'
    }
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-sm mx-4">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-medium">
              {isEditing ? 'Редактирование товара' : product.name}
            </h2>
            <button onClick={() => {
              setIsEditing(false);
              onClose();
            }}>
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {isEditing ? (
              <>
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
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
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
              </>
            ) : (
              actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="w-full flex items-center px-4 py-3 hover:bg-gray-50 rounded-lg mb-2 last:mb-0"
                >
                  <span className={`${action.color} mr-3`}>{action.icon}</span>
                  <span className="text-gray-700">{action.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <MoveFolderModal
        isOpen={showMoveFolder}
        onClose={() => setShowMoveFolder(false)}
        product={product}
      />

      <ProductMovementModal
        isOpen={showMovement}
        onClose={() => setShowMovement(false)}
        product={product}
      />

      <ProductStockModal
        isOpen={showStock}
        onClose={() => setShowStock(false)}
        product={product}
      />

      <DeleteProductModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        product={product}
      />

      <ProductQuantityModal
        isOpen={showExpenseQuantity}
        onClose={() => setShowExpenseQuantity(false)}
        onConfirm={handleExpenseQuantityConfirm}
        product={product}
        mode="expense"
      />

      <ProductQuantityModal
        isOpen={showIncomeQuantity}
        onClose={() => setShowIncomeQuantity(false)}
        onConfirm={handleIncomeQuantityConfirm}
        product={product}
        mode="income"
      />
    </>
  );
};