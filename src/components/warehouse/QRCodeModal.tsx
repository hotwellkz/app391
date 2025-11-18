import React from 'react';
import { X, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Product } from '../../types/warehouse';
import { generatePDFFromElement } from '../../utils/documentUtils';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  if (!isOpen) return null;

  const handleDownload = async () => {
    await generatePDFFromElement('qrcode-content', `QR_${product.name}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">QR-код товара</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div id="qrcode-content" className="bg-white p-4">
            <div className="text-center mb-4">
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.category}</p>
            </div>
            <div className="flex justify-center">
              <QRCodeSVG
                value={product.id}
                size={256}
                level="H"
                includeMargin
              />
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Скачать
          </button>
        </div>
      </div>
    </div>
  );
};