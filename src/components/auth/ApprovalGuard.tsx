import React from 'react';
import { useIsApproved } from '../../hooks/useIsApproved';
import { LoadingSpinner } from '../LoadingSpinner';

interface ApprovalGuardProps {
  children: React.ReactNode;
}

export const ApprovalGuard: React.FC<ApprovalGuardProps> = ({ children }) => {
  const { isApproved, loading } = useIsApproved();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ожидание подтверждения
            </h2>
            <p className="text-gray-600">
              Ваша учетная запись ожидает подтверждения администратором.
              Пожалуйста, подождите, пока администратор проверит и подтвердит ваш аккаунт.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
