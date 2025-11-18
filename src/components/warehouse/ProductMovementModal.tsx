import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types/product';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Movement {
  id: string;
  type: 'in' | 'out';
  quantity: number;
  date: any;
  description: string;
  warehouse: string;
}

interface ProductMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const ProductMovementModal: React.FC<ProductMovementModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'productMovements'),
      where('productId', '==', product.id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const movementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Movement[];
      
      // Sort movements by date locally
      movementsData.sort((a, b) => b.date.seconds - a.date.seconds);
      
      setMovements(movementsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [product.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4" style={{ maxHeight: '90vh' }}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Движение товара</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              История движения пуста
            </div>
          ) : (
            <div className="space-y-4">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className={`p-4 rounded-lg ${
                    movement.type === 'in' ? 'bg-emerald-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {movement.type === 'in' ? (
                        <ArrowRight className="w-5 h-5 text-emerald-500 mr-2" />
                      ) : (
                        <ArrowLeft className="w-5 h-5 text-red-500 mr-2" />
                      )}
                      <div>
                        <p className="font-medium">
                          {movement.type === 'in' ? 'Приход' : 'Расход'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {movement.warehouse}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        movement.type === 'in' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {movement.type === 'in' ? '+' : '-'}{movement.quantity} {product.unit}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(movement.date.toDate(), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                      </p>
                    </div>
                  </div>
                  {movement.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {movement.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};