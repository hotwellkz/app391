import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ClientForm } from './ClientForm';
import { NewClient } from '../../types/client';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db, addCategory } from '../../lib/firebase';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: NewClient;
  isEditMode?: boolean;
  onSave: () => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  client: initialClient,
  isEditMode = false,
  onSave
}) => {
  const [client, setClient] = useState<NewClient>(initialClient);

  const generateClientNumber = async (status: 'building' | 'deposit') => {
    try {
      const currentYear = new Date().getFullYear();
      const q = query(
        collection(db, 'clients'),
        where('status', '==', status),
        where('year', '==', currentYear)
      );
      
      const snapshot = await getDocs(q);
      let maxNumber = 0;

      snapshot.forEach(doc => {
        const clientData = doc.data();
        const currentNumber = parseInt(clientData.clientNumber.split('-')[1]);
        if (currentNumber > maxNumber) {
          maxNumber = currentNumber;
        }
      });

      const nextNumber = maxNumber + 1;
      return `${currentYear}-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating client number:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const clientData = {
        ...client,
        year: new Date().getFullYear(),
        createdAt: isEditMode ? initialClient.createdAt : serverTimestamp()
      };

      if (!isEditMode) {
        // Проверяем на дубли по имени и objectName
        const clientName = `${client.lastName} ${client.firstName}`.trim();
        const duplicateChecks: string[] = [];
        
        if (clientName) {
          const nameQuery = query(
            collection(db, 'clients'),
            where('lastName', '==', client.lastName || ''),
            where('firstName', '==', client.firstName || '')
          );
          const nameSnapshot = await getDocs(nameQuery);
          if (!nameSnapshot.empty) {
            duplicateChecks.push(`имени "${clientName}"`);
          }
        }
        
        if (client.objectName) {
          const objectQuery = query(
            collection(db, 'clients'),
            where('objectName', '==', client.objectName)
          );
          const objectSnapshot = await getDocs(objectQuery);
          if (!objectSnapshot.empty) {
            duplicateChecks.push(`названию объекта "${client.objectName}"`);
          }
        }
        
        // Показываем предупреждение, но не блокируем создание
        if (duplicateChecks.length > 0) {
          const message = `Внимание: В системе уже есть клиент(ы) с таким же ${duplicateChecks.join(' и ')}.\n\nЭто может привести к проблемам с отображением истории транзакций.\n\nПродолжить создание?`;
          if (!confirm(message)) {
            return; // Пользователь отменил создание
          }
        }
        
        // Генерируем номер клиента в зависимости от статуса
        const clientNumber = await generateClientNumber(client.status);
        clientData.clientNumber = clientNumber;

        await addDoc(collection(db, 'clients'), clientData);
        
        // Проверяем существующие иконки в категориях
        const [projectsQuery, clientsQuery] = [
          query(
            collection(db, 'categories'),
            where('title', '==', `${client.objectName}`),
            where('row', '==', 3)
          ),
          query(
            collection(db, 'categories'),
            where('title', '==', `${client.objectName}`),
            where('row', '==', 1)
          )
        ];
        
        const [projectsSnapshot, clientsSnapshot] = await Promise.all([
          getDocs(projectsQuery),
          getDocs(clientsQuery)
        ]);
        
        // Создаем иконки только если они еще не существуют и есть название объекта
        if (client.objectName) {
          const promises = [];
          
          if (projectsSnapshot.empty) {
            promises.push(addCategory({
              title: client.objectName,
              amount: '0 ₸',
              icon: 'Building2',
              color: 'bg-blue-500',
              row: 3
            }));
          }
          
          if (clientsSnapshot.empty) {
            promises.push(addCategory({
              title: client.objectName,
              amount: '0 ₸',
              icon: 'User',
              color: 'bg-amber-400',
              row: 1
            }));
          }
          
          await Promise.all(promises);
        }

        onSave();
      } else {
        const clientRef = doc(db, 'clients', initialClient.id!);
        await updateDoc(clientRef, clientData);

        // Проверяем существующие иконки в категориях
        const [projectsQuery, clientsQuery] = [
          query(
            collection(db, 'categories'),
            where('title', '==', initialClient.objectName),
            where('row', '==', 3)
          ),
          query(
            collection(db, 'categories'),
            where('title', '==', initialClient.objectName),
            where('row', '==', 1)
          )
        ];
        
        const [projectsSnapshot, clientsSnapshot] = await Promise.all([
          getDocs(projectsQuery),
          getDocs(clientsQuery)
        ]);

        // Обновляем названия категорий
        const batch = writeBatch(db);
        [...projectsSnapshot.docs, ...clientsSnapshot.docs].forEach(doc => {
          batch.update(doc.ref, { 
            title: client.objectName,
            updatedAt: serverTimestamp()
          });
        });

        await batch.commit();
        onSave();
      }
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Ошибка при сохранении данных клиента');
    }
  };

  const handleChange = (updates: Partial<NewClient>) => {
    setClient(prev => ({ ...prev, ...updates }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {isEditMode ? 'Редактировать клиента' : 'Добавить клиента'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <ClientForm
            client={client}
            onChange={handleChange}
            isEditMode={isEditMode}
          />

          <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
            >
              {isEditMode ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
