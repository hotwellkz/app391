import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ProductFolder } from '../../types/warehouse';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';

interface DeleteFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: ProductFolder;
}

export const DeleteFolderModal: React.FC<DeleteFolderModalProps> = ({
  isOpen,
  onClose,
  folder
}) => {
  const handleDelete = async () => {
    try {
      const batch = writeBatch(db);

      // Находим все товары в папке
      const productsQuery = query(
        collection(db, 'products'),
        where('folderId', '==', folder.id)
      );
      
      const productsSnapshot = await getDocs(productsQuery);
      
      // Перемещаем все товары в главную папку (удаляем folderId)
      productsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          folderId: null,
          updatedAt: new Date()
        });
      });

      // Удаляем саму папку
      batch.delete(doc(db, 'productFolders', folder.id));

      await batch.commit();
      showSuccessNotification('Папка успешно удалена');
      onClose();
    } catch (error) {
      console.error('Error deleting folder:', error);
      showErrorNotification('Ошибка при удалении папки');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
            <h2 className="text-lg font-medium">Удаление папки</h2>
          </div>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Вы уверены, что хотите удалить папку "{folder.name}"? Все товары из этой папки будут перемещены в основной каталог.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Отмена
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};