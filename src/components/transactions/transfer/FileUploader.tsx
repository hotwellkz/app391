import React from 'react';
import { Upload, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  selectedFiles: File[];
  uploadProgress: { [key: string]: number };
  onDrop: (acceptedFiles: File[]) => void;
  onRemoveFile: (index: number) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  selectedFiles,
  uploadProgress,
  onDrop,
  onRemoveFile
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // Разрешаем все типы файлов
    accept: undefined,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Прикрепить файлы
      </label>
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 scale-[0.99]' 
            : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <Upload className={`w-10 h-10 mb-3 transition-colors duration-200 ${
            isDragActive ? 'text-blue-500' : 'text-gray-400'
          }`} />
          <p className="text-sm text-center">
            {isDragActive ? (
              <span className="text-blue-600 font-medium">Отпустите файлы здесь</span>
            ) : (
              <span className="text-gray-600">
                Перетащите файлы или <span className="text-blue-600">нажмите для выбора</span>
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Поддерживаются все типы файлов (до 10MB)
          </p>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2 mt-4">
          {selectedFiles.map((file, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </span>
                <span className="text-xs text-gray-500 ml-2 shrink-0">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveFile(index)}
                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-white transition-all opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload Progress */}
      {Object.entries(uploadProgress).map(([fileName, progress]) => (
        <div key={fileName} className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-700 truncate max-w-[80%]">
              {fileName}
            </span>
            <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      ))}
    </div>
  );
};