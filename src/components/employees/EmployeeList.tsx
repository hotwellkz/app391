import React from 'react';
import { Employee } from '../../types/employee';
import { EmployeeCard } from './EmployeeCard';

interface EmployeeListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onViewHistory: (employee: Employee) => void;
  onViewContract: (employee: Employee) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  onEdit,
  onDelete,
  onViewHistory,
  onViewContract
}) => {
  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Нет сотрудников</h3>
        <p className="text-gray-500">Добавьте первого сотрудника</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-4">
      {employees.map((employee) => (
        <div key={employee.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <EmployeeCard
            employee={employee}
            onEdit={() => onEdit(employee)}
            onDelete={() => onDelete(employee)}
            onViewHistory={() => onViewHistory(employee)}
            onViewContract={() => onViewContract(employee)}
          />
        </div>
      ))}
    </div>
  );
};