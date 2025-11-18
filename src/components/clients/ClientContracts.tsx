import React, { useState, useEffect } from 'react';
import { FileText, Download, Share2, Edit2, Trash2 } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ContractTemplate } from '../ContractTemplate';
import { generatePDFFromElement } from '../../utils/documentUtils';
import { shareContent } from '../../utils/shareUtils';

interface Contract {
  id: string;
  contractNumber: string;
  contractType: string;
  createdAt: any;
  content: string;
}

interface ClientContractsProps {
  clientId: string;
}

export const ClientContracts: React.FC<ClientContractsProps> = ({ clientId }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'contracts'),
      where('clientId', '==', clientId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contractsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contract[];
      
      contractsData.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
      
      setContracts(contractsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clientId]);

  const handleContractClick = (contract: Contract) => {
    setSelectedContract(contract);
    setShowTemplate(true);
  };

  const handleShare = async (e: React.MouseEvent, contract: Contract) => {
    e.stopPropagation();
    const content = JSON.parse(contract.content);
    const shareText = `
Договор подряда №${contract.contractNumber}

Клиент: ${content.lastName} ${content.firstName} ${content.middleName}
Объект: ${content.objectName}
Адрес строительства: ${content.constructionAddress}
Общая стоимость: ${content.totalAmount.toLocaleString()} тг

ТОО "HotWell.KZ"
Тел: +7 747 743 4343
WhatsApp: +7 747 743 4343
Email: HotWell.KZ@gmail.com
    `;

    await shareContent('Договор подряда HotWell.KZ', shareText);
  };

  const handleDownload = async (e: React.MouseEvent, contract: Contract) => {
    e.stopPropagation();
    await generatePDFFromElement('contract-content', `Договор_${contract.contractNumber}.pdf`);
  };

  const handleDelete = async (e: React.MouseEvent, contract: Contract) => {
    e.stopPropagation();
    
    if (window.confirm(`Вы уверены, что хотите удалить договор №${contract.contractNumber}?`)) {
      try {
        await deleteDoc(doc(db, 'contracts', contract.id));
      } catch (error) {
        console.error('Error deleting contract:', error);
        alert('Ошибка при удалении договора');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Нет созданных договоров</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Договор №{contract.contractNumber}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {contract.contractType}
                  </p>
                  <p className="text-sm text-gray-400">
                    Создан: {contract.createdAt ? contract.createdAt.toDate().toLocaleDateString('ru-RU') : 'Дата не указана'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => handleShare(e, contract)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                    title="Поделиться"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => handleDownload(e, contract)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                    title="Скачать"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContractClick(contract);
                    }}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                    title="Просмотреть"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, contract)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
                    title="Удалить"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {showTemplate && selectedContract && (
        <ContractTemplate
          client={JSON.parse(selectedContract.content)}
          isOpen={showTemplate}
          onClose={() => setShowTemplate(false)}
        />
      )}
    </div>
  );
};