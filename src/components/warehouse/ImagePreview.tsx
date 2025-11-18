import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface ImagePreviewProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `product-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div className="relative w-full h-full flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 bg-black bg-opacity-50">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleZoomIn}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="Увеличить"
            >
              <ZoomIn className="w-6 h-6" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="Уменьшить"
            >
              <ZoomOut className="w-6 h-6" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              title="Скачать"
            >
              <Download className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            title="Закрыть"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={imageUrl}
              alt="Product preview"
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${scale})` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};