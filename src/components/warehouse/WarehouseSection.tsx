import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Package, History, QrCode, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Product } from '../../types/warehouse';
import { useNavigate } from 'react-router-dom';

interface WarehouseSectionProps {
  title: string;
  subtitle: string;
  products: Product[];
  onContextMenu: (e: React.MouseEvent, product: Product) => void;
  onProductClick: (product: Product) => void;
  onViewHistory: (product: Product) => void;
  onViewQRCode: (product: Product) => void;
  warehouse: 'all' | '1' | '2' | '3';
}

export const WarehouseSection: React.FC<WarehouseSectionProps> = ({
  title,
  subtitle,
  products,
  onContextMenu,
  onProductClick,
  onViewHistory,
  onViewQRCode,
  warehouse
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleContextMenu = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, product);
  };

  const handleProductClick = (product: Product) => {
    navigate(`/warehouse/product/${product.id}`);
  };

  const getStatusColor = () => {
    switch (warehouse) {
      case 'all':
        return 'text-purple-500';
      case '1':
        return 'text-emerald-500';
      case '2':
        return 'text-amber-500';
      case '3':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getBadgeColor = () => {
    switch (warehouse) {
      case 'all':
        return 'bg-purple-100 text-purple-600';
      case '1':
        return 'bg-emerald-100 text-emerald-600';
      case '2':
        return 'bg-amber-100 text-amber-600';
      case '3':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div>
      <div
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight className={`w-5 h-5 ${getStatusColor()}`} />
          ) : (
            <ChevronDown className={`w-5 h-5 ${getStatusColor()}`} />
          )}
          <Package className={`w-5 h-5 ${getStatusColor()}`} />
          <h3 className="font-medium text-gray-900">
            {title} ({products.length})
          </h3>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full ${getBadgeColor()}`}>
          {subtitle}
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-0.5">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-white hover:bg-gray-50 border rounded-lg cursor-pointer transition-colors"
              onClick={() => handleProductClick(product)}
              onContextMenu={(e) => handleContextMenu(e, product)}
            >
              {/* Мобильная версия */}
              <div className="sm:hidden p-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {product.name}
                      </span>
                      {product.quantity <= (product.minQuantity || 5) && (
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{product.category || '—'}</span>
                      <span className="text-xs font-medium text-emerald-600">
                        {product.quantity} {product.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/warehouse/income/new', { state: { addedProduct: { product, quantity: 1 } } });
                      }}
                      className="p-1.5 text-emerald-600"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/warehouse/expense/new', { state: { addedProduct: { product, quantity: 1 } } });
                      }}
                      className="p-1.5 text-red-600"
                    >
                      <ArrowDownRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewHistory(product);
                      }}
                      className="p-1.5 text-blue-600"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewQRCode(product);
                      }}
                      className="p-1.5 text-purple-600"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Десктопная версия */}
              <div className="hidden sm:flex items-center px-4 py-2">
                <div className="flex-1 grid grid-cols-[1fr,120px,100px] gap-4 items-center min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {product.name}
                    </span>
                    {product.quantity <= (product.minQuantity || 5) && (
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                    <span className="text-sm text-gray-500">{product.category || '—'}</span>
                  </div>
                  <div className="text-sm text-gray-900">
                    {product.quantity} {product.unit}
                  </div>
                  <div className="text-sm text-gray-500">
                    {product.averagePurchasePrice ? `${Math.floor(product.averagePurchasePrice).toLocaleString()} ₸` : '—'}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/warehouse/income/new', { state: { addedProduct: { product, quantity: 1 } } });
                    }}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                    title="Добавить в приход"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/warehouse/expense/new', { state: { addedProduct: { product, quantity: 1 } } });
                    }}
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
          ))}
        </div>
      )}
    </div>
  );
};