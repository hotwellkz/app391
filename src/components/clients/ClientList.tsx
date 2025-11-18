import React from 'react';
import { Client } from '../../types/client';
import { ClientSection } from './ClientSection';
import { Users } from 'lucide-react';

interface ClientListProps {
  clients: Client[];
  onContextMenu: (e: React.MouseEvent, client: Client) => void;
  onClientClick: (client: Client) => void;
  onToggleVisibility: (client: Client) => Promise<void>;
  status: 'building' | 'deposit' | 'built' | 'all';
  loading: boolean;
  onReorder?: (clients: Client[]) => Promise<void>;
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  onContextMenu,
  onClientClick,
  onToggleVisibility,
  status,
  loading,
  onReorder
}) => {
  // Сортируем клиентов по полю order
  const sortByOrder = (clientsToSort: Client[]) => {
    return [...clientsToSort].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  const buildingClients = sortByOrder(clients.filter(client => client.status === 'building'));
  const depositClients = sortByOrder(clients.filter(client => client.status === 'deposit'));
  const builtClients = sortByOrder(clients.filter(client => client.status === 'built'));

  // Группируем построенных клиентов по годам
  const groupBuiltClientsByYear = () => {
    const grouped = new Map<number, Client[]>();
    
    builtClients.forEach(client => {
      // Получаем год из номера клиента (например, из "2024-001" получаем 2024)
      const year = parseInt(client.clientNumber.split('-')[0]) || client.year;
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year)?.push(client);
    });

    // Сортируем года в обратном порядке (сначала новые)
    return new Map([...grouped.entries()].sort((a, b) => b[0] - a[0]));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Нет клиентов</h3>
        <p className="text-gray-500">
          {status === 'building' ? 'Нет активных проектов' :
           status === 'deposit' ? 'Нет клиентов с задатком' :
           status === 'built' ? 'Нет завершенных проектов' :
           'Список клиентов пуст'}
        </p>
      </div>
    );
  }

  // Функция для обработки изменения порядка клиентов в конкретной категории
  const handleReorder = async (updatedClients: Client[]) => {
    if (onReorder) {
      // Фильтруем только клиентов из обновленной категории
      const categoryStatus = updatedClients[0]?.status;
      const allUpdatedClients = clients.map(client => {
        // Если клиент принадлежит к обновляемой категории, находим его обновленную версию
        if (client.status === categoryStatus) {
          const updatedClient = updatedClients.find(c => c.id === client.id);
          return updatedClient || client;
        }
        // Иначе оставляем клиента без изменений
        return client;
      });
      
      await onReorder(allUpdatedClients);
    }
  };

  const groupedBuiltClients = groupBuiltClientsByYear();

  return (
    <div className="space-y-6">
      {(status === 'all' || status === 'building') && buildingClients.length > 0 && (
        <ClientSection
          title="Строим"
          subtitle="Активные проекты"
          clients={buildingClients}
          onContextMenu={onContextMenu}
          onClientClick={onClientClick}
          onToggleVisibility={onToggleVisibility}
          type="building"
          onReorder={handleReorder}
        />
      )}

      {(status === 'all' || status === 'deposit') && depositClients.length > 0 && (
        <ClientSection
          title="Задаток"
          subtitle="Ожидают строительства"
          clients={depositClients}
          onContextMenu={onContextMenu}
          onClientClick={onClientClick}
          onToggleVisibility={onToggleVisibility}
          type="deposit"
          onReorder={handleReorder}
        />
      )}

      {(status === 'all' || status === 'built') && builtClients.length > 0 && (
        <div className="space-y-6">
          {[...groupedBuiltClients.entries()].map(([year, yearClients]) => (
            <ClientSection
              key={year}
              title={`Построено ${year}`}
              subtitle={`Завершенные проекты ${year} года`}
              clients={yearClients}
              onContextMenu={onContextMenu}
              onClientClick={onClientClick}
              onToggleVisibility={onToggleVisibility}
              type="built"
              onReorder={handleReorder}
            />
          ))}
        </div>
      )}
    </div>
  );
};