import React from 'react';
import { Navigate } from 'react-router-dom';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { showErrorNotification } from '../../utils/notifications';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    showErrorNotification('У вас нет прав для доступа к этой странице');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};