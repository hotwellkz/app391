import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Product } from '../../types/product';

interface ProductQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  product: Product;
  mode?: 'income' | 'expense';
}

export const ProductQuantityModal: React.FC<ProductQuantityModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  product,
  mode = 'expense'
}) => {
  const [quantity, setQuantity] = useState('1');
  const [isFocused, setIsFocused] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numQuantity = parseInt(quantity);
    if (!isNaN(numQuantity) && numQuantity > 0 && (mode === 'income' || numQuantity <= (product.quantity || 0))) {
      onConfirm(numQuantity);
      onClose();
    } else {
      setQuantity('1');
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || !isNaN(Number(value))) {
      setQuantity(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xs mx-4 rounded-lg">
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">{product.name}</h3>
          <p className="text-sm text-gray-600 mb-4">
            {mode === 'expense' && `На складе: ${product.quantity} ${product.unit}`}
          </p>
          
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setQuantity(String(Math.max(1, Number(quantity || 1) - 1)))}
              className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200"
            >
              -
            </button>
            <input
              type="number"
              value={isFocused && quantity === '1' ? '' : quantity}
              onChange={handleQuantityChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-20 px-3 py-2 border rounded-lg text-lg text-center"
              min="1"
              max={mode === 'expense' ? product.quantity : undefined}
              required
            />
            <button
              onClick={() => setQuantity(String(Number(quantity || 1) + 1))}
              className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200"
            >
              +
            </button>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600"
            >
              ОТМЕНА
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 text-emerald-600 font-medium"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};