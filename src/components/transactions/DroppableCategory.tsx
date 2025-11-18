import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CategoryCard } from './CategoryCard';
import { CategoryCardType } from '../../types';
import { ContextMenu } from '../ContextMenu';
import { PasswordPrompt } from '../PasswordPrompt';
import { EditPasswordModal } from '../EditPasswordModal';
import { EditCategoryModal } from '../EditCategoryModal';
import { useNavigate } from 'react-router-dom';
import { showErrorNotification } from '../../utils/notifications';
import { ClientTooltip } from './ClientTooltip';

/**
 * Определяет, можно ли редактировать категорию
 * Верхние цветные иконки (row === 1, 2, 4) - можно редактировать с паролем
 * Нижние синие иконки (row === 3) - нельзя редактировать
 */
const canEditCircle = (category: CategoryCardType): boolean => {
  // row === 3 (Проекты) - нельзя редактировать
  // row === 1 (Клиенты), row === 2 (Сотрудники), row === 4 (Склад) - можно редактировать
  return category.row !== 3;
};

interface DroppableCategoryProps {
  category: CategoryCardType;
  onEdit?: () => void;
  onDelete?: () => void;
  onHistoryClick?: () => void;
}

export const DroppableCategory: React.FC<DroppableCategoryProps> = ({
  category,
  onEdit,
  onDelete,
}) => {
  console.log('DroppableCategory получил onDelete:', !!onDelete, 'для категории:', category.title);
  const navigate = useNavigate();
  const { setNodeRef, isOver, active } = useDroppable({
    id: category.id,
    data: category
  });

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [isHistoryPasswordPromptOpen, setIsHistoryPasswordPromptOpen] = useState(false);
  const [showClientInfo, setShowClientInfo] = useState(false);

  const handleViewHistory = () => {
    // Проверяем, является ли это иконкой "ЗП Сот."
    if (category.title === 'ЗП Сот.') {
      setIsHistoryPasswordPromptOpen(true);
    } else {
      navigate(`/transactions/history/${category.id}`);
    }
    setShowContextMenu(false);
  };

  const handleHistoryPasswordSuccess = () => {
    setIsHistoryPasswordPromptOpen(false);
    navigate(`/transactions/history/${category.id}`);
  };

  const handleEdit = () => {
    setShowContextMenu(false);
    
    // Проверяем, можно ли редактировать эту категорию
    if (!canEditCircle(category)) {
      // Нижние синие иконки (row === 3) - нельзя редактировать
      showErrorNotification('Редактирование недоступно');
      return;
    }
    
    // Верхние цветные иконки - требуют пароль
    if (onEdit) {
      setShowPasswordPrompt(true);
    } else {
      showErrorNotification('Редактирование недоступно');
    }
  };

  const handleDelete = () => {
    console.log('Вызван handleDelete в DroppableCategory, onDelete =', !!onDelete);
    if (onDelete) {
      // Вызываем функцию удаления напрямую, без модального окна
      console.log('Вызываем onDelete в DroppableCategory');
      onDelete();
      setShowContextMenu(false);
    } else {
      console.log('Функция onDelete не передана, показываем уведомление');
      showErrorNotification('Удаление недоступно');
      setShowContextMenu(false);
    }
  };

  const handleViewClientInfo = () => {
    setShowClientInfo(true);
    setShowContextMenu(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const viewportWidth = window.innerWidth;
    const x = Math.min(e.clientX, viewportWidth - 200);
    setContextMenuPosition({ x, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleCloseContextMenu = () => {
    setShowContextMenu(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        className={`relative ${isOver && active ? 'ring-2 ring-emerald-500 rounded-lg' : ''}`}
        onContextMenu={handleContextMenu}
      >
        <CategoryCard
          category={category}
          onHistoryClick={handleViewHistory}
        />
      </div>

      {showContextMenu && (
        <ContextMenu
          position={contextMenuPosition}
          onClose={handleCloseContextMenu}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewHistory={handleViewHistory}
          onViewClientInfo={handleViewClientInfo}
          title={category.title}
          showClientInfo={category.title === "Projects"}
        />
      )}

      {showPasswordPrompt && onEdit && (
        <EditPasswordModal
          isOpen={showPasswordPrompt}
          onClose={() => setShowPasswordPrompt(false)}
          onSuccess={() => {
            setShowPasswordPrompt(false);
            setShowEditModal(true);
          }}
        />
      )}

      {showEditModal && (
        <EditCategoryModal
          category={category}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            // Обновляем данные после редактирования
            if (onEdit) {
              onEdit();
            }
          }}
        />
      )}

      {isHistoryPasswordPromptOpen && (
        <PasswordPrompt
          isOpen={isHistoryPasswordPromptOpen}
          onClose={() => setIsHistoryPasswordPromptOpen(false)}
          onSuccess={handleHistoryPasswordSuccess}
        />
      )}

      {showClientInfo && (
        <ClientTooltip
          objectName={category.title}
          show={showClientInfo}
          onClose={() => setShowClientInfo(false)}
        />
      )}
    </>
  );
};