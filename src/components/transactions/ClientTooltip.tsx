import React, { useEffect, useState } from 'react';
import { getClientByObjectName } from '../../services/clientService';
import { Client } from '../../types/client';
import { X } from 'lucide-react';
import { formatAmount } from '../../utils/formatUtils';

interface ClientTooltipProps {
  objectName: string;
  show: boolean;
  onClose?: () => void;
}

export const ClientTooltip: React.FC<ClientTooltipProps> = ({
  objectName,
  show,
  onClose
}) => {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const clientData = await getClientByObjectName(objectName);
        setClient(clientData);
      } catch (error) {
        console.error('Error fetching client:', error);
      } finally {
        setLoading(false);
      }
    };

    if (show) {
      fetchClient();
    }
  }, [objectName, show]);

  if (!show || loading) return null;

  const renderField = (label: string, value: string | number | undefined) => {
    if (!value) return null;
    return (
      <div className="p-2 hover:bg-emerald-100 rounded-md transition-colors">
        <span className="text-sm font-medium text-emerald-800">{label}: </span>
        <span className="text-sm text-emerald-700">
          {typeof value === 'number' ? formatAmount(value) : value}
        </span>
      </div>
    );
  };

  const getFullName = () => {
    if (!client) return undefined;
    const nameParts = [
      client.lastName,
      client.firstName,
      client.middleName
    ].filter(Boolean);
    return nameParts.length > 0 ? nameParts.join(' ') : undefined;
  };

  return (
    <div
      className="fixed z-[9999] bg-emerald-50 border border-emerald-200 rounded-lg shadow-lg p-4 min-w-[300px]"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-emerald-800">
          Информация о клиенте
        </h3>
        <button
          onClick={onClose}
          className="text-emerald-500 hover:text-emerald-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {client ? (
        <div className="space-y-1">
          {renderField("ФИО", getFullName())}
          {renderField("Телефон", client.phone)}
          {renderField("Адрес строительства", client.constructionAddress)}
          {renderField("Название объекта", client.objectName)}
          {renderField("Общая сумма строительства", client.totalAmount)}
          {renderField("Первый транш", client.firstPayment)}
          {renderField("Второй транш", client.secondPayment)}
          {renderField("Третий транш", client.thirdPayment)}
          {renderField("Четвертый транш", client.fourthPayment)}
        </div>
      ) : (
        <div className="text-sm text-emerald-600">
          Информация о клиенте не найдена
        </div>
      )}
    </div>
  );
}; 