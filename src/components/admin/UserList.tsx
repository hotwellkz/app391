import React from 'react';
import { Shield, User, Trash2, Check, X } from 'lucide-react';
import { AdminUser } from '../../types/admin';

interface UserListProps {
  users: AdminUser[];
  onRoleChange: (userId: string, newRole: 'admin' | 'employee' | 'user') => void;
  onDelete: (userId: string) => void;
  onApprovalChange: (userId: string, isApproved: boolean) => void;
  loading: boolean;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  onRoleChange,
  onDelete,
  onApprovalChange,
  loading
}) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'employee':
        return <User className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Нет пользователей</h3>
        <p className="text-gray-500">Добавьте первого пользователя</p>
      </div>
    );
  }

  return (
    <div>
      {/* Мобильный вид (карточки) */}
      <div className="block sm:hidden space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                  {getRoleIcon(user.role)}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {user.displayName}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
              <button
                onClick={() => onDelete(user.id)}
                className="text-red-600 hover:text-red-900 p-2"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Дата регистрации: {user.createdAt?.toDate().toLocaleDateString('ru-RU')}
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={user.role}
                    onChange={(e) => onRoleChange(user.id, e.target.value as 'admin' | 'employee' | 'user')}
                    className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="user">Пользователь</option>
                    <option value="employee">Сотрудник</option>
                    <option value="admin">Администратор</option>
                  </select>
                  <div className="flex items-center">
                    <button
                      onClick={() => onApprovalChange(user.id, !user.isApproved)}
                      className={`p-2 rounded-full ${
                        user.isApproved
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      {user.isApproved ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Десктопный вид (таблица) */}
      <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Пользователь
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата регистрации
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Роль
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {getRoleIcon(user.role)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.displayName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.createdAt?.toDate().toLocaleDateString('ru-RU')}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => onRoleChange(user.id, e.target.value as 'admin' | 'employee' | 'user')}
                    className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="user">Пользователь</option>
                    <option value="employee">Сотрудник</option>
                    <option value="admin">Администратор</option>
                  </select>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onApprovalChange(user.id, !user.isApproved)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      user.isApproved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isApproved ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Подтвержден
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-1" />
                        Не подтвержден
                      </>
                    )}
                  </button>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onDelete(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};