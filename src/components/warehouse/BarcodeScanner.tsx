import React, { useState } from 'react';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/library';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan
}) => {
  const [error, setError] = useState<string | null>(null);
  const webcamRef = React.useRef<Webcam>(null);

  const capture = React.useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      try {
        const codeReader = new BrowserMultiFormatReader();
        const result = await codeReader.decodeFromImage(undefined, imageSrc);
        if (result) {
          onScan(result.getText());
          onClose();
        }
      } catch (error) {
        setError('Не удалось распознать штрих-код. Попробуйте еще раз.');
      }
    }
  }, [onScan, onClose]);

  React.useEffect(() => {
    const interval = setInterval(capture, 500);
    return () => clearInterval(interval);
  }, [capture]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Сканирование штрих-кода</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full rounded-lg"
          />
          <div className="absolute inset-0 border-2 border-emerald-500 rounded-lg pointer-events-none"></div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <p className="mt-4 text-sm text-gray-600 text-center">
          Наведите камеру на штрих-код для сканирования
        </p>
      </div>
    </div>
  );
};