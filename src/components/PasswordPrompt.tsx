import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { showErrorNotification } from '../utils/notifications';
import { auth, getUserRole } from '../lib/firebase/auth';
import { LoadingSpinner } from './LoadingSpinner';

interface PasswordPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasswordPrompt: React.FC<PasswordPromptProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  useEffect(() => {
    const checkAdminAccess = async () => {
      const user = auth.currentUser;
      if (!user) {
        showErrorNotification('Необходимо войти в систему');
        onClose();
        return;
      }

      try {
        const role = await getUserRole(user.uid);
        if (role === 'admin') {
          onSuccess();
        } else {
          showErrorNotification('Доступ запрещен. Только для администраторов.');
          onClose();
        }
      } catch (error) {
        showErrorNotification('Ошибка при проверке прав доступа');
        onClose();
      }
    };

    if (isOpen) {
      checkAdminAccess();
    }
  }, [isOpen, onClose, onSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Проверка прав доступа</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 text-center">
          <LoadingSpinner />
          <p className="mt-2 text-gray-600">Проверка прав администратора...</p>
        </div>
      </div>
    </div>
  );
};