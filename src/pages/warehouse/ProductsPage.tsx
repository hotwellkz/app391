import React, { useState, useEffect } from 'react';
import { Search, SortAsc, Menu, Image as ImageIcon, PackagePlus, Scan, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types/product';

const formatQuantity = (quantity: number | undefined): string => {
  if (typeof quantity === 'undefined') return '0';
  return quantity.toString();
};

export const WarehouseProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      setProducts(productsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-emerald-50">
      {/* Шапка */}
      <div className="bg-emerald-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/warehouse')}>
                <Menu className="w-6 h-6 lg:hidden" />
              </button>
              <h1 className="text-xl font-semibold">Товары</h1>
            </div>
            <div className="flex items-center gap-3">
              <SortAsc className="w-6 h-6" />
              <div className="w-px h-6 bg-emerald-500" />
              <button className="p-2">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Подзаголовок */}
          <div className="px-4 py-2 bg-emerald-700">
            <p className="text-emerald-100">Основной склад</p>
          </div>

          {/* Поиск */}
          <div className="p-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск товаров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-emerald-500 text-white placeholder-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-emerald-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Список товаров */}
      <div className="max-w-7xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                onClick={() => navigate(`/warehouse/product/${product.id}`)}
              >
                <div className="flex items-center p-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-base font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-emerald-600">
                      {formatQuantity(product.quantity)}
                    </span>
                    <p className="text-xs text-gray-500">{product.unit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Нижняя панель */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Всего товаров: {products.length}
          </div>
          <div className="flex gap-4">
            <button className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
              <PackagePlus className="w-6 h-6" />
            </button>
            <button className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
              <Scan className="w-6 h-6" />
            </button>
            <button className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white shadow-lg">
              <BarChart2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};