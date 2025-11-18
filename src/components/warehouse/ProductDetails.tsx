import React, { useState } from 'react';
import { ArrowLeft, Package, History, QrCode, Edit2 } from 'lucide-react';
import { Product } from '../../types/warehouse';
import { TransactionHistory } from './TransactionHistory';
import { QRCodeModal } from './QRCodeModal';
import { ProductModal } from './ProductModal';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  onBack
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const formatAmount = (amount: number | undefined): string => {
    if (typeof amount !== 'number') return '0 ₸';
    return amount.toLocaleString('ru-RU') + ' ₸';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <button onClick={onBack} className="mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                {product.name}
              </h1>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
            >
              <Edit2 className="w-5 h-5 mr-1" />
              Редактировать
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Package className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
                  <p className="text-gray-500">{product.category}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Склад</label>
                  <p className="text-lg font-medium">Склад {product.warehouse}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Количество</label>
                  <p className={`text-lg font-medium ${
                    product.quantity <= 5 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {product.quantity} {product.unit}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Средняя цена</label>
                  <p className="text-lg font-medium text-gray-900">
                    {formatAmount(product.averagePurchasePrice || 0)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Общая стоимость</label>
                  <p className="text-lg font-medium text-emerald-600">
                    {formatAmount((product.quantity || 0) * (product.averagePurchasePrice || 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowHistory(true)}
                className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center">
                  <History className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="font-medium text-blue-900">История транзакций</span>
                </div>
                <span className="text-blue-600">→</span>
              </button>

              <button
                onClick={() => setShowQRCode(true)}
                className="w-full flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center">
                  <QrCode className="w-5 h-5 text-purple-600 mr-3" />
                  <span className="font-medium text-purple-900">QR-код товара</span>
                </div>
                <span className="text-purple-600">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showHistory && (
        <TransactionHistory
          product={product}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showQRCode && (
        <QRCodeModal
          isOpen={showQRCode}
          onClose={() => setShowQRCode(false)}
          product={product}
        />
      )}

      {showEditModal && (
        <ProductModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          product={product}
          onSave={() => {
            setShowEditModal(false);
            // Handle save
          }}
        />
      )}
    </div>
  );
};