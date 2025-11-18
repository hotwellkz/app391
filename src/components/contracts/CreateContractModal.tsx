import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ContractTemplate, ContractData } from '../../types/contract';
import { contractTemplateService } from '../../services/contractTemplateService';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';

interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: ContractTemplate;
  clientData: ContractData;
}

export const CreateContractModal: React.FC<CreateContractModalProps> = ({
  isOpen,
  onClose,
  template,
  clientData
}) => {
  const [loading, setLoading] = useState(false);
  const [additionalWork, setAdditionalWork] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateContract = async () => {
    try {
      setLoading(true);
      setError(null);
      await contractTemplateService.createContract(template, clientData, additionalWork);
      showSuccessNotification('Договор успешно создан');
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Произошла неизвестная ошибка при создании договора');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Создание договора</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Ошибка при создании договора
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Шаблон договора</h3>
            <p className="text-gray-600">{template.title}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Клиент</h3>
            <p className="text-gray-600">
              {clientData.lastName} {clientData.firstName} {clientData.middleName}
            </p>
            <p className="text-gray-600">{clientData.clientNumber}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дополнительные работы
            </label>
            <textarea
              value={additionalWork}
              onChange={(e) => setAdditionalWork(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Введите описание дополнительных работ..."
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Отмена
            </button>
            <button
              onClick={handleCreateContract}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать договор'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 