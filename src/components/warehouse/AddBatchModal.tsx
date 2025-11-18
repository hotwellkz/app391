import React, { useState } from 'react';
import { X } from 'lucide-react';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types/warehouse';

interface AddBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const AddBatchModal: React.FC<AddBatchModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(product.averagePurchasePrice);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Создаем новую партию
      const batchRef = await addDoc(collection(db, 'productBatches'), {
        productId: product.id,
        quantity,
        purchasePrice: price,
        totalPrice: quantity * price,
        date: serverTimestamp(),
        addedBy: {
          id: 'current-user-id', // Заменить на реального пользователя
          name: 'Текущий пользователь' // Заменить на реального пользователя
        }
      });

      // Обновляем информацию о товаре
      const newTotalQuantity = product.quantity + quantity;
      const newTotalPrice = product.totalPurchasePrice + (quantity * price);
      const newAveragePrice = newTotalPrice / newTotalQuantity;

      await updateDoc(doc(db, 'products', product.id), {
        quantity: newTotalQuantity,
        totalPurchasePrice: newTotalPrice,
        averagePurchasePrice: newAveragePrice,
        updatedAt: serverTimestamp()
      });

      // Добавляем запись в историю
      await addDoc(collection(db, 'productHistory'), {
        productId: product.id,
        type: 'add',
        quantity,
        price,
        date: serverTimestamp(),
        user: {
          id: 'current-user-id', // Заменить на реального пользователя
          name: 'Текущий пользователь' // Заменить на реального пользователя
        },
        description: 'Добавлена новая партия: ' + quantity + ' ' + product.unit
      });

      onClose();
    } catch (error) {
      console.error('Error adding batch:', error);
      alert('Ошибка при добавлении партии');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Добавить партию</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Товар
            </label>
            <input
              type="text"
              value={product.name}
              disabled
              className="w-full px-3 py-2 border rounded-md bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество ({product.unit})
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Цена за единицу (₸)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              required
              min="0"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Общая стоимость:</span>
              <span className="font-medium">{(quantity * price).toLocaleString()} ₸</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
            >
              {loading ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};