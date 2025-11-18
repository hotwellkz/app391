import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractTemplateService } from '../services/contractTemplateService';
import { TemplateEditor } from '../components/contracts/TemplateEditor';

export const CreateTemplate: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const previewData = {
    clientNumber: 'TEST-001',
    firstName: 'Иван',
    lastName: 'Иванов',
    middleName: 'Иванович',
    iin: '123456789012',
    phone: '+7 (777) 123-45-67',
    email: 'test@example.com',
    constructionAddress: 'г. Алматы, ул. Тестовая, 1',
    livingAddress: 'г. Алматы, ул. Проживания, 2',
    objectName: 'Тестовый объект',
    constructionDays: '30',
    totalAmount: '1000000',
    totalAmountWords: 'один миллион тенге',
    deposit: '75000',
    depositWords: 'семьдесят пять тысяч тенге',
    firstPayment: '300000',
    firstPaymentWords: 'триста тысяч тенге',
    secondPayment: '300000',
    secondPaymentWords: 'триста тысяч тенге',
    thirdPayment: '200000',
    thirdPaymentWords: 'двести тысяч тенге',
    fourthPayment: '200000',
    fourthPaymentWords: 'двести тысяч тенге',
    additionalWorks: 'Дополнительные работы не предусмотрены',
    estimateTable: 'Таблица сметы будет добавлена автоматически',
    currentDate: new Date().toLocaleDateString('ru-RU')
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Пожалуйста, введите название шаблона');
      return;
    }

    try {
      setIsSaving(true);
      await contractTemplateService.createTemplate({
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        lastModified: new Date().toISOString(),
        placeholders: []
      });
      navigate('/templates');
    } catch (error) {
      console.error('Ошибка при сохранении шаблона:', error);
      alert('Произошла ошибка при сохранении шаблона');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Создание шаблона договора</h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название шаблона
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите название шаблона"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Введите описание шаблона"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Содержание шаблона
            </label>
            <TemplateEditor
              content={content}
              onChange={setContent}
              placeholder="Введите содержание шаблона..."
              previewData={previewData}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => navigate('/templates')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 