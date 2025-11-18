import React, { useState, useEffect } from 'react';
import { Client } from '../../types/client';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatAmount } from '../../utils/formatAmount';
import { useContractPriceSync } from '../../hooks/useContractPriceSync';
import { useClientTransactions } from '../../hooks/useClientTransactions';
import { ClientTransactionsModal } from './ClientTransactionsModal';
import { Info } from 'lucide-react';
import { ClientActions } from './ClientActions';

interface ClientMainInfoProps {
  clientId: string;
  client: Client;
  isEditing: boolean;
  onUpdate: (updates: Partial<Client>) => void;
}

export const ClientMainInfo: React.FC<ClientMainInfoProps> = ({
  clientId,
  client,
  isEditing,
  onUpdate
}) => {
  if (!client) {
    return null;
  }

  const [formData, setFormData] = useState<Partial<Client>>({
    clientNumber: client.clientNumber || '',
    lastName: client.lastName || '',
    firstName: client.firstName || '',
    middleName: client.middleName || '',
    iin: client.iin || '',
    phone: client.phone || '',
    email: client.email || '',
    constructionAddress: client.constructionAddress || '',
    livingAddress: client.livingAddress || '',
    objectName: client.objectName || '',
    constructionDays: client.constructionDays || 0,
    totalAmount: client.totalAmount || 0
  });

  // Синхронизация с ценой по договору
  useContractPriceSync(clientId, (contractPrice) => {
    setFormData(prev => ({
      ...prev,
      totalAmount: contractPrice
    }));
    onUpdate({ totalAmount: contractPrice });
  });

  useEffect(() => {
    setFormData({
      clientNumber: client.clientNumber || '',
      lastName: client.lastName || '',
      firstName: client.firstName || '',
      middleName: client.middleName || '',
      iin: client.iin || '',
      phone: client.phone || '',
      email: client.email || '',
      constructionAddress: client.constructionAddress || '',
      livingAddress: client.livingAddress || '',
      objectName: client.objectName || '',
      constructionDays: client.constructionDays || 0,
      totalAmount: client.totalAmount || 0
    });
  }, [client]);

  const handleChange = (field: keyof Client) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'totalAmount' || field === 'constructionDays'
      ? Number(e.target.value.replace(/[^0-9]/g, ''))
      : e.target.value;

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    onUpdate({ [field]: value });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value.replace(/[^0-9]/g, ''));
    setFormData(prev => ({
      ...prev,
      totalAmount: value
    }));
    onUpdate({ totalAmount: value });
  };

  // Получаем транзакции клиента
  const { transactions, totalAmount: transactionsTotal, loading: transactionsLoading } = useClientTransactions(clientId);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);

  // Цветовое сравнение сумм
  const buildTotal = formData.totalAmount || 0;
  const isEqual = 
    buildTotal != null && 
    buildTotal > 0 &&
    transactionsTotal != null && 
    transactionsTotal > 0 &&
    Number(buildTotal) === Number(transactionsTotal);

  // Определяем цвет для суммы по транзакциям
  const getAmountColor = () => {
    if (!buildTotal || !transactionsTotal || buildTotal === 0 || transactionsTotal === 0) {
      return 'text-gray-900'; // Нейтральный цвет, если одна из сумм отсутствует
    }
    return isEqual ? 'text-green-600' : 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return Math.round(amount).toLocaleString('ru-RU', { maximumFractionDigits: 0 });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Номер клиента
        </label>
        <input
          type="text"
          name="clientNumber"
          value={formData.clientNumber}
          onChange={handleChange('clientNumber')}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Фамилия
        </label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange('lastName')}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Имя
        </label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange('firstName')}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Отчество
        </label>
        <input
          type="text"
          name="middleName"
          value={formData.middleName}
          onChange={handleChange('middleName')}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ИИН
        </label>
        <input
          type="text"
          name="iin"
          value={formData.iin}
          onChange={handleChange('iin')}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Телефон
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange('phone')}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange('email')}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Адрес строительства
        </label>
        <input
          type="text"
          name="constructionAddress"
          value={formData.constructionAddress}
          onChange={handleChange('constructionAddress')}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Адрес прописки
        </label>
        <input
          type="text"
          name="livingAddress"
          value={formData.livingAddress}
          onChange={handleChange('livingAddress')}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Название объекта
        </label>
        <input
          type="text"
          name="objectName"
          value={formData.objectName}
          onChange={handleChange('objectName')}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Количество дней строительства
        </label>
        <input
          type="number"
          name="constructionDays"
          value={formData.constructionDays}
          onChange={handleChange('constructionDays')}
          disabled={!isEditing}
          className="w-full px-3 py-2 border rounded-md disabled:bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Общая сумма строительства
        </label>
        <div className="relative">
          <input
            type="text"
            value={isEditing ? formatAmount(formData.totalAmount?.toString() || '0') : `${formatAmount(formData.totalAmount?.toString() || '0')} тг`}
            onChange={handleAmountChange}
            disabled={!isEditing}
            className={`w-full px-3 py-2 border rounded-md disabled:bg-gray-50 text-right ${isEditing ? 'pr-12' : ''}`}
          />
          {isEditing && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
              тг
            </span>
          )}
        </div>
      </div>

      {/* Сумма по транзакциям */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Клиент оплатил
        </label>
        <div 
          className={`flex items-center justify-between w-full px-3 py-2 border rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors ${getAmountColor()}`}
          onClick={() => setShowTransactionsModal(true)}
          title="Нажмите для просмотра расшифровки"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {transactionsLoading ? 'Загрузка...' : formatCurrency(transactionsTotal || 0)} ₸
            </span>
            <Info className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <div className="mt-2">
          <ClientActions
            client={client}
            className="flex flex-wrap gap-2"
            size="md"
            allowWrap
          />
        </div>
      </div>

      {/* Модальное окно с расшифровкой транзакций */}
      <ClientTransactionsModal
        isOpen={showTransactionsModal}
        onClose={() => setShowTransactionsModal(false)}
        transactions={transactions}
        totalAmount={transactionsTotal}
      />
    </div>
  );
};