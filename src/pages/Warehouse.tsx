import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Search, Package, AlertTriangle, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types/warehouse';
import { WarehouseSection } from '../components/warehouse/WarehouseSection';
import { ProductList } from '../components/warehouse/ProductList';
import { ProductContextMenu } from '../components/warehouse/ProductContextMenu';
import { ProductDetails } from '../components/warehouse/ProductDetails';
import { TransactionHistory } from '../components/warehouse/TransactionHistory';
import { QRCodeModal } from '../components/warehouse/QRCodeModal';
import { showErrorNotification } from '../utils/notifications';
import { Scrollbars } from 'react-custom-scrollbars-2';

export const Warehouse: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<'all' | '1' | '2' | '3'>('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    product: Product;
  } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [selectedHistoryProduct, setSelectedHistoryProduct] = useState<Product | null>(null);

  useEffect(() => {
    let q;
    
    try {
      if (showLowStock) {
        // Теперь мы не можем использовать where для фильтрации по minQuantity,
        // так как это требует сложного условия. Вместо этого загружаем все товары
        // и фильтруем на клиенте
        q = query(collection(db, 'products'), orderBy('name'));
      } else {
        // Normal query without quantity filter
        q = query(
          collection(db, 'products'),
          ...(selectedWarehouse !== 'all' ? [where('warehouse', '==', selectedWarehouse)] : []),
          orderBy('name')
        );
      }
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        
        // Фильтруем товары с учетом minQuantity
        const filteredData = showLowStock 
          ? productsData.filter(p => p.quantity <= (p.minQuantity || 5))
          : productsData;
        
        // Фильтруем по выбранному складу
        const warehouseFilteredData = selectedWarehouse === 'all'
          ? filteredData
          : filteredData.filter(p => p.warehouse === selectedWarehouse);
        
        setProducts(warehouseFilteredData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error in products subscription:', error);
      setLoading(false);
      return () => {};
    }
  }, [selectedWarehouse, showLowStock]);

  useEffect(() => {
    const total = products.reduce((sum, product) => {
      return sum + Math.floor((product.quantity || 0) * (product.averagePurchasePrice || 0));
    }, 0);
    setTotalValue(total);
  }, [products]);

  const handleContextMenu = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;
    
    // Проверяем, чтобы меню не выходило за пределы экрана
    const menuWidth = 200;
    const menuHeight = 300;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const adjustedX = x + menuWidth > viewportWidth ? viewportWidth - menuWidth - 10 : x;
    const adjustedY = y + menuHeight > viewportHeight ? viewportHeight - menuHeight - 10 : y;
    
    setContextMenu({
      x: adjustedX,
      y: adjustedY,
      product
    });
    setSelectedProduct(product);
  };

  // Закрываем контекстное меню при клике вне его
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const handleViewHistory = async (product: Product) => {
    try {
      if (!product) {
        showErrorNotification('Товар не найден');
        return;
      }
      setSelectedHistoryProduct(product);
      setShowHistory(true);
    } catch (error) {
      showErrorNotification('Не удалось загрузить историю транзакций');
    }
  };

  const handleViewQRCode = (product: Product) => {
    if (!product) {
      showErrorNotification('Товар не найден');
      return;
    }
    setSelectedProduct(product);
    setShowQRCode(true);
  };

  const filteredProducts = products.filter(product => {
    const searchString = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchString) ||
      product.category?.toLowerCase().includes(searchString)
    );
  });

  const handleSearchFocus = () => {
    // Проверяем, является ли устройство мобильным
    if (window.innerWidth < 640) { // 640px - это стандартный брейкпоинт sm: в Tailwind
      // Добавляем небольшую задержку, чтобы дать время клавиатуре появиться
      setTimeout(() => {
        searchInputRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  };

  return (
    <Scrollbars
      style={{ width: '100%', height: '100vh' }}
      universal={true}
      renderThumbVertical={props => <div {...props} className="thumb-vertical" />}
      autoHide
      autoHideTimeout={1000}
      autoHideDuration={200}
    >
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 py-2">
              <div className="flex items-center justify-between w-full sm:w-auto">
                <div className="flex items-center ml-8 sm:ml-0">
                  <button onClick={() => window.history.back()} className="mr-2">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-gray-900">Склад</h1>
                    <div className="flex items-center ml-2">
                      <span className="text-base font-medium text-emerald-600">{Math.round(totalValue).toLocaleString()} ₸</span>
                    </div>
                  </div>
                </div>
                
                {/* Мобильная версия кнопок */}
                <div className="flex sm:hidden items-center gap-2">
                  <button
                    onClick={() => navigate('/warehouse/income/new')}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                    title="Приход"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate('/warehouse/expense/new')}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Расход"
                  >
                    <ArrowDownRight className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => navigate('/warehouse/documents')}
                    className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"
                    title="Документы"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Десктопная версия кнопок */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => navigate('/warehouse/income/new')}
                  className="px-3 py-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Приход
                </button>
                <button
                  onClick={() => navigate('/warehouse/expense/new')}
                  className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Расход
                </button>
                <button 
                  onClick={() => navigate('/warehouse/documents')}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                  title="Документы"
                >
                  <FileText className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              {/* Удалено меню выбора склада */}
            </div>
            
            <div className="py-2 sm:py-2 overflow-x-hidden">
              <div className="relative ml-10 sm:ml-0 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleSearchFocus}
                    className="block w-full rounded-lg border-0 py-1.5 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                    placeholder="Поиск товаров"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>

                {/* Мобильная версия - иконка */}
                <button
                  onClick={() => setShowLowStock(!showLowStock)}
                  className="sm:hidden p-1.5 rounded-lg border-0 shadow-sm ring-1 ring-inset ring-gray-300 text-gray-400 hover:text-gray-600 hover:ring-gray-400"
                  title="Показать товары которых мало на складе"
                >
                  <AlertTriangle className={`w-5 h-5 ${showLowStock ? 'text-red-500' : ''}`} />
                </button>

                {/* Десктопная версия - чекбокс */}
                <label className="hidden sm:flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showLowStock}
                    onChange={(e) => setShowLowStock(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                  />
                  Показать товары которых мало на складе
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-2">
          {loading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">Нет товаров</h3>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'По вашему запросу ничего не найдено' : 'Добавьте первый товар'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <WarehouseSection
                title="Склад"
                subtitle="Основной склад"
                products={filteredProducts}
                onContextMenu={handleContextMenu}
                onProductClick={handleProductClick}
                onViewHistory={handleViewHistory}
                onViewQRCode={handleViewQRCode}
                warehouse="1"
              />
            </div>
          )}
        </div>

        {contextMenu && (
          <ProductContextMenu
            position={{ x: contextMenu.x, y: contextMenu.y }}
            product={contextMenu.product}
            onClose={() => setContextMenu(null)}
          />
        )}

        {showProductDetails && selectedProduct && (
          <ProductDetails
            product={selectedProduct}
            onBack={() => setShowProductDetails(false)}
          />
        )}

        {showHistory && selectedHistoryProduct && (
          <TransactionHistory
            product={selectedHistoryProduct}
            isOpen={showHistory}
            onClose={() => {
              setShowHistory(false);
              setSelectedHistoryProduct(null);
            }}
          />
        )}

        {showQRCode && selectedProduct && (
          <QRCodeModal
            isOpen={showQRCode}
            onClose={() => {
              setShowQRCode(false);
              setSelectedProduct(null);
            }}
            product={selectedProduct}
          />
        )}
      </div>
    </Scrollbars>
  );
};
