import React, { useState, useEffect } from 'react';
import { Search, SortAsc, Menu, Image as ImageIcon, PackagePlus, Scan, BarChart2, Folder, Package, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { MoveFolderModal } from '../../../components/warehouse/MoveFolderModal';
import { FolderContextMenu } from '../../../components/warehouse/FolderContextMenu';
import { EditFolderModal } from '../../../components/warehouse/EditFolderModal';
import { DeleteFolderModal } from '../../../components/warehouse/DeleteFolderModal';
import { ProductActionsModal } from '../../../components/warehouse/ProductActionsModal';
import { ProductQuantityModal } from '../../../components/warehouse/ProductQuantityModal';
import { CreateFolderModal } from '../../../components/warehouse/CreateFolderModal';
import { db } from '../../../lib/firebase';
import { Product } from '../../../types/warehouse';
import { ProductFolder } from '../../../types/warehouse';
import { Scrollbars } from 'react-custom-scrollbars-2';

const filterUnassignedProducts = (products: Product[]): Product[] => {
  return products.filter(product => !product.folderId);
};

const formatQuantity = (quantity: number | undefined): string => {
  if (typeof quantity === 'undefined') return '0';
  return quantity.toString();
};

export const WarehouseProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [folders, setFolders] = useState<ProductFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<ProductFolder | null>(null);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    folder: ProductFolder;
  } | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [showLowStock, setShowLowStock] = useState(false);
  const [isAllProductsExpanded, setIsAllProductsExpanded] = useState(false);

  useEffect(() => {
    const productsQuery = query(collection(db, 'products'), orderBy('name'));
    const foldersQuery = query(collection(db, 'productFolders'), orderBy('createdAt', 'desc'));
    
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(filterUnassignedProducts(allProducts));
    });
    
    const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
      setFolders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProductFolder[]);
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeFolders();
    };
  }, []);

  const filteredProducts = filterUnassignedProducts(products).filter(product => 
    (product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     product.category?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!showLowStock || (typeof product.quantity === 'number' && product.quantity <= 5))
  );

  const handleProductClick = (product: Product) => {
    const isFromExpense = location.state === 'expense';
    if (isFromExpense) {
      setSelectedProduct(product);
      setShowQuantityModal(true);
    } else {
      navigate(`/warehouse/product/${product.id}`);
    }
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folder: ProductFolder) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      folder
    });
  };

  const handleContextMenu = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    setSelectedProduct(product);
    setShowActionsModal(true);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);


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
        {/* Шапка */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/warehouse')}>
                  <Menu className="w-6 h-6 text-gray-600 lg:hidden" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Товары</h1>
              </div>
              <div className="flex items-center gap-3">
                <SortAsc className="w-6 h-6 text-gray-600" />
                <div className="w-px h-6 bg-gray-200" />
                <button className="p-2">
                  <Menu className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Подзаголовок */}
            <div className="px-4 py-2 bg-gray-50 border-t border-b">
              <p className="text-gray-600 text-sm">Основной склад</p>
            </div>

            {/* Поиск */}
            <div className="p-4">
              <div className="space-y-4">
                <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLowStock}
                      onChange={(e) => setShowLowStock(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Показать товары с остатком менее 5 шт
                    </span>
                  </label>
                </div>
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
          ) : (
            <div className="space-y-4">
              {/* Папки */}
              {folders.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className={`${folder.color} bg-opacity-10 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all`}
                      onContextMenu={(e) => handleFolderContextMenu(e, folder)}
                      onClick={() => navigate(`/warehouse/folders/${folder.id}`)}
                    >
                      <div className="flex items-center justify-center mb-3">
                        {folder.image ? (
                          <img
                            src={folder.image}
                            alt={folder.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className={`w-12 h-12 ${folder.color} rounded-lg flex items-center justify-center`}>
                            <Folder className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-center text-sm font-medium text-gray-900 truncate">
                        {folder.name}
                      </h3>
                    </div>
                  ))}
                </div>
              )}

              {/* Товары */}
              <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setIsAllProductsExpanded(!isAllProductsExpanded)}>
                <h3 className="font-medium text-gray-900">Товары со всех складов ({filteredProducts.length})</h3>
                <button className="p-1 hover:bg-gray-100 rounded-full transition-transform duration-200">
                  {isAllProductsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              {isAllProductsExpanded && filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                  onClick={() => handleProductClick(product)}
                  onContextMenu={(e) => handleContextMenu(e, product)}
                  style={{
                    borderLeft: typeof product.quantity === 'number' && product.quantity <= 5 ? '4px solid #EF4444' : 'none',
                    paddingLeft: typeof product.quantity === 'number' && product.quantity <= 5 ? '8px' : '12px'
                  }}
                >
                  <div className="flex items-center py-2 px-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                      <p className="text-xs text-gray-500">
                        {product.category}
                        {typeof product.quantity === 'number' && product.quantity <= 5 && (
                          <span className="ml-2 text-red-500">
                            Мало на складе!
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-base font-medium ${
                        (typeof product.quantity === 'number' && product.quantity <= 5) ? 'text-red-600' : 'text-gray-900'
                      }`}>
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

        {/* Нижняя панель */}
        <div className="fixed bottom-0 inset-x-0 bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Всего товаров: {products.length}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg"
              >
                <span className="text-2xl">+</span>
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
        
        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={() => setShowCreateFolderModal(false)}
        />

        {contextMenu && (
          <FolderContextMenu
            folder={contextMenu.folder}
            position={{ x: contextMenu.x, y: contextMenu.y }}
            onClose={() => setContextMenu(null)}
            onMove={() => {
              setSelectedFolder(contextMenu.folder);
              setShowMoveModal(true);
            }}
            onEdit={() => {
              setSelectedFolder(contextMenu.folder);
              setShowEditFolderModal(true);
            }}
            onDelete={() => {
              setSelectedFolder(contextMenu.folder);
              setShowDeleteFolderModal(true);
            }}
          />
        )}

        {selectedFolder && showMoveModal && (
          <MoveFolderModal
            isOpen={showMoveModal}
            onClose={() => {
              setShowMoveModal(false);
              setSelectedFolder(null);
            }}
            folder={selectedFolder}
          />
        )}

        {selectedFolder && (
          <>
            <EditFolderModal
              isOpen={showEditFolderModal}
              onClose={() => {
                setShowEditFolderModal(false);
                setSelectedFolder(null);
              }}
              folder={selectedFolder}
            />

            <DeleteFolderModal
              isOpen={showDeleteFolderModal}
              onClose={() => {
                setShowDeleteFolderModal(false);
                setSelectedFolder(null);
              }}
              folder={selectedFolder}
            />
          </>
        )}
      </div>
    </Scrollbars>
  );
};