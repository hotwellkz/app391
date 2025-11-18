import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthGuard } from './components/auth/AuthGuard';
import { AdminRoute } from './components/auth/AdminRoute';
import { ApprovalGuard } from './components/auth/ApprovalGuard';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Feed } from './pages/Feed';
import DailyReport from './pages/DailyReport';
import { Clients } from './pages/Clients';
import { Admin } from './pages/Admin';
import { ContractTemplates } from './pages/ContractTemplates';
import { Products } from './pages/Products';
import { Transactions } from './pages/Transactions';
import { WarehouseProducts } from './pages/warehouse/products/WarehouseProducts';
import { Employees } from './pages/Employees';
import { FolderProducts } from './pages/warehouse/products/FolderProducts';
import { ProductDetails } from './pages/warehouse/products/ProductDetails';
import { Calculator } from './pages/Calculator';
import { Documents } from './pages/warehouse/Documents';
import { ClientFiles } from './pages/ClientFiles';
import { AllClientFiles } from './pages/AllClientFiles';
import { Warehouse } from './pages/Warehouse';
import { NewIncome } from './pages/warehouse/NewIncome';
import { NewExpense } from './pages/warehouse/NewExpense';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { OptimizedTransactionHistoryPage } from './pages/OptimizedTransactionHistoryPage';
import { Profile } from './pages/Profile';
import { useStats } from './hooks/useStats';
import { LoadingSpinner } from './components/LoadingSpinner';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';
import WhatsApp from './pages/WhatsApp';
import { Toaster } from 'react-hot-toast';
import './styles/animations.css';
import { CreateTemplate } from './pages/CreateTemplate';
import { EditTemplate } from './pages/EditTemplate';
import { CreateContractWithAdditionalWorks } from './pages/CreateContractWithAdditionalWorks';
import { FinishingMaterialsManager } from './components/materials/FinishingMaterialsManager';
import { MenuVisibilityProvider } from './contexts/MenuVisibilityContext';

type Page = 'dashboard' | 'transactions' | 'feed' | 'daily-report' | 'clients' | 'templates' | 
  'products' | 'employees' | 'projects' | 'calculator' | 'warehouse' | 'chat' | 'finishing-materials';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('transactions');
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const { stats } = useStats();
  const navigate = useNavigate();

  // Слушаем изменения в localStorage для синхронизации состояния collapsed
  useEffect(() => {
    const handleStorageChange = () => {
      setCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Также слушаем изменения внутри того же окна
    const checkCollapsedState = () => {
      const currentState = localStorage.getItem('sidebar-collapsed') === 'true';
      if (currentState !== collapsed) {
        setCollapsed(currentState);
      }
    };

    const interval = setInterval(checkCollapsedState, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [collapsed]);

  return (
    <div className="flex w-full h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar onPageChange={setCurrentPage} currentPage={currentPage} />
      
      {/* Основной контент */}
      <main className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header 
          stats={stats} 
          onPageChange={(page) => {
            navigate(`/${page}`);
            setCurrentPage(page as Page);
          }} 
        />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/transactions" replace />} />
            <Route path="/admin" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
            <Route path="/daily-report" element={<DailyReport />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/client-files" element={<AllClientFiles />} />
            <Route path="/clients/:clientId/files" element={<ClientFiles />} />
            <Route path="/transactions" element={
              <ApprovalGuard>
                <Transactions />
              </ApprovalGuard>
            } />
            <Route path="/transactions/history/:id" element={
              <ApprovalGuard>
                <OptimizedTransactionHistoryPage />
              </ApprovalGuard>
            } />
            <Route path="/feed" element={
              <ApprovalGuard>
                <Feed />
              </ApprovalGuard>
            } />
            <Route path="/templates" element={
              <ApprovalGuard>
                <ContractTemplates />
              </ApprovalGuard>
            } />
            <Route path="/templates/create" element={<CreateTemplate />} />
            <Route path="/templates/:id/edit" element={<EditTemplate />} />
            <Route path="/templates/:id/create-with-additional" element={<CreateContractWithAdditionalWorks />} />
            <Route path="/products" element={
              <ApprovalGuard>
                <Products />
              </ApprovalGuard>
            } />
            <Route path="/warehouse/products" element={
              <ApprovalGuard>
                <WarehouseProducts />
              </ApprovalGuard>
            } />
            <Route path="/warehouse/products/:folderId" element={
              <ApprovalGuard>
                <FolderProducts />
              </ApprovalGuard>
            } />
            <Route path="/warehouse/product/:id" element={
              <ApprovalGuard>
                <ProductDetails />
              </ApprovalGuard>
            } />
            <Route path="/warehouse/products/:folderId/:productId" element={
              <ApprovalGuard>
                <ProductDetails />
              </ApprovalGuard>
            } />
            <Route path="/employees" element={
              <ApprovalGuard>
                <Employees />
              </ApprovalGuard>
            } />
            <Route path="/calculator" element={
              <ApprovalGuard>
                <Calculator />
              </ApprovalGuard>
            } />
            <Route path="/warehouse" element={
              <ApprovalGuard>
                <Warehouse />
              </ApprovalGuard>
            } />
            <Route path="/warehouse/income/new" element={
              <ApprovalGuard>
                <NewIncome />
              </ApprovalGuard>
            } />
            <Route path="/warehouse/expense/new" element={
              <ApprovalGuard>
                <NewExpense />
              </ApprovalGuard>
            } />
            <Route path="/warehouse/documents" element={
              <ApprovalGuard>
                <Documents />
              </ApprovalGuard>
            } />
            <Route path="/warehouse/transactions/:productId" element={
              <ApprovalGuard>
                <TransactionHistoryPage />
              </ApprovalGuard>
            } />
            <Route path="/whatsapp" element={
              <ApprovalGuard>
                <WhatsApp />
              </ApprovalGuard>
            } />
            <Route path="/finishing-materials" element={
              <ApprovalGuard>
                <FinishingMaterialsManager />
              </ApprovalGuard>
            } />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <HelmetProvider>
      <Router>
        <AuthGuard>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#ffffff',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                fontSize: '0.875rem',
              },
              success: {
                style: {
                  background: '#f0fdf4',
                  border: '1px solid #dcfce7',
                  color: '#166534',
                },
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#ffffff',
                },
              },
              error: {
                style: {
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  color: '#991b1b',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
                duration: 4000,
              },
            }}
          />
          <MenuVisibilityProvider>
            <AppContent />
          </MenuVisibilityProvider>
        </AuthGuard>
      </Router>
    </HelmetProvider>
  );
};

export default App;