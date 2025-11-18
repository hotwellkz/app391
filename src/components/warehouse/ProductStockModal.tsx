import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types/product';

interface WarehouseStock {
  id: string;
  name: string;
  quantity: number;
}

interface ProductStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const ProductStockModal: React.FC<ProductStockModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const stocksQuery = query(
          collection(db, 'warehouseStock'),
          where('productId', '==', product.id)
        );
        
        const snapshot = await getDocs(stocksQuery);
        setStocks(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as WarehouseStock[]);
      } catch (error) {
        console.error('Error fetching stocks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchStocks();
    }
  }, [product.id, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Наличие на складах</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : stocks.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Нет данных о наличии на складах</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stocks.map((stock) => (
                <div
                  key={stock.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{stock.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium text-emerald-600">
                      {stock.quantity} {product.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};