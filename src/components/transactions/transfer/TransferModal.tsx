import React, { useState, useCallback } from 'react';
import { CategoryCardType } from '../../../types';
import { transferFunds } from '../../../lib/firebase/transactions';
import { showErrorNotification, showSuccessNotification } from '../../../utils/notifications';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../../../lib/supabase/config';
import { PaperclipIcon, SendHorizontal } from 'lucide-react';

interface TransferModalProps {
  sourceCategory: CategoryCardType;
  targetCategory: CategoryCardType;
  isOpen: boolean;
  onClose: () => void;
}

interface FileUpload {
  file: File;
  progress: number;
  url?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  sourceCategory,
  targetCategory,
  isOpen,
  onClose
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSalary, setIsSalary] = useState(false);
  const [isCashless, setIsCashless] = useState(false);

  // Функция для форматирования числа с разделителями
  const formatNumber = (value: string) => {
    // Убираем все пробелы и буквы, оставляем только цифры и точку
    const numbers = value.replace(/[^\d.]/g, '');
    
    // Разделяем на целую и дробную части
    const parts = numbers.split('.');
    const wholePart = parts[0];
    const decimalPart = parts[1];

    // Форматируем целую часть, добавляя пробелы
    const formattedWholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    // Возвращаем отформатированное число
    return decimalPart !== undefined 
      ? `${formattedWholePart}.${decimalPart}`
      : formattedWholePart;
  };

  // Функция для очистки форматирования перед отправкой
  const cleanNumber = (value: string) => {
    return value.replace(/\s/g, '');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatNumber(value);
    setAmount(formatted);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Accepted files:', acceptedFiles);
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedAmount = cleanNumber(amount);
    if (!cleanedAmount || parseFloat(cleanedAmount) <= 0) {
      setError('Сумма должна быть больше нуля');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Загружаем файлы в Supabase Storage
      const uploadedFiles = await Promise.all(
        files.map(async ({ file }, index) => {
          const timestamp = Date.now();
          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const path = `transactions/${sourceCategory.id}/${timestamp}-${safeName}`;
          
          try {
            console.log('Uploading file:', { name: file.name, path });
            const { data, error } = await supabase.storage
              .from('transactions')
              .upload(path, file, {
                cacheControl: '3600',
                upsert: true
              });

            if (error) {
              console.error('Supabase upload error:', error);
              throw error;
            }

            if (!data?.path) {
              throw new Error('Upload successful but no path returned');
            }

            // Получаем публичный URL файла
            const { data: { publicUrl } } = supabase.storage
              .from('transactions')
              .getPublicUrl(data.path);

            console.log('File uploaded successfully:', publicUrl);
            
            // Обновляем прогресс
            setFiles(prev => 
              prev.map((f, i) => 
                i === index ? { ...f, progress: 100 } : f
              )
            );

            return {
              name: file.name,
              url: publicUrl,
              type: file.type,
              size: file.size,
              path: data.path
            };
          } catch (error) {
            console.error('Error uploading file:', error);
            showErrorNotification(`Ошибка при загрузке файла ${file.name}: ${error.message}`);
            throw error;
          }
        })
      );

      // Выполняем перевод с прикрепленными файлами
      await transferFunds({
        sourceCategory,
        targetCategory,
        amount: parseFloat(cleanedAmount),
        description,
        attachments: uploadedFiles,
        waybillNumber: '',
        waybillData: {},
        isSalary,
        isCashless
      });

      showSuccessNotification('Перевод успешно выполнен');
      onClose();
    } catch (error) {
      console.error('Error in transfer:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при переводе');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg w-full max-w-lg md:mt-0 mt-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-medium">Перевод средств</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="mb-6 space-y-1 sticky top-[72px] bg-white z-10 pb-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">От: {sourceCategory.title}</span>
              <span className="text-gray-600">Кому: {targetCategory.title}</span>
            </div>
            <div className="text-sm text-gray-500">
              Текущий баланс: {formatNumber(sourceCategory.amount.toString())}₸
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сумма перевода
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={handleAmountChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1 000 000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Комментарий к переводу
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Укажите назначение перевода"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={isSalary}
                  onChange={(e) => setIsSalary(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">ЗП</span>
              </label>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={isCashless}
                  onChange={(e) => setIsCashless(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">Безнал</span>
              </label>
              
              {/* Мобильные кнопки */}
              <div className="md:hidden flex items-center gap-4 ml-auto">
                <button
                  type="button"
                  {...getRootProps()}
                  className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 rounded-full"
                >
                  <PaperclipIcon className="h-5 w-5" />
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`p-2 text-white rounded-full
                    ${loading
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                >
                  <SendHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Десктопная версия кнопок */}
            <div className="hidden md:block">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Прикрепить файлы
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                    p-4`}
                >
                  <input {...getInputProps()} />
                  {/* Desktop и планшетная версия */}
                  <div className="hidden md:flex flex-col items-center justify-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="mt-1 text-sm text-gray-600">
                      Перетащите файлы сюда или нажмите для выбора
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Поддерживаются изображения, PDF и документы Word (до 10MB)
                    </p>
                  </div>
                  {/* Мобильная версия */}
                  <div className="md:hidden flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Десктопная кнопка отправки */}
              <div className="hidden md:flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 text-white font-medium rounded-lg
                    ${loading
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                >
                  {loading ? 'Выполняется...' : 'Выполнить перевод'}
                </button>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={file.file.name + index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.file.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {(file.file.size / 1024).toFixed(1)} KB
                      </p>
                      {file.progress > 0 && (
                        <div className="mt-1">
                          <div className="bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {file.progress}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-500">{error}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
