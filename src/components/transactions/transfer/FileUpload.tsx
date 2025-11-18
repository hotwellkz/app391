import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, PaperclipIcon } from 'lucide-react';

export interface FileUpload {
  file: File;
  progress: number;
  url?: string;
}

interface FileUploadProps {
  onUpload: (files: FileUpload[]) => void;
  mobileView?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, mobileView = false }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0
    }));
    onUpload(newFiles);
  }, [onUpload]);

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

  if (mobileView) {
    return (
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200">
          <PaperclipIcon className="w-5 h-5 text-gray-600" />
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center">
        <Upload className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          Перетащите файлы сюда или нажмите для выбора
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Поддерживаются изображения, PDF и документы Word (до 10MB)
        </p>
      </div>
    </div>
  );
};
