import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { pdfjs } from '../lib/pdfjs';

interface FilePreviewProps {
  url: string;
  type: string;
  className?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ url, type, className = '' }) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const generatePreview = async () => {
      try {
        if (type.startsWith('image/')) {
          setPreviewUrl(url);
          return;
        }
        
        if (type === 'application/pdf') {
          // Загружаем PDF как массив байтов
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error('Failed to fetch PDF');
          }
          
          const pdfData = await response.arrayBuffer();
          
          // Загружаем PDF документ
          const loadingTask = pdfjs.getDocument({ data: pdfData });
          const pdf = await loadingTask.promise;
          
          // Получаем первую страницу
          const page = await pdf.getPage(1);
          
          // Настраиваем размер превью
          const viewport = page.getViewport({ scale: 0.5 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) {
            throw new Error('Failed to get canvas context');
          }
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          try {
            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;
            
            setPreviewUrl(canvas.toDataURL());
            setError(false);
          } catch (renderError) {
            console.error('Error rendering PDF page:', renderError);
            throw renderError;
          }
        }
      } catch (err) {
        console.error('Error generating preview:', err);
        setError(true);
        
        // Пробуем повторить попытку через 1 секунду, максимум 3 раза
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000);
        }
      }
    };

    generatePreview();
  }, [url, type, retryCount]);

  if (error || (!type.startsWith('image/') && type !== 'application/pdf')) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <FileText className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  if (!previewUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 animate-pulse ${className}`}>
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <img
        src={previewUrl}
        alt="Preview"
        className="w-full h-full object-cover rounded-lg"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg" />
    </div>
  );
};
