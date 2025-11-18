import React from 'react';
import { Package, ArrowUpRight, ArrowDownRight, History, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types/warehouse';

interface ProductListProps {
  products: Product[];
  onContextMenu: (e: React.MouseEvent, product: Product) => void;
  onProductClick: (product: Product) => void;
  onViewHistory: (product: Product) => void;
  onViewQRCode: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onContextMenu,
  onProductClick,
  onViewHistory,
  onViewQRCode
}) => {
  const navigate = useNavigate();

  const formatAmount = (amount: number): string => {
    if (typeof amount !== 'number') return '0 ₸';
    return amount.toLocaleString('ru-RU') + ' ₸';
  };

  const handleIncomeClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    navigate('/warehouse/income/new', { 
      state: { 
        addedProduct: {
          product,
          quantity: 1
        }
      }
    });
  };

  const handleExpenseClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    navigate('/warehouse/expense/new', {
      state: {
        addedProduct: {
          product,
          quantity: 1
        }
      }
    });
  };

  return (
    <div className="space-y-2">
      {products.map((product, index) => (
        <div
          key={product.id}
          className={`bg-white hover:bg-gray-50 border rounded-lg transition-colors cursor-pointer ${
            product.quantity <= 5 ? 'border-l-4 border-l-red-500' : ''
          }`}
          onClick={() => onProductClick(product)}
          onContextMenu={(e) => onContextMenu(e, product)}
        >
          <div className="p-2 sm:p-3">
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-3 w-8">#{String(index + 1).padStart(3, '0')}</span>
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                <Package className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                <p className="text-xs text-gray-500 truncate">
                  {product.category}
                  {product.quantity <= 5 && (
                    <span className="ml-2 text-red-500">Мало на складе!</span>
                  )}
                </p>
              </div>
              
              <div className="flex items-center gap-4 ml-4">
                <div className="text-right min-w-[100px]">
                  <span className="text-sm font-medium text-gray-900 block">
                    {formatAmount(product.averagePurchasePrice)}
                  </span>
                  <span className="text-xs text-emerald-600 font-medium block">
                    {formatAmount((product.quantity || 0) * (product.averagePurchasePrice || 0))}
                  </span>
                </div>
                
                <div className={`text-sm font-medium min-w-[80px] text-right ${
                  product.quantity <= 5 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {product.quantity} {product.unit}
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleIncomeClick(e, product)}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                    title="Добавить в приход"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleExpenseClick(e, product)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Добавить в расход"
                  >
                    <ArrowDownRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewHistory(product);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    title="История транзакций"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewQRCode(product);
                    }}
                    className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                    title="QR-код"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};