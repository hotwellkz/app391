import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';
import { BarcodeGenerator } from './BarcodeGenerator';
import { Product } from '../../types/warehouse';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [codeType, setCodeType] = useState<'barcode' | 'qrcode'>('barcode');

  if (!isOpen) return null;

  const handlePrint = async () => {
    const element = document.getElementById('barcode-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'PNG', 10, 10, 190, 100);
      pdf.save(`${product.name}-${codeType}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Ошибка при создании PDF');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Штрих-код товара</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-center space-x-4 mb-4">
              <button
                onClick={() => setCodeType('barcode')}
                className={`px-4 py-2 rounded-md ${
                  codeType === 'barcode'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Штрих-код
              </button>
              <button
                onClick={() => setCodeType('qrcode')}
                className={`px-4 py-2 rounded-md ${
                  codeType === 'qrcode'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                QR-код
              </button>
            </div>

            <div id="barcode-content" className="bg-white p-4">
              <div className="text-center mb-4">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.category}</p>
              </div>
              <BarcodeGenerator
                value={product.id}
                type={codeType}
              />
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
          >
            <Printer className="w-5 h-5 mr-2" />
            Распечатать
          </button>
        </div>
      </div>
    </div>
  );
};