import React from 'react';
import { ScrollText, Warehouse, ArrowLeftRight, MessageSquare, Users, RefreshCw } from 'lucide-react';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useMenuVisibility } from '../contexts/MenuVisibilityContext';
import ConnectionStatusIndicator from './ConnectionStatusIndicator';

interface StickyNavigationProps {
  onNavigate: (page: string) => void;
}

export const StickyNavigation: React.FC<StickyNavigationProps> = ({ onNavigate }) => {
  // Проверка текущего пути для отображения кнопки обновления только на странице транзакций
  const isTransactionsPage = window.location.pathname === '/transactions';
  const isWhatsAppPage = window.location.pathname === '/whatsapp';

  // Функция обновления транзакций
  const handleRefresh = () => {
    if (typeof (window as any).refreshTransactionsPage === 'function') {
      (window as any).refreshTransactionsPage();
    }
  };

  // Функция определения мобильного устройства
  const isMobileDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile'];
    const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
    const isMobileWidth = window.innerWidth <= 768;
    
    return isMobileUserAgent || isMobileWidth;
  };

  const { isAdmin } = useIsAdmin();
  const { isMenuVisible } = useMenuVisibility();

  // На мобильных устройствах применяем скрытие, на десктопе всегда видимы
  const shouldBeVisible = !isMobileDevice() || isMenuVisible;

  return (
    <div className={`fixed bottom-32 right-4 flex flex-col gap-3 z-50 transition-all duration-300 ease-in-out ${
      shouldBeVisible ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'
    }`}>
      {/* Индикатор соединения - только на странице WhatsApp */}
      {isWhatsAppPage && (
        <div className="p-3 bg-white rounded-full shadow-lg border border-gray-200">
          <ConnectionStatusIndicator />
        </div>
      )}
      
      {/* Кнопка обновить только на странице транзакций */}
      {isTransactionsPage && (
        <button
          onClick={handleRefresh}
          className="p-3 text-blue-600 hover:text-blue-900 bg-white rounded-full transition-colors duration-200 shadow-lg border border-blue-200"
          title="Обновить транзакции"
        >
          <RefreshCw className="w-5 h-5 animate-spin-on-hover" />
        </button>
      )}
      {isAdmin && (
        <button
          onClick={() => onNavigate('feed')}
          className="p-3 text-gray-700 hover:text-gray-900 bg-white rounded-full transition-colors duration-200 shadow-lg"
          title="Лента"
        >
          <ScrollText className="w-5 h-5" />
        </button>
      )}
      <button
        onClick={() => onNavigate('clients')}
        className="p-3 text-gray-700 hover:text-gray-900 bg-white rounded-full transition-colors duration-200 shadow-lg"
        title="Клиенты"
      >
        <Users className="w-5 h-5" />
      </button>
      <button
        onClick={() => onNavigate('warehouse')}
        className="p-3 text-gray-700 hover:text-gray-900 bg-white rounded-full transition-colors duration-200 shadow-lg"
        title="Склад"
      >
        <Warehouse className="w-5 h-5" />
      </button>
      <button
        onClick={() => onNavigate('transactions')}
        className="p-3 text-gray-700 hover:text-gray-900 bg-white rounded-full transition-colors duration-200 shadow-lg"
        title="Транзакции"
      >
        <ArrowLeftRight className="w-5 h-5" />
      </button>
      <button
        onClick={() => onNavigate('whatsapp')}
        className="p-3 text-gray-700 hover:text-gray-900 bg-white rounded-full transition-colors duration-200 shadow-lg"
        title="WhatsApp"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
    </div>
  );
};
