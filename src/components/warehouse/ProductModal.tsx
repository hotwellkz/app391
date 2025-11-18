import React, { useState } from 'react';
import { X } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types/warehouse';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  onSave: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    quantity: product?.quantity || 0,
    minQuantity: product?.minQuantity || 5,
    averagePurchasePrice: product?.averagePurchasePrice || 0,
    unit: product?.unit || 'шт',
    warehouse: product?.warehouse || '1'
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (product) {
        const quantityDiff = formData.quantity - product.quantity;
        
        // Обновляем продукт
        await updateDoc(doc(db, 'products', product.id), {
          ...formData,
          totalPurchasePrice: formData.quantity * formData.averagePurchasePrice,
          updatedAt: serverTimestamp()
        });

        // Если количество изменилось, добавляем запись в историю
        if (quantityDiff !== 0) {
          await addDoc(collection(db, 'productMovements'), {
            productId: product.id,
            type: quantityDiff > 0 ? 'in' : 'out',
            quantity: Math.abs(quantityDiff),
            price: formData.averagePurchasePrice,
            totalPrice: Math.abs(quantityDiff) * formData.averagePurchasePrice,
            date: serverTimestamp(),
            description: 'Ручное изменение количества',
            previousQuantity: product.quantity,
            newQuantity: formData.quantity,
            previousAveragePrice: product.averagePurchasePrice,
            newAveragePrice: formData.averagePurchasePrice
          });
        }

        showSuccessNotification('Товар успешно обновлен');
      } else {
        // Создаем новый продукт
        const newProduct = await addDoc(collection(db, 'products'), {
          ...formData,
          totalPurchasePrice: formData.quantity * formData.averagePurchasePrice,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Если начальное количество больше 0, добавляем запись в историю
        if (formData.quantity > 0) {
          await addDoc(collection(db, 'productMovements'), {
            productId: newProduct.id,
            type: 'in',
            quantity: formData.quantity,
            price: formData.averagePurchasePrice,
            totalPrice: formData.quantity * formData.averagePurchasePrice,
            date: serverTimestamp(),
            description: 'Начальное количество',
            previousQuantity: 0,
            newQuantity: formData.quantity,
            previousAveragePrice: 0,
            newAveragePrice: formData.averagePurchasePrice
          });
        }

        showSuccessNotification('Товар успешно создан');
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      showErrorNotification('Ошибка при сохранении товара');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {product ? 'Редактировать товар' : 'Добавить товар'}
          </h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Минимальное количество
            </label>
            <input
              type="number"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Средняя цена закупки
            </label>
            <input
              type="number"
              value={formData.averagePurchasePrice}
              onChange={(e) => setFormData({ ...formData, averagePurchasePrice: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Единица измерения
            </label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};