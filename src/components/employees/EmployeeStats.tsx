import React from 'react';
import { Users, UserCheck, UserMinus, DollarSign } from 'lucide-react';

interface EmployeeStatsProps {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  totalSalary: number;
}

export const EmployeeStats: React.FC<EmployeeStatsProps> = ({
  totalEmployees,
  activeEmployees,
  inactiveEmployees,
  totalSalary
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6 px-2 sm:px-0">
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center">
          <div className="p-2 sm:p-3 rounded-full bg-amber-100 mr-2 sm:mr-4">
            <Users className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-gray-500 text-xs sm:text-sm">Всего</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900">{totalEmployees}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center">
          <div className="p-2 sm:p-3 rounded-full bg-green-100 mr-2 sm:mr-4">
            <UserCheck className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
          </div>
          <div>
            <p className="text-gray-500 text-xs sm:text-sm">Активные</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900">{activeEmployees}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center">
          <div className="p-2 sm:p-3 rounded-full bg-red-100 mr-2 sm:mr-4">
            <UserMinus className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
          </div>
          <div>
            <p className="text-gray-500 text-xs sm:text-sm">Неактивные</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900">{inactiveEmployees}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center">
          <div className="p-2 sm:p-3 rounded-full bg-blue-100 mr-2 sm:mr-4">
            <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-gray-500 text-xs sm:text-sm">Зарплата</p>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900">{totalSalary.toLocaleString('ru-RU')} ₸</p>
          </div>
        </div>
      </div>
    </div>
  );
};