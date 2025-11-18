import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ColorSelector } from '../ColorSelector';
import { ImageUpload } from './ImageUpload';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ProductFolder } from '../../types/warehouse';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';

interface EditFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: ProductFolder;
}

export const EditFolderModal: React.FC<EditFolderModalProps> = ({
  isOpen,
  onClose,
  folder
}) => {
  const [name, setName] = useState(folder.name);
  const [selectedColor, setSelectedColor] = useState(folder.color);
  const [image, setImage] = useState<string | null>(folder.image || null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showErrorNotification('Введите название папки');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'productFolders', folder.id), {
        name: name.trim(),
        color: selectedColor,
        image: image,
        updatedAt: new Date()
      });

      showSuccessNotification('Папка успешно обновлена');
      onClose();
    } catch (error) {
      console.error('Error updating folder:', error);
      showErrorNotification('Ошибка при обновлении папки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Редактировать папку</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название папки
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Введите название папки"
              required
            />
          </div>

          <ColorSelector
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
          />

          <ImageUpload
            image={image}
            onImageUpload={(url) => setImage(url)}
            onImageRemove={() => setImage(null)}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};