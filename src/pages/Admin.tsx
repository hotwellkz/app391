import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Edit2, Check, X, Users, MessageSquare, Database, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, serverTimestamp, orderBy, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, getAuth } from 'firebase/auth';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase/auth';
import { showSuccessNotification, showErrorNotification } from '../utils/notifications';
import { UserList } from '../components/admin/UserList';
import { AddUserModal } from '../components/admin/AddUserModal';
import { ContactsManager } from '../components/admin/ContactsManager';
import { AdminRoute } from '../components/auth/AdminRoute';
import { AdminUser } from '../types/admin';
import { migrateAllClientAggregates } from '../utils/migrateClientAggregates';
import { verifyAllClientAggregates } from '../utils/verifyAggregates';

type AdminTab = 'users' | 'contacts' | 'migration';

export const Admin: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [operationalExpense, setOperationalExpense] = useState(1300000);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const [tempExpense, setTempExpense] = useState('1300000');
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminUser[];
      
      setUsers(usersData);
      setLoading(false);
    });

    // Загружаем значение операционного расхода
    const loadOperationalExpense = async () => {
      try {
        const expenseDoc = await getDoc(doc(db, 'settings', 'operationalExpense'));
        if (expenseDoc.exists()) {
          setOperationalExpense(expenseDoc.data().value);
          setTempExpense(expenseDoc.data().value.toString());
        }
      } catch (error) {
        console.error('Error loading operational expense:', error);
      }
    };

    loadOperationalExpense();

    return () => unsubscribe();
  }, []);

  const handleMigrateAggregates = async () => {
    if (!confirm('Вы уверены, что хотите запустить миграцию агрегатов? Это может занять некоторое время.')) {
      return;
    }

    setMigrationLoading(true);
    setMigrationResult('');

    try {
      showSuccessNotification('Начинаем миграцию агрегатов...');
      
      // Запускаем миграцию
      await migrateAllClientAggregates();
      
      setMigrationResult('Миграция успешно завершена! Проверьте консоль браузера для подробностей.');
      showSuccessNotification('Миграция агрегатов завершена успешно');
    } catch (error) {
      console.error('Ошибка при миграции:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setMigrationResult(`Ошибка: ${errorMessage}`);
      showErrorNotification('Ошибка при миграции агрегатов');
    } finally {
      setMigrationLoading(false);
    }
  };

  const handleVerifyAggregates = async () => {
    setVerificationLoading(true);
    setVerificationResult('');

    try {
      showSuccessNotification('Начинаем проверку корректности агрегатов...');
      
      // Запускаем проверку
      const results = await verifyAllClientAggregates();
      
      const matchesCount = results.filter(r => r.matches).length;
      const mismatchesCount = results.filter(r => !r.matches).length;
      
      if (mismatchesCount === 0) {
        setVerificationResult(`✓ Все агрегаты корректны! Проверено клиентов: ${results.length}, совпадений: ${matchesCount}`);
        showSuccessNotification('Все агрегаты корректны');
      } else {
        setVerificationResult(`⚠ Найдены несовпадения! Всего: ${results.length}, совпадает: ${matchesCount}, не совпадает: ${mismatchesCount}. Проверьте консоль для подробностей.`);
        showErrorNotification(`Найдены несовпадения: ${mismatchesCount}`);
      }
    } catch (error) {
      console.error('Ошибка при проверке:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setVerificationResult(`Ошибка: ${errorMessage}`);
      showErrorNotification('Ошибка при проверке агрегатов');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleUpdateOperationalExpense = async () => {
    try {
      const newValue = parseInt(tempExpense);
      if (isNaN(newValue)) {
        showErrorNotification('Введите корректное число');
        return;
      }

      await setDoc(doc(db, 'settings', 'operationalExpense'), {
        value: newValue,
        updatedAt: serverTimestamp()
      });

      setOperationalExpense(newValue);
      setIsEditingExpense(false);
      showSuccessNotification('Операционный расход успешно обновлен');
    } catch (error) {
      console.error('Error updating operational expense:', error);
      showErrorNotification('Ошибка при обновлении операционного расхода');
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ru-RU') + ' тг';
  };

  const handleAddUser = async (userData: {
    email: string;
    displayName: string;
    password: string;
    role: 'admin' | 'employee' | 'user';
  }) => {
    try {
      // Создаем пользователя в Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Обновляем профиль пользователя
      await updateProfile(userCredential.user, {
        displayName: userData.displayName
      });

      // Сохраняем дополнительные данные в Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        isApproved: false,
        createdAt: serverTimestamp()
      });
      
      setShowAddModal(false);
      showSuccessNotification('Пользователь успешно добавлен');
    } catch (error) {
      showErrorNotification('Ошибка при добавлении пользователя');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;

    try {
      // Удаляем данные пользователя из Firestore
      await deleteDoc(doc(db, 'users', userId));
      showSuccessNotification('Пользователь успешно удален');
    } catch (error) {
      console.error('Error deleting user:', error);
      showErrorNotification('Ошибка при удалении пользователя');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'employee' | 'user') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
      showSuccessNotification('Роль пользователя успешно обновлена');
    } catch (error) {
      showErrorNotification('Ошибка при обновлении роли');
    }
  };

  const handleApprovalChange = async (userId: string, isApproved: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isApproved
      });
      showSuccessNotification(isApproved ? 'Пользователь подтвержден' : 'Подтверждение пользователя отменено');
    } catch (error) {
      showErrorNotification('Ошибка при обновлении статуса пользователя');
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'users':
        return 'Управление пользователями';
      case 'contacts':
        return 'Управление контактами WhatsApp';
      default:
        return 'Панель администратора';
    }
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 space-y-4 sm:space-y-0">
              <div className="flex items-center">
                <button onClick={() => navigate(-1)} className="mr-3 sm:mr-4 p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </button>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{getTabTitle()}</h1>
              </div>
              
              {/* Показываем кнопки только для вкладки пользователей */}
              {activeTab === 'users' && (
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 px-4 py-2 rounded-md flex items-center">
                    <span className="text-sm text-gray-600">Операционный расход:</span>
                    {isEditingExpense ? (
                      <div className="flex items-center ml-2">
                        <input
                          type="number"
                          value={tempExpense}
                          onChange={(e) => setTempExpense(e.target.value)}
                          className="w-32 px-2 py-1 border rounded text-sm"
                          autoFocus
                        />
                        <button
                          onClick={handleUpdateOperationalExpense}
                          className="ml-2 p-1 text-green-600 hover:text-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingExpense(false);
                            setTempExpense(operationalExpense.toString());
                          }}
                          className="ml-2 p-1 text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center ml-2">
                        <span className="font-medium text-gray-900">{formatAmount(operationalExpense)}</span>
                        <button
                          onClick={() => setIsEditingExpense(true)}
                          className="ml-2 p-1 text-gray-600 hover:text-gray-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-emerald-500 text-white text-sm sm:text-base rounded-md hover:bg-emerald-600 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                    <span className="whitespace-nowrap">Добавить пользователя</span>
                  </button>
                </div>
              )}
            </div>

            {/* Вкладки */}
            <div className="flex space-x-8 border-b">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'users'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Пользователи
                </div>
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'contacts'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Контакты WhatsApp
                </div>
              </button>
              <button
                onClick={() => setActiveTab('migration')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'migration'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Миграция данных
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Содержимое вкладок */}
          {activeTab === 'users' && (
            <UserList
              users={users}
              onRoleChange={handleRoleChange}
              onDelete={handleDeleteUser}
              onApprovalChange={handleApprovalChange}
              loading={loading}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactsManager />
          )}

          {activeTab === 'migration' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Миграция и проверка агрегатов клиентов</h2>
              
              <div className="space-y-6">
                {/* Миграция агрегатов */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Миграция агрегатов</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Пересчитывает агрегаты для всех клиентов на основе существующих транзакций.
                    Запускайте только один раз после внедрения системы агрегатов.
                  </p>
                  
                  <button
                    onClick={handleMigrateAggregates}
                    disabled={migrationLoading}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {migrationLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Миграция...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        <span>Запустить миграцию</span>
                      </>
                    )}
                  </button>

                  {migrationResult && (
                    <div className={`mt-4 p-3 rounded-lg ${
                      migrationResult.includes('Ошибка') 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      <p className="text-sm whitespace-pre-line">{migrationResult}</p>
                    </div>
                  )}
                </div>

                {/* Проверка корректности */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Проверка корректности</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Сравнивает агрегаты с пересчетом всех транзакций для проверки корректности данных.
                    Рекомендуется запускать после миграции.
                  </p>
                  
                  <button
                    onClick={handleVerifyAggregates}
                    disabled={verificationLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {verificationLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Проверка...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Проверить корректность</span>
                      </>
                    )}
                  </button>

                  {verificationResult && (
                    <div className={`mt-4 p-3 rounded-lg ${
                      verificationResult.includes('Ошибка') || verificationResult.includes('⚠')
                        ? verificationResult.includes('Ошибка')
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      <p className="text-sm whitespace-pre-line">{verificationResult}</p>
                    </div>
                  )}
                </div>

                {/* Информация */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">ℹ️ Информация</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Миграция создает агрегаты для всех существующих клиентов</li>
                    <li>Проверка сравнивает старый и новый способы расчета</li>
                    <li>Подробные результаты выводятся в консоль браузера (F12)</li>
                    <li>После миграции новые транзакции будут автоматически обновлять агрегаты</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <AddUserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddUser}
        />
      </div>
    </AdminRoute>
  );
};