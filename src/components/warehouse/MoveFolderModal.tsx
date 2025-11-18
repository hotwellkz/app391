import React, { useState, useEffect } from 'react';
import { X, Folder } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ProductFolder } from '../../types/warehouse';
import { Product } from '../../types/warehouse';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';

interface MoveFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  folder?: ProductFolder;
}

export const MoveFolderModal: React.FC<MoveFolderModalProps> = ({
  isOpen,
  onClose,
  product,
  folder
}) => {
  const [folders, setFolders] = useState<ProductFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'productFolders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allFolders = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as ProductFolder[];
      
      // Фильтруем папки в зависимости от контекста
      const filteredFolders = allFolders.filter(f => {
        if (product) {
          // Для товара - исключаем текущую папку
          return f.id !== product.folderId;
        } else if (folder) {
          // Для папки - исключаем её саму и её подпапки
          return f.id !== folder.id && f.parentId !== folder.id;
        }
        return true;
      });
      
      setFolders(filteredFolders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [product?.folderId, folder?.id]);

  const handleMove = async (targetFolderId: string | null) => {
    try {
      if (product) {
        // Перемещение товара
        await updateDoc(doc(db, 'products', product.id), {
          folderId: targetFolderId,
          updatedAt: new Date()
        });
        showSuccessNotification('Товар успешно перемещен');
      } else if (folder) {
        // Перемещение папки
        await updateDoc(doc(db, 'productFolders', folder.id), {
          parentId: targetFolderId,
          updatedAt: new Date()
        });
        showSuccessNotification('Папка успешно перемещена');
      }
      
      onClose();
    } catch (error) {
      console.error('Error moving item:', error);
      showErrorNotification('Ошибка при перемещении');
    }
  };

  if (!isOpen) return null;

  const title = product ? 'Переместить товар' : 'Переместить папку';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">{title}</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-2">
            {/* Главная папка */}
            <button
              onClick={() => handleMove(null)}
              className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                <Folder className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-gray-700">Главная</span>
            </button>

            {/* Разделитель */}
            {folders.length > 0 && (
              <div className="my-4 border-t border-gray-200" />
            )}

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : folders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Нет доступных папок
              </div>
            ) : (
              <div className="space-y-2">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleMove(folder.id)}
                    className={`w-full flex items-center p-3 rounded-lg hover:bg-gray-50 ${
                      folder.color.replace('bg-', 'hover:bg-').replace('500', '100')
                    }`}
                  >
                    <div className={`w-10 h-10 ${folder.color} rounded-lg flex items-center justify-center mr-3`}>
                      <Folder className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-700">{folder.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};