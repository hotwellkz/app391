import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Image as ImageIcon, Folder, Package } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Product, ProductFolder } from '../../../types/warehouse';
import { ProductActionsModal } from '../../../components/warehouse/ProductActionsModal';
import { ProductQuantityModal } from '../../../components/warehouse/ProductQuantityModal';

export const FolderProducts: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { folderId } = useParams();
  const [folder, setFolder] = useState<ProductFolder | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);

  useEffect(() => {
    if (!folderId) return;

    // Загружаем информацию о папке
    const loadFolder = async () => {
      const folderDoc = await getDoc(doc(db, 'productFolders', folderId));
      if (folderDoc.exists()) {
        setFolder({ id: folderDoc.id, ...folderDoc.data() } as ProductFolder);
      }
    };

    loadFolder();

    // Подписываемся на товары в папке
    const q = query(
      collection(db, 'products'),
      where('folderId', '==', folderId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [folderId]);

  const handleProductClick = (e: React.MouseEvent, product: Product) => {
    const isFromExpense = location.state === 'expense';
    if (isFromExpense) {
      e.preventDefault(); // Предотвращаем переход на страницу товара
      setSelectedProduct(product);
      setShowQuantityModal(true);
    } else {
      navigate(`/warehouse/product/${product.id}`);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    setSelectedProduct(product);
    setShowActionsModal(true);
  };

  const handleQuantityConfirm = (quantity: number) => {
    if (selectedProduct) {
      navigate('/warehouse/expense/new', {
        replace: true,
        state: {
          addedProduct: {
            product: selectedProduct,
            quantity
          }
        }
      });
      setShowQuantityModal(false);
      setSelectedProduct(null);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!folder && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <Folder className="w-12 h-12 text-gray-400 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Папка не найдена</h2>
          <button
            onClick={() => navigate('/warehouse/products')}
            className="text-emerald-600 hover:text-emerald-700"
          >
            Вернуться к списку товаров
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/warehouse/products')}>
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div className="flex items-center">
                <div className={`w-8 h-8 ${folder?.color} rounded-lg flex items-center justify-center mr-3`}>
                  <Folder className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">{folder?.name}</h1>
              </div>
            </div>
          </div>

          {/* Поиск */}
          <div className="p-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск товаров в папке..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Список товаров */}
      <div className="max-w-7xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Нет товаров</h3>
            <p className="text-gray-500">
              {searchQuery ? 'По вашему запросу ничего не найдено' : 'В этой папке пока нет товаров'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white hover:bg-gray-50 border rounded-lg transition-colors"
                onClick={(e) => handleProductClick(e, product)}
                onContextMenu={(e) => handleContextMenu(e, product)}
              >
                <div className="flex items-center p-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-base font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-medium text-gray-900">
                      {product.quantity}
                    </span>
                    <p className="text-xs text-gray-500">{product.unit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductActionsModal
          isOpen={showActionsModal}
          onClose={() => {
            setShowActionsModal(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />
      )}
      
      {selectedProduct && (
        <ProductQuantityModal
          isOpen={showQuantityModal}
          onClose={() => {
            setShowQuantityModal(false);
            setSelectedProduct(null);
          }}
          onConfirm={handleQuantityConfirm}
          product={selectedProduct}
        />
      )}
    </div>
  );
};