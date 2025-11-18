import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { contractTemplateService } from '../services/contractTemplateService';
import { ContractTemplate } from '../types/contract';
import { TemplateEditor } from '../components/contracts/TemplateEditor';

export const EditTemplate: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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
        setTitle(loadedTemplate.title);
        setDescription(loadedTemplate.description);
        setContent(loadedTemplate.content);
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

  const handleSave = async () => {
    if (!id || !title.trim()) {
      alert('Пожалуйста, введите название шаблона');
      return;
    }

    try {
      setIsSaving(true);
      await contractTemplateService.updateTemplate(id, {
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        lastModified: new Date().toISOString()
      });
      navigate('/templates');
    } catch (error) {
      console.error('Ошибка при сохранении шаблона:', error);
      alert('Произошла ошибка при сохранении шаблона');
    } finally {
      setIsSaving(false);
    }
  };

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
        <h1 className="text-2xl font-bold mb-6">Редактирование шаблона договора</h1>

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