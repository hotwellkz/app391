import React, { useState } from 'react';
import { X, Upload, QrCode, Barcode } from 'lucide-react';
import { ColorSelector } from '../ColorSelector';
import { ImageUpload } from './ImageUpload';
import { BarcodeGenerator } from './BarcodeGenerator';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose
}) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-emerald-500');
  const [image, setImage] = useState<string | null>(null);
  const [showBarcodes, setShowBarcodes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedWarehouses] = useState(['main']); // В будущем здесь будет выбор складов

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showErrorNotification('Введите название папки');
      return;
    }

    setLoading(true);
    try {
      const folderId = Math.random().toString(36).substr(2, 9);
      
      await addDoc(collection(db, 'productFolders'), {
        name: name.trim(),
        color: selectedColor,
        image: image,
        warehouses: selectedWarehouses,
        barcode: folderId,
        createdAt: serverTimestamp()
      });

      showSuccessNotification('Папка успешно создана');
      onClose();
    } catch (error) {
      console.error('Error creating folder:', error);
      showErrorNotification('Ошибка при создании папки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Создать папку</h2>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Штрих-коды
            </label>
            <button
              type="button"
              onClick={() => setShowBarcodes(!showBarcodes)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Barcode className="w-5 h-5" />
              <QrCode className="w-5 h-5" />
              {showBarcodes ? 'Скрыть штрих-коды' : 'Показать штрих-коды'}
            </button>
          </div>

          {showBarcodes && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Штрих-код</h3>
                <BarcodeGenerator
                  value={Math.random().toString(36).substr(2, 9)}
                  type="barcode"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">QR-код</h3>
                <BarcodeGenerator
                  value={Math.random().toString(36).substr(2, 9)}
                  type="qrcode"
                />
              </div>
            </div>
          )}

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
              {loading ? 'Создание...' : 'Создать папку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};