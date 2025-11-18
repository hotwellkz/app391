import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, addCategory } from '../lib/firebase';
import { NewEmployee, initialEmployeeState, Employee } from '../types/employee';

interface EmployeeFormProps {
  employeeId?: string;
  onBack: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ employeeId, onBack }) => {
  const [formData, setFormData] = useState<NewEmployee>(initialEmployeeState);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(!!employeeId);

  useEffect(() => {
    const loadEmployee = async () => {
      if (!employeeId) return;

      try {
        const employeeDoc = await getDoc(doc(db, 'employees', employeeId));
        if (employeeDoc.exists()) {
          const data = employeeDoc.data() as Employee;
          setFormData({
            lastName: data.lastName,
            firstName: data.firstName,
            middleName: data.middleName,
            iin: data.iin,
            phone: data.phone,
            position: data.position,
            salary: data.salary,
            email: data.email
          });
        }
      } catch (error) {
        console.error('Error loading employee:', error);
        alert('Ошибка при загрузке данных сотрудника');
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployee();
  }, [employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (employeeId) {
        // Обновляем существующего сотрудника
        await updateDoc(doc(db, 'employees', employeeId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        // Создаем нового сотрудника
        const employeeRef = await addDoc(collection(db, 'employees'), {
          ...formData,
          createdAt: serverTimestamp()
        });

        // Создаем категорию для сотрудника
        await addCategory({
          title: `${formData.lastName} ${formData.firstName}`,
          icon: 'User',
          color: 'bg-amber-400',
          row: 2
        });
      }

      onBack();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Ошибка при сохранении данных сотрудника');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'salary' ? Number(value) : value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button onClick={onBack} className="mr-4">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">
              {employeeId ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Фамилия
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Отчество
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ИИН
                </label>
                <input
                  type="text"
                  name="iin"
                  value={formData.iin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500"
                  required
                  maxLength={12}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Должность
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Заработная плата
                </label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
              >
                {loading ? 'Сохранение...' : employeeId ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};