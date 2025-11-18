import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface FileUpload {
  file: File;
  progress: number;
  url?: string;
}

interface FileListProps {
  files: FileUpload[];
  onRemove: (index: number) => void;
}

export const FileList: React.FC<FileListProps> = ({ files, onRemove }) => {
  const getFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-2">
      {files.map((file, index) => (
        <div
          key={file.file.name + index}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex-1 min-w-0">
            <div className="flex justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.file.name}
              </p>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="ml-2 text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500">{getFileSize(file.file.size)}</p>
            {file.progress > 0 && file.progress < 100 && (
              <div className="mt-1">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{file.progress}%</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
