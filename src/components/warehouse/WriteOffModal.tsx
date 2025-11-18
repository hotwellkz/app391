import React, { useState } from 'react';
import { X } from 'lucide-react';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types/warehouse';
import { sendLowStockNotification } from '../../services/notificationService';

interface WriteOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const WriteOffModal: React.FC<WriteOffModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity > product.quantity) {
      alert('Количество списания не может превышать текущий остаток');
      return;
    }

    setLoading(true);
    try {
      // Обновляем количество товара
      const productRef = doc(db, 'products', product.id);
      const newQuantity = product.quantity - quantity;
      await updateDoc(productRef, {
        quantity: newQuantity,
        updatedAt: serverTimestamp()
      });

      // Добавляем запись в историю
      await addDoc(collection(db, 'productHistory'), {
        productId: product.id,
        type: 'remove',
        quantity,
        date: serverTimestamp(),
        user: {
          id: 'current-user-id', // Заменить на реального пользователя
          name: 'Текущий пользователь'
        },
        description: `Списание: ${reason}`
      });

      // Отправляем уведомление если остаток ниже минимального
      if (newQuantity <= product.minQuantity) {
        await sendLowStockNotification(product.name, newQuantity, product.unit);
      }

      onClose();
    } catch (error) {
      console.error('Error writing off product:', error);
      alert('Ошибка при списании товара');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Списание товара</h2>
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
              Текущий остаток
            </label>
            <input
              type="text"
              value={`${product.quantity} ${product.unit}`}
              disabled
              className="w-full px-3 py-2 border rounded-md bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество для списания
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              required
              min="1"
              max={product.quantity}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Причина списания
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              required
              rows={3}
            />
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
              disabled={loading || quantity === 0 || quantity > product.quantity}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Списание...' : 'Списать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};