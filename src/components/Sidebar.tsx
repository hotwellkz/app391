import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../lib/firebase/auth';
import { 
  ArrowLeftRight, 
  ScrollText,
  Shield,
  Receipt, 
  FileText,
  Users,
  Menu,
  X,
  Package,
  Building2,
  Calculator,
  Warehouse,
  LogOut,
  User,
  MessageSquare,
  Folder,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useUnapprovedCount } from '../hooks/useUnapprovedCount';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useMenuVisibility } from '../contexts/MenuVisibilityContext';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive?: boolean;
}

interface SidebarProps {
  onPageChange: (page: 'dashboard' | 'transactions' | 'feed' | 'daily-report' | 'clients' | 'templates' | 'products' | 'employees' | 'projects' | 'calculator' | 'chat' | 'warehouse') => void;
  currentPage: string;
}

interface MenuItemComponentProps {
  item: MenuItem;
  onClick: () => void;
  collapsed: boolean;
}

const MenuItemComponent: React.FC<MenuItemComponentProps> = ({ item, onClick, collapsed }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => collapsed && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`w-full flex items-center px-4 py-3 my-1 rounded-lg text-gray-700 transition-all duration-200 group relative ${
          item.isActive 
            ? 'bg-emerald-50 text-emerald-600 shadow-sm' 
            : 'hover:bg-gray-50'
        } ${collapsed ? 'justify-center' : 'justify-start'}`}
      >
        {item.isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full" />
        )}
        <span className={`transition-transform duration-200 group-hover:scale-110 ${
          item.isActive ? 'text-emerald-600' : 'text-emerald-500'
        } ${collapsed ? 'mx-auto' : ''}`}>
          {item.icon}
        </span>
        {!collapsed && (
          <span className={`ml-3 text-sm font-medium transition-colors duration-200 ${
            item.isActive ? 'text-emerald-600' : 'text-gray-700 group-hover:text-emerald-600'
          }`}>
            {item.label}
          </span>
        )}
      </button>
      
      {/* Tooltip для collapsed режима */}
      {collapsed && showTooltip && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-2 py-1 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap opacity-95 pointer-events-none">
          {item.label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ onPageChange, currentPage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const unapprovedCount = useUnapprovedCount();
  const { isMenuVisible } = useMenuVisibility();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().role === 'admin');
        }
      }
    };

    checkAdminStatus();
  }, []);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', newState.toString());
  };

  const menuItems: MenuItem[] = [
    { 
      icon: <ArrowLeftRight size={20} />, 
      label: 'Транзакции', 
      path: '/transactions',
      isActive: location.pathname === '/transactions'
    },
    { 
      icon: <ScrollText size={20} />, 
      label: 'Лента', 
      path: '/feed',
      isActive: location.pathname === '/feed'
    },
    { 
      icon: <Users size={20} />, 
      label: 'Клиенты', 
      path: '/clients',
      isActive: location.pathname === '/clients'
    },
    { 
      icon: <Folder size={20} />,
      label: 'Файлы клиентов',
      path: '/client-files',
      isActive: location.pathname === '/client-files' || location.pathname.includes('/clients/') && location.pathname.includes('/files')
    },
    { 
      icon: <FileText className="w-5 h-5" />, 
      label: 'Шаблоны договоров', 
      path: '/templates',
      isActive: location.pathname === '/templates'
    },
    { 
      icon: <Package className="w-5 h-5" />, 
      label: 'Товары и цены', 
      path: '/products',
      isActive: location.pathname === '/products'
    },
    { 
      icon: <Users className="w-5 h-5" />, 
      label: 'Сотрудники', 
      path: '/employees',
      isActive: location.pathname === '/employees'
    },
    { 
      icon: <Calculator className="w-5 h-5" />, 
      label: 'Калькулятор', 
      path: '/calculator',
      isActive: location.pathname === '/calculator'
    },
    { 
      icon: <Warehouse className="w-5 h-5" />, 
      label: 'Склад', 
      path: '/warehouse',
      isActive: location.pathname === '/warehouse'
    },
    { 
      icon: <MessageSquare className="w-5 h-5" />, 
      label: 'WhatsApp', 
      path: '/whatsapp',
      isActive: location.pathname === '/whatsapp'
    }
  ];

  const handleMenuItemClick = (item: MenuItem) => {
    navigate(item.path);
    const pageKey = item.path.replace('/', '') || 'transactions';
    if (pageKey === 'client-files') {
      onPageChange('clients');
    } else {
      onPageChange(pageKey as any);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Мобильная кнопка */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`fixed top-4 left-4 z-[60] lg:hidden bg-white p-2 rounded-lg shadow-lg mt-2 hover:bg-gray-50 transition-all duration-200 ${
          !isMenuVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-600" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Мобильная подложка */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[45] lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Мобильный Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-[50] transform transition-all duration-300 ease-in-out lg:hidden border-r border-gray-100">
          <div className="flex flex-col h-full">
            <div className="h-20" />
            
            <div className="flex-1 overflow-y-auto py-4 px-2">
              {menuItems.map((item, index) => (
                <MenuItemComponent
                  key={index}
                  item={item}
                  onClick={() => handleMenuItemClick(item)}
                  collapsed={false}
                />
              ))}
            </div>
            
            {/* Нижняя секция для мобильного */}
            <div className="border-t border-gray-100 p-4 bg-gray-50 bg-opacity-50 backdrop-blur-sm">
              <div className="flex flex-col space-y-3">
                {isAdmin && (
                  <button
                    onClick={() => {
                      navigate('/admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative ${
                      location.pathname === '/admin'
                        ? 'text-emerald-600 bg-emerald-50 shadow-sm'
                        : 'text-gray-600 hover:text-emerald-600 hover:bg-white'
                    }`}
                  >
                    <Shield className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                    <span className="ml-3">Администратор</span>
                    {unapprovedCount > 0 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center animate-pulse">
                        {unapprovedCount}
                      </span>
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => {
                    navigate('/profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-white rounded-lg transition-all duration-200 group px-4 py-2"
                >
                  <User className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                  <span>Сменить пароль</span>
                </button>
                
                <button
                  onClick={() => auth.signOut()}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 group px-4 py-2"
                >
                  <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                  <span>Выйти</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Десктопный Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white shadow-xl border-r border-gray-100 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Кнопка сворачивания */}
        <div className={`flex ${collapsed ? 'justify-center' : 'justify-end'} p-2`}>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-800"
            title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-2">
          {menuItems.map((item, index) => (
            <MenuItemComponent
              key={index}
              item={item}
              onClick={() => handleMenuItemClick(item)}
              collapsed={collapsed}
            />
          ))}
        </div>
        
        {/* Нижняя секция */}
        <div className="border-t border-gray-100 p-4 bg-gray-50 bg-opacity-50 backdrop-blur-sm">
          <div className="flex flex-col space-y-3">
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => {
                    navigate('/admin');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative ${
                    location.pathname === '/admin'
                      ? 'text-emerald-600 bg-emerald-50 shadow-sm'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-white'
                  } ${collapsed ? 'justify-center px-2' : 'px-4'}`}
                >
                  <Shield className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                  {!collapsed && <span className="ml-3">Администратор</span>}
                  {unapprovedCount > 0 && !collapsed && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center animate-pulse">
                      {unapprovedCount}
                    </span>
                  )}
                  {unapprovedCount > 0 && collapsed && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                      {unapprovedCount}
                    </span>
                  )}
                  
                  {/* Tooltip для collapsed режима */}
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-2 py-1 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-95 transition-opacity duration-200">
                    Администратор
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                </button>
              </div>
            )}
            
            <div className="relative">
              <button
                onClick={() => {
                  navigate('/profile');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-white rounded-lg transition-all duration-200 group ${
                  collapsed ? 'justify-center p-2' : 'px-4 py-2'
                }`}
              >
                <User className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                {!collapsed && <span>Сменить пароль</span>}
                
                {/* Tooltip для collapsed режима */}
                {collapsed && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-2 py-1 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-95 transition-opacity duration-200">
                    Сменить пароль
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                )}
              </button>
            </div>
            
            <div className="relative">
              <button
                onClick={() => auth.signOut()}
                className={`flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 group ${
                  collapsed ? 'justify-center p-2' : 'px-4 py-2'
                }`}
              >
                <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                {!collapsed && <span>Выйти</span>}
                
                {/* Tooltip для collapsed режима */}
                {collapsed && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-2 py-1 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-95 transition-opacity duration-200">
                    Выйти
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};