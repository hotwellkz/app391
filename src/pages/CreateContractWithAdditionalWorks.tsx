import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { contractTemplateService } from '../services/contractTemplateService';
import { ContractTemplate } from '../types/contract';
import { Plus, Check, X, Search } from 'lucide-react';
import { Client } from '../types/client';
import { clientService } from '../services/clientService';
import { ClientSearchBar } from '../components/clients/ClientSearchBar';

interface AdditionalWork {
  id: string;
  number: string;
  description: string;
}

export const CreateContractWithAdditionalWorks: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [hasNoAdditionalWorks, setHasNoAdditionalWorks] = useState(false);
  const [additionalWorks, setAdditionalWorks] = useState<AdditionalWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const loadedTemplate = await contractTemplateService.getTemplateById(id);
        if (!loadedTemplate) {
          throw new Error('Шаблон не найден');
        }
        setTemplate(loadedTemplate);
      } catch (error) {
        console.error('Ошибка при загрузке шаблона:', error);
        alert('Произошла ошибка при загрузке шаблона');
        navigate('/templates');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [id, navigate]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const loadedClients = await clientService.getAllClients();
        setClients(loadedClients);
      } catch (error) {
        console.error('Ошибка при загрузке клиентов:', error);
        alert('Произошла ошибка при загрузке клиентов');
      }
    };

    loadClients();
  }, []);

  const handleAddWork = () => {
    const newWork: AdditionalWork = {
      id: Date.now().toString(),
      number: String(additionalWorks.length + 1).padStart(2, '0'),
      description: ''
    };
    setAdditionalWorks([...additionalWorks, newWork]);
  };

  const handleUpdateWork = (id: string, description: string) => {
    setAdditionalWorks(works =>
      works.map(work =>
        work.id === id ? { ...work, description } : work
      )
    );
  };

  const handleDeleteWork = (id: string) => {
    setAdditionalWorks(works => works.filter(work => work.id !== id));
    // Обновляем номера работ
    setAdditionalWorks(works =>
      works.map((work, index) => ({
        ...work,
        number: String(index + 1).padStart(2, '0')
      }))
    );
  };

  const handleCreateContract = async () => {
    if (!template || !selectedClient) return;

    try {
      setIsSaving(true);
      setError(null);
      
      // Формируем текст дополнительных работ
      let additionalWorksText = '';
      if (hasNoAdditionalWorks) {
        additionalWorksText = 'Дополнительные работы не предусмотрены';
      } else if (additionalWorks.length > 0) {
        additionalWorksText = 'Дополнительные работы:\n\n' +
          additionalWorks.map(work => `${work.number}. ${work.description}`).join('\n');
      }

      console.log('Создание договора с данными:', {
        template,
        selectedClient,
        additionalWorksText
      });

      // Создаем договор с данными выбранного клиента
      await contractTemplateService.createContract(
        template,
        {
          clientId: selectedClient.id,
          clientNumber: selectedClient.clientNumber,
          firstName: selectedClient.firstName,
          lastName: selectedClient.lastName,
          middleName: selectedClient.middleName,
          iin: selectedClient.iin,
          phone: selectedClient.phone,
          email: selectedClient.email,
          constructionAddress: selectedClient.constructionAddress,
          livingAddress: selectedClient.livingAddress,
          objectName: selectedClient.objectName,
          constructionDays: selectedClient.constructionDays,
          totalAmount: selectedClient.totalAmount,
          totalAmountWords: selectedClient.totalAmountWords,
          deposit: selectedClient.deposit,
          depositWords: selectedClient.depositWords,
          firstPayment: selectedClient.firstPayment,
          firstPaymentWords: selectedClient.firstPaymentWords,
          secondPayment: selectedClient.secondPayment,
          secondPaymentWords: selectedClient.secondPaymentWords,
          thirdPayment: selectedClient.thirdPayment,
          thirdPaymentWords: selectedClient.thirdPaymentWords,
          fourthPayment: selectedClient.fourthPayment,
          fourthPaymentWords: selectedClient.fourthPaymentWords,
          additionalWorks: additionalWorksText
        },
        additionalWorksText
      );

      navigate('/templates');
    } catch (error) {
      console.error('Ошибка при создании договора:', error);
      if (error instanceof Error) {
        console.error('Сообщение об ошибке:', error.message);
        console.error('Стек вызовов:', error.stack);
        setError(error.message);
      } else {
        setError('Произошла неизвестная ошибка при создании договора');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Фильтрация клиентов по поисковому запросу
  const filteredClients = clients.filter(client =>
    `${client.lastName} ${client.firstName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery) ||
    client.objectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Создание договора с дополнительными работами</h1>

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

        <div className="space-y-6">
          {/* Поиск и выбор клиента */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Выбор клиента</h2>
            
            <div className="mb-4">
              <ClientSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>

            {searchQuery && (
              <div className="mt-4 max-h-60 overflow-y-auto border rounded-lg">
                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 ${
                      selectedClient?.id === client.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedClient(client)}
                  >
                    <div className="font-medium">
                      {client.lastName} {client.firstName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {client.phone} • {client.objectName}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedClient && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="font-medium text-green-800">
                  Выбран клиент: {selectedClient.lastName} {selectedClient.firstName}
                </div>
                <div className="text-sm text-green-700">
                  {selectedClient.objectName}
                </div>
              </div>
            )}
          </div>

          {/* Дополнительные работы */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Шаблон: {template.title}</h2>
            
            <div className="mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={hasNoAdditionalWorks}
                  onChange={(e) => {
                    setHasNoAdditionalWorks(e.target.checked);
                    if (e.target.checked) {
                      setAdditionalWorks([]);
                    }
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Дополнительных работ нет</span>
              </label>
            </div>

            {!hasNoAdditionalWorks && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Дополнительные работы</h3>
                  <button
                    onClick={handleAddWork}
                    className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Добавить работу
                  </button>
                </div>

                <div className="space-y-4">
                  {additionalWorks.map(work => (
                    <div key={work.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">
                        {work.number}
                      </div>
                      <div className="flex-grow">
                        <textarea
                          value={work.description}
                          onChange={(e) => handleUpdateWork(work.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="Опишите дополнительную работу..."
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteWork(work.id)}
                        className="flex-shrink-0 p-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => navigate('/templates')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateContract}
                disabled={isSaving || !selectedClient || (!hasNoAdditionalWorks && additionalWorks.length === 0)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isSaving ? (
                  'Создание договора...'
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Создать договор
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 