import React from 'react';
import { Share2, Download, Edit2, X } from 'lucide-react';
import { ContractContent } from './ContractContent';
import { shareContent } from '../utils/shareUtils';
import { generatePDFFromElement } from '../utils/documentUtils';
import { generateDOCX } from '../utils/documentUtils';

interface ContractTemplateProps {
  client: {
    clientNumber: string;
    lastName: string;
    firstName: string;
    middleName: string;
    objectName: string;
    constructionAddress: string;
    totalAmount: number;
    iin: string;
    livingAddress: string;
    phone: string;
    email: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const ContractTemplate: React.FC<ContractTemplateProps> = ({ client, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleShare = async () => {
    const content = `
Договор подряда №${client.clientNumber}

Заказчик: ${client.lastName} ${client.firstName} ${client.middleName}
Объект: ${client.objectName}
Адрес строительства: ${client.constructionAddress}
Общая стоимость: ${client.totalAmount.toLocaleString()} тг

ТОО "HotWell.KZ"
Тел: +7 747 743 4343
WhatsApp: +7 747 743 4343
Email: HotWell.KZ@gmail.com
    `;

    await shareContent('Договор подряда HotWell.KZ', content);
  };

  const handleDownloadPDF = async () => {
    await generatePDFFromElement('contract-content', `Договор_${client.lastName}_${client.firstName}.pdf`);
  };

  const handleDownloadDOCX = async () => {
    await generateDOCX(client, `Договор_${client.lastName}_${client.firstName}.docx`);
  };

  const handleEdit = () => {
    // Логика для редактирования будет добавлена позже
    console.log('Edit functionality to be implemented');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-10 z-50">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl mx-4" style={{ maxHeight: '90vh' }}>
        {/* Шапка */}
        <div className="sticky top-0 bg-white rounded-t-lg border-b border-gray-200 z-10">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-xl font-semibold">Договор подряда №{client.clientNumber}</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                title="Поделиться"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <div className="relative group">
                <button
                  onClick={handleDownloadPDF}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                  title="Скачать PDF"
                >
                  <Download className="w-5 h-5" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Скачать как PDF
                  </button>
                  <button
                    onClick={handleDownloadDOCX}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Скачать как DOCX
                  </button>
                </div>
              </div>
              <button
                onClick={handleEdit}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                title="Редактировать"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                title="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Содержимое договора */}
        <div id="contract-content" className="overflow-auto p-8 space-y-6 pdf-export" style={{ maxHeight: 'calc(90vh - 73px)' }}>
          <ContractContent client={client} />
        </div>
      </div>
    </div>
  );
};