import React from 'react';
import { Building2, Mail, Phone, Calendar, DollarSign, History, Edit2, Trash2, Pencil } from 'lucide-react';
import { Employee } from '../../types/employee';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useState, useEffect } from 'react';
import { showErrorNotification } from '../../utils/notifications';

interface EmployeeCardProps {
  employee: Employee;
  onEdit: () => void;
  onDelete: () => void;
  onViewHistory: () => void;
  onViewContract: () => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onEdit,
  onDelete,
  onViewHistory,
  onViewContract
}) => {
  const [amount, setAmount] = useState('0 ₸');
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [editAmount, setEditAmount] = useState('');

  useEffect(() => {
    const fetchAmount = async () => {
      try {
        const categoriesQuery = query(
          collection(db, 'categories'),
          where('title', '==', `${employee.lastName} ${employee.firstName}`),
          where('row', '==', 2)
        );
        
        const snapshot = await getDocs(categoriesQuery);
        if (!snapshot.empty) {
          setAmount(snapshot.docs[0].data().amount);
        }
      } catch (error) {
        console.error('Error fetching amount:', error);
      }
    };

    fetchAmount();

    // Подписываемся на изменения категории
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'categories'),
        where('title', '==', `${employee.lastName} ${employee.firstName}`),
        where('row', '==', 2)
      ),
      (snapshot) => {
        if (!snapshot.empty) {
          setAmount(snapshot.docs[0].data().amount);
        }
      }
    );

    return () => unsubscribe();
  }, [employee]);

  const handleAmountSubmit = async () => {
    try {
      const categoriesQuery = query(
        collection(db, 'categories'),
        where('title', '==', `${employee.lastName} ${employee.firstName}`),
        where('row', '==', 2)
      );
      
      const snapshot = await getDocs(categoriesQuery);
      if (!snapshot.empty) {
        const categoryRef = doc(db, 'categories', snapshot.docs[0].id);
        await updateDoc(categoryRef, {
          amount: `${parseFloat(editAmount).toLocaleString('ru-RU')} ₸`
        });
        setIsEditingAmount(false);
        showErrorNotification('Сумма успешно обновлена');
      }
    } catch (error) {
      console.error('Error updating amount:', error);
      showErrorNotification('Ошибка при обновлении суммы');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Не указано';
    return new Date(date.seconds * 1000).toLocaleDateString('ru-RU');
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-all duration-200">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-0 mb-4">
          <div className="flex items-start">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                {employee.lastName} {employee.firstName}
              </h3>
              <span className={'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ' + 
                (employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                {employee.status === 'active' ? 'Активный' : 'Неактивный'}
              </span>
            </div>
          </div>
          <div className="flex space-x-1 sm:space-x-2 ml-13 sm:ml-0">
            <button
              onClick={onViewHistory}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
              title="История"
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
              title="Редактировать"
            >
              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
              title="Удалить"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center text-sm">
            <Building2 className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
            <span className="text-gray-600 truncate">{employee.position}</span>
          </div>
          <div className="flex items-center text-sm">
            <Phone className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
            <span className="text-gray-600 truncate">{employee.phone}</span>
          </div>
          <div className="flex items-center text-sm">
            <Mail className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
            <span className="text-gray-600 truncate">{employee.email}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-2">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-gray-400 mr-1" />
              <span className="text-gray-500">Дата:</span>
              <span className="text-gray-900 ml-2">{formatDate(employee.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
              <span className="text-gray-500">Баланс:</span>
              <div className="flex items-center ml-2">
                {isEditingAmount ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editAmount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d.-]/g, '');
                        if (value === '' || !isNaN(Number(value))) {
                          setEditAmount(value);
                        }
                      }}
                      className="w-20 sm:w-24 px-2 py-1 border rounded text-sm"
                      placeholder="0"
                      autoFocus
                    />
                    <button
                      onClick={handleAmountSubmit}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setIsEditingAmount(false)}
                      className="text-red-600 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-900">{amount}</span>
                    <button
                      onClick={() => {
                        setEditAmount(amount.replace(/[^\d.-]/g, ''));
                        setIsEditingAmount(true);
                      }}
                      className="text-gray-400 hover:text-gray-600 ml-1"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};