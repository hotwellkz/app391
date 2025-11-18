import React, { useState } from 'react';
import { ArrowLeft, Barcode, Camera, Plus, Minus, Image as ImageIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types/product';

export const ProductDetails: React.FC<{ product?: Product }> = ({ product }) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(product?.quantity || 0);
  const [isEditing, setIsEditing] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (!product) return;
    
    try {
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        quantity: newQuantity
      });
      setQuantity(newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50">
      {/* Шапка */}
      <div className="bg-emerald-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)}>
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold">Редактирование</h1>
            </div>
            <div className="flex items-center gap-3">
              <button>
                <Barcode className="w-6 h-6" />
              </button>
              <button>
                <Camera className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="px-4 py-2 bg-emerald-700">
            <p className="text-emerald-100">Основной склад</p>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 bg-emerald-100 rounded-lg flex items-center justify-center">
              {product?.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <ImageIcon className="w-12 h-12 text-emerald-600" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{product?.name}</h2>
              <p className="text-gray-500">{product?.category}</p>
            </div>
          </div>
        </div>

        {/* Штрих-код */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-medium mb-2">Штрих-код</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">{product?.id}</span>
            <button className="text-emerald-600">
              <Barcode className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Количество */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-medium mb-4">Количество</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-2xl font-semibold">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <span className="text-gray-500">{product?.unit}</span>
          </div>
        </div>

        {/* История операций */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-medium mb-2">История операций</h3>
          <div className="text-center text-gray-500 py-4">
            История операций пуста
          </div>
        </div>
      </div>
    </div>
  );
};