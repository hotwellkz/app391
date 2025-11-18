import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, FileText } from 'lucide-react';
import { ContractTemplate } from '../components/ContractTemplate';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Contract {
  id: string;
  clientId: string;
  clientNumber: string;
  clientName: string;
  clientLastName: string;
  contractNumber: string;
  contractType: string;
  createdAt: Date;
  totalAmount: number;
  content: string;
}

const mockClient = {
  clientNumber: "2024-001",
  lastName: "Иванов",
  firstName: "Иван",
  middleName: "Иванович",
  objectName: "Жилой дом",
  constructionAddress: "г. Алматы, мкр. Алатау, ул. Жетысу, уч. 123",
  totalAmount: 10500000,
  iin: "123456789012",
  livingAddress: "г. Алматы, ул. Абая, д. 1, кв. 1",
  phone: "+7 747 743 4343",
  email: "HotWell.KZ@gmail.com"
};

interface ContractType {
  id: string;
  title: string;
  description: string;
  lastModified: string;
}

export const Contracts: React.FC = () => {
  const [showTemplate, setShowTemplate] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const contractTemplates: ContractType[] = [
    {
      id: '1',
      title: 'Договор подряда на строительство дома',
      description: 'Стандартный договор для строительства частного дома',
      lastModified: '10.03.2024'
    }
  ];

  useEffect(() => {
    const q = query(collection(db, 'contracts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contractsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contract[];
      
      setContracts(contractsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleContractClick = (contract: Contract) => {
    setSelectedContract(contract);
    setShowTemplate(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button onClick={() => window.history.back()} className="mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">Договоры</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Шаблоны договоров */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Шаблоны договоров</h2>
          <div className="grid gap-4">
            {contractTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => setShowTemplate(true)}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="p-4 sm:p-6 flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {template.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {template.description}
                    </p>
                    <p className="text-sm text-gray-400">
                      Последнее изменение: {template.lastModified}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Список договоров */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Созданные договоры</h2>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Нет созданных договоров</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  onClick={() => handleContractClick(contract)}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="p-4 sm:p-6 flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        Договор №{contract.contractNumber}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {contract.clientLastName} {contract.clientName}
                      </p>
                      <p className="text-sm text-gray-400">
                        {contract.contractType}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Шаблон договора */}
      {showTemplate && (
        <ContractTemplate
          client={mockClient}
          isOpen={showTemplate}
          onClose={() => setShowTemplate(false)}
        />
      )}
    </div>
  );
};