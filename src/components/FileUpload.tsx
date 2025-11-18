import React, { useState } from 'react';
import { Paperclip, X, Image as ImageIcon, File } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { showErrorNotification, showSuccessNotification } from '../utils/notifications';

const BUCKET_NAME = 'attachments';

interface FileUploadProps {
  onFileUpload: (fileData: { url: string; type: string; name: string }) => void;
  onRemoveFile: (url: string) => void;
  files: Array<{ url: string; type: string; name: string }>;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  onRemoveFile,
  files
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorNotification('Размер файла не должен превышать 5MB');
      return;
    }

    try {
      setUploading(true);
      const fileId = uuidv4();
      const fileExtension = file.name.split('.').pop();
      const filePath = `${fileId}.${fileExtension}`;

      // Загружаем файл в Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Получаем публичный URL файла
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      onFileUpload({
        url: publicUrl,
        type: file.type,
        name: file.name
      });

      // Показываем уведомление об успешной загрузке
      showSuccessNotification(`Файл ${file.name} успешно загружен`);
    } catch (error) {
      console.error('Error uploading file:', error);
      showErrorNotification('Ошибка при загрузке файла');
    } finally {
      setUploading(false);
      // Очищаем input после загрузки
      e.target.value = '';
    }
  };

  const handleRemoveFile = async (url: string) => {
    try {
      // Извлекаем имя файла из URL, используя последний сегмент после /attachments/
      const matches = url.match(/\/attachments\/([^?]+)/);
      if (!matches || !matches[1]) {
        throw new Error('Invalid file URL');
      }
      const fileName = decodeURIComponent(matches[1]);
      
      // Удаляем файл из Supabase Storage
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        throw error;
      }

      onRemoveFile(url);
      // Показываем уведомление об успешном удалении
      showSuccessNotification('Файл успешно удален');
    } catch (error) {
      console.error('Error removing file:', error);
      showErrorNotification('Ошибка при удалении файла');
    }
  };

  return (
    <div className="relative">
      <div className="absolute right-2 bottom-2 z-10">
        <label className="cursor-pointer p-2 text-gray-400 hover:text-gray-600">
          <Paperclip className="w-5 h-5" />
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            disabled={uploading}
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="absolute right-2 top-2 z-10 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-white/90 backdrop-blur-sm shadow-sm rounded p-1 pr-6 border border-gray-200"
            >
              <div className="flex items-center gap-1">
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                ) : (
                  <File className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-xs text-gray-600 truncate max-w-[150px]">
                  {file.name}
                </span>
              </div>
              <button
                onClick={() => handleRemoveFile(file.url)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
