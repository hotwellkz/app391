import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, NewProduct } from '../types/product';
import { ProductList } from '../components/products/ProductList';
import { ProductModal } from '../components/products/ProductModal';
import { ProductSearchBar } from '../components/products/ProductSearchBar';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { Scrollbars } from 'react-custom-scrollbars-2';

export const Products: React.FC = () => {
  const { isAdmin } = useIsAdmin();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('order'));
    
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

  const handleAdd = () => {
    if (!isAdmin) {
      alert('Только администраторы могут добавлять товары');
      return;
    }
    setSelectedProduct(null);
    setShowModal(true);
  };

  const handleEdit = (product: Product) => {
    if (!isAdmin) {
      alert('Только администраторы могут редактировать товары');
      return;
    }
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (product: Product) => {
    if (!isAdmin) {
      alert('Только администраторы могут удалять товары');
      return;
    }
    
    if (window.confirm(`Вы уверены, что хотите удалить товар "${product.name}"?`)) {
      try {
        await deleteDoc(doc(db, 'products', product.id));
        
        // Обновляем порядок оставшихся продуктов
        const updatedProducts = products
          .filter(p => p.id !== product.id)
          .map((p, index) => ({ ...p, order: index }));
        
        const batch = writeBatch(db);
        updatedProducts.forEach(p => {
          batch.update(doc(db, 'products', p.id), { order: p.order });
        });
        await batch.commit();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Ошибка при удалении товара');
      }
    }
  };

  const handleSave = async (productData: NewProduct) => {
    if (!isAdmin) {
      alert('Только администраторы могут сохранять изменения');
      return;
    }
    try {
      if (selectedProduct) {
        console.log('Saving product data:', productData);
        await updateDoc(doc(db, 'products', selectedProduct.id), productData);
        console.log('Product data saved successfully');
      } else {
        // Находим максимальный order и добавляем новый продукт в конец
        const maxOrder = products.reduce((max, p) => Math.max(max, p.order), -1);
        await addDoc(collection(db, 'products'), {
          ...productData,
          order: maxOrder + 1
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  };

  const handleReorder = async (reorderedProducts: Product[]) => {
    if (!isAdmin) {
      alert('Только администраторы могут изменять порядок товаров');
      return;
    }
    try {
      const batch = writeBatch(db);
      reorderedProducts.forEach(product => {
        batch.update(doc(db, 'products', product.id), { order: product.order });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error reordering products:', error);
      alert('Ошибка при изменении порядка товаров');
    }
  };

  // Фильтрация товаров на основе поискового запроса
  const filteredProducts = products.filter(product => {
    const searchString = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchString) ||
      (product.category && product.category.toLowerCase().includes(searchString))
    );
  });

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
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-4">
              <div className="flex items-center">
                <button onClick={() => window.history.back()} className="mr-4">
                  <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Список товаров и цен
                </h1>
              </div>
            </div>

            <div className="py-2 sm:py-4">
              <ProductSearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {searchQuery ? 'Ничего не найдено' : 'Список товаров пуст'}
                </div>
              ) : (
                <ProductList
                  products={filteredProducts}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReorder={handleReorder}
                />
              )}
            </div>
          </div>
        </div>

        {showModal && (
          <ProductModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
            product={selectedProduct || undefined}
            isEditMode={!!selectedProduct}
          />
        )}
        
        {/* Плавающая кнопка добавления для мобильных устройств */}
        {isAdmin && (
          <div className="fixed right-4 bottom-4 sm:hidden">
            <button
              onClick={handleAdd}
              className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-emerald-600 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        )}
        
        {/* Кнопка добавления для десктопа */}
        {isAdmin && (
          <div className="hidden sm:block fixed right-8 bottom-8">
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5 mr-1" />
              Добавить товар
            </button>
          </div>
        )}
      </div>
    </Scrollbars>
  );
};