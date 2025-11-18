import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Client, initialClientState } from '../../types/client';
import { doc, collection, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ClientMainInfo } from './ClientMainInfo';
import { ClientPayments } from './ClientPayments';
import { ClientContracts } from './ClientContracts';
import { EstimateBlock } from './estimate/EstimateBlock';
import { FoundationEstimate } from './FoundationEstimate';
import { SipWallsEstimate } from './SipWallsEstimate';
import { FloorEstimate } from './FloorEstimate';
import { RoofEstimate } from './RoofEstimate';
import { PartitionEstimate } from './PartitionEstimate';
import { ConsumablesEstimate } from './ConsumablesEstimate';
import { AdditionalWorksEstimate } from './AdditionalWorksEstimate';
import { ReceiptCalculation } from './ReceiptCalculation';
import { FinishingEstimate } from './FinishingEstimate';
import { MobileHeader } from './MobileHeader';

interface ClientDetailsProps {
  client: Client;
  onSave: () => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  onBack?: () => void;
}

export const ClientDetails = forwardRef<any, ClientDetailsProps>(({ 
  client, 
  onSave,
  isEditing,
  setIsEditing,
  onBack
}, ref) => {
  const [formData, setFormData] = useState({
    ...initialClientState,
    ...client
  });
  const [loading, setLoading] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showContracts, setShowContracts] = useState(false);
  const [floors, setFloors] = useState(client.floors || '2 эт');

  // Синхронизация floors при изменении клиента
  React.useEffect(() => {
    setFloors(client.floors || '2 эт');
  }, [client.floors]);

  const clientRef = doc(db, 'clients', client.id);

  const handleSave = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);

      // Обновляем данные клиента
      batch.update(clientRef, {
        ...formData,
        floors: floors, // сохраняем актуальный этаж
        updatedAt: serverTimestamp()
      });

      // Находим и обновляем связанные категории
      const possibleTitles = [
        // Старый формат - название проекта
        client.objectName,
        // Старый формат - различные варианты имени
        `${client.lastName} ${client.firstName}`,
        `${client.lastName} ${client.firstName}`.trim(),
      ].filter(Boolean);

      // Создаем запросы для каждого возможного названия и row
      const queries = possibleTitles.flatMap(title => [
        query(
          collection(db, 'categories'),
          where('title', '==', title),
          where('row', '==', 1)
        ),
        query(
          collection(db, 'categories'),
          where('title', '==', title),
          where('row', '==', 3)
        )
      ]);
      
      // Выполняем все запросы параллельно
      const snapshots = await Promise.all(
        queries.map(q => getDocs(q))
      );

      // Объединяем все найденные документы
      const allDocs = snapshots.flatMap(snapshot => snapshot.docs);
      
      // Удаляем дубликаты по ID документа
      const uniqueDocs = Array.from(
        new Map(allDocs.map(doc => [doc.id, doc])).values()
      );

      // Обновляем названия категорий
      const newTitle = formData.objectName || `${formData.lastName} ${formData.firstName}`.trim();
      uniqueDocs.forEach(doc => {
        batch.update(doc.ref, { 
          title: newTitle,
          updatedAt: serverTimestamp()
        });
      });

      // Находим и обновляем все связанные транзакции
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('fromUser', '==', `${client.lastName} ${client.firstName}`)
      );
      
      const toUserTransactionsQuery = query(
        collection(db, 'transactions'),
        where('toUser', '==', `${client.lastName} ${client.firstName}`)
      );

      const [transactionsSnapshot, toUserTransactionsSnapshot] = await Promise.all([
        getDocs(transactionsQuery),
        getDocs(toUserTransactionsQuery)
      ]);

      // Обновляем fromUser в транзакциях
      transactionsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
          fromUser: newTitle,
          updatedAt: serverTimestamp()
        });
      });

      // Обновляем toUser в транзакциях
      toUserTransactionsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
          toUser: newTitle,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      setIsEditing(false);
      onSave();
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Ошибка при сохранении данных клиента');
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave
  }), [handleSave]);

  return (
    <div className="pt-[72px]"> 
      <MobileHeader
        title={formData.objectName || `${formData.lastName} ${formData.firstName}`.trim()}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        clientId={client.id}
        onSave={handleSave}
        onBack={onBack}
      />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <ClientMainInfo
            clientId={client.id}
            client={client}
            isEditing={isEditing}
            onUpdate={(updates) => {
              setFormData(prev => ({ ...prev, ...updates }));
            }}
          />

          <div className="mt-6 space-y-4">
            <div>
              <button
                onClick={() => setShowPayments(!showPayments)}
                className="flex items-center text-gray-700 hover:text-gray-900"
              >
                {showPayments ? (
                  <ChevronUp className="w-5 h-5 mr-1" />
                ) : (
                  <ChevronDown className="w-5 h-5 mr-1" />
                )}
                Платежи
              </button>

              {showPayments && (
                <ClientPayments
                  formData={formData}
                  isEditing={isEditing}
                  onChange={(e) => {
                    const { name, value } = e.target;
                    setFormData(prev => ({ ...prev, [name]: Number(value) }));
                  }}
                />
              )}
            </div>

            <div>
              <button
                onClick={() => setShowContracts(!showContracts)}
                className="flex items-center text-gray-700 hover:text-gray-900"
              >
                {showContracts ? (
                  <ChevronUp className="w-5 h-5 mr-1" />
                ) : (
                  <ChevronDown className="w-5 h-5 mr-1" />
                )}
                Договоры
              </button>

              {showContracts && (
                <div className="mt-4">
                  <ClientContracts clientId={client.id} />
                </div>
              )}
            </div>

            <EstimateBlock
              isEditing={isEditing}
              clientId={client.id}
              floors={floors}
              onFloorsChange={(value) => {
                setFloors(value);
                setFormData(prev => ({ ...prev, floors: value }));
              }}
            />

            <FoundationEstimate
              isEditing={isEditing}
              clientId={client.id}
            />

            <SipWallsEstimate
              isEditing={isEditing}
              clientId={client.id}
            />

            {floors === '2 эт' && (
              <FloorEstimate
                isEditing={isEditing}
                clientId={client.id}
              />
            )}

            <RoofEstimate
              isEditing={isEditing}
              clientId={client.id}
            />

            <PartitionEstimate
              isEditing={isEditing}
              clientId={client.id}
            />

            <ConsumablesEstimate
              isEditing={isEditing}
              clientId={client.id}
            />

            <AdditionalWorksEstimate
              isEditing={isEditing}
              clientId={client.id}
              floors={floors}
            />

            <ReceiptCalculation
              isEditing={isEditing}
              clientId={client.id}
            />

            <FinishingEstimate
              isEditing={isEditing}
              clientId={client.id}
            />
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});