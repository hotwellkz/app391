import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Employee, EmployeeFormData } from '../types/employee';
import { EmployeeList } from '../components/employees/EmployeeList';
import { EmployeeForm } from '../components/employees/EmployeeForm';
import { DeleteEmployeeModal } from '../components/employees/DeleteEmployeeModal';
import { TransactionHistory } from '../components/transactions/history/TransactionHistory';
import { EmployeeContract } from '../components/employees/EmployeeContract';
import { CategoryCardType } from '../types';
import { createEmployee, updateEmployee, deleteEmployeeWithHistory, deleteEmployeeOnly } from '../services/employeeService';
import { showErrorNotification } from '../utils/notifications';
import { useEmployees } from '../hooks/useEmployees';
import { useEmployeeFilters } from '../hooks/useEmployeeFilters';
import { useEmployeeStats } from '../hooks/useEmployeeStats';
import { EmployeeSearchBar } from '../components/employees/EmployeeSearchBar';
import { EmployeeStatusFilter } from '../components/employees/EmployeeStatusFilter';
import { EmployeeStats } from '../components/employees/EmployeeStats';
import { useEmployeeHistory } from '../hooks/useEmployeeHistory';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { Navigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AdminRoute } from '../components/auth/AdminRoute';

export const Employees: React.FC = () => {
  const { isAdmin, loading: adminCheckLoading } = useIsAdmin();
  const { employees, loading } = useEmployees();
  const { 
    searchQuery, 
    setSearchQuery, 
    statusFilter, 
    setStatusFilter, 
    filteredEmployees 
  } = useEmployeeFilters(employees);
  
  const stats = useEmployeeStats(employees);
  
  const { 
    selectedCategory,
    showHistory,
    handleViewHistory,
    handleCloseHistory 
  } = useEmployeeHistory();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const navigate = useNavigate();

  if (adminCheckLoading) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  const handleSave = async (formData: EmployeeFormData) => {
    try {
      await createEmployee(formData);
      setShowAddForm(false);
    } catch (error) {
      showErrorNotification(error instanceof Error ? error.message : 'Произошла ошибка при сохранении');
    }
  };

  const handleUpdate = async (formData: EmployeeFormData) => {
    if (!selectedEmployee) return;

    try {
      await updateEmployee(selectedEmployee.id, formData);
      setShowEditForm(false);
      setSelectedEmployee(null);
    } catch (error) {
      showErrorNotification(error instanceof Error ? error.message : 'Произошла ошибка при обновлении');
    }
  };

  const handleDeleteWithHistory = async () => {
    if (!selectedEmployee) return;

    try {
      await deleteEmployeeWithHistory(selectedEmployee);
      setShowDeleteModal(false);
      setSelectedEmployee(null);
    } catch (error) {
      showErrorNotification(error instanceof Error ? error.message : 'Произошла ошибка при удалении');
    }
  };

  const handleDeleteIconOnly = async () => {
    if (!selectedEmployee) return;

    try {
      await deleteEmployeeOnly(selectedEmployee);
      setShowDeleteModal(false);
      setSelectedEmployee(null);
    } catch (error) {
      showErrorNotification(error instanceof Error ? error.message : 'Произошла ошибка при удалении');
    }
  };

  const handleViewContract = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowContract(true);
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col">
              <div className="mb-6">
                <div className="flex items-center mb-2 px-2 sm:px-0">
                  <button
                    onClick={() => navigate(-1)}
                    className="mr-2 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                  </button>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Сотрудники</h1>
                </div>
                
                <EmployeeStats
                  totalEmployees={stats.total}
                  activeEmployees={stats.active}
                  inactiveEmployees={stats.inactive}
                  totalSalary={stats.totalSalary}
                />

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 px-2 sm:px-0">
                  <EmployeeSearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                  />
                  <div className="flex gap-2">
                    <EmployeeStatusFilter
                      value={statusFilter}
                      onChange={setStatusFilter}
                    />
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center whitespace-nowrap"
                    >
                      <Plus className="w-5 h-5 mr-1" />
                      <span className="hidden sm:inline">Добавить сотрудника</span>
                      <span className="sm:hidden">Добавить</span>
                    </button>
                  </div>
                </div>
              </div>

              <EmployeeList
                employees={filteredEmployees}
                onEdit={(employee) => {
                  setSelectedEmployee(employee);
                  setShowEditForm(true);
                }}
                onDelete={(employee) => {
                  setSelectedEmployee(employee);
                  setShowDeleteModal(true);
                }}
                onViewHistory={handleViewHistory}
                onViewContract={(employee) => {
                  setSelectedEmployee(employee);
                  setShowContract(true);
                }}
              />
            </div>
          </div>
        </div>

        <EmployeeForm
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSave={handleSave}
        />

        {selectedEmployee && (
          <>
            <EmployeeForm
              isOpen={showEditForm}
              onClose={() => {
                setShowEditForm(false);
                setSelectedEmployee(null);
              }}
              onSave={handleUpdate}
              employee={selectedEmployee}
            />

            <DeleteEmployeeModal
              isOpen={showDeleteModal}
              onClose={() => {
                setShowDeleteModal(false);
                setSelectedEmployee(null);
              }}
              onDeleteWithHistory={handleDeleteWithHistory}
              onDeleteIconOnly={handleDeleteIconOnly}
              employeeName={`${selectedEmployee.lastName} ${selectedEmployee.firstName}`}
            />

            <EmployeeContract
              isOpen={showContract}
              onClose={() => {
                setShowContract(false);
                setSelectedEmployee(null);
              }}
              employee={selectedEmployee}
            />
          </>
        )}

        {showHistory && selectedCategory && (
          <TransactionHistory
            category={selectedCategory}
            isOpen={showHistory}
            onClose={handleCloseHistory}
          />
        )}
      </div>
    </AdminRoute>
  );
};