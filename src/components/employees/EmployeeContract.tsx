import React from 'react';
import { X, Download, FileText } from 'lucide-react';
import { Employee } from '../../types/employee';
import { downloadEmployeeContract } from '../../services/contractService';
import { showErrorNotification } from '../../utils/notifications';

interface EmployeeContractProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeContract: React.FC<EmployeeContractProps> = ({
  employee,
  isOpen,
  onClose
}) => {
  const handleDownload = async () => {
    try {
      await downloadEmployeeContract(employee);
    } catch (error) {
      showErrorNotification('Не удалось скачать договор');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-semibold">Трудовой договор</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Информация о сотруднике</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ФИО</p>
                <p className="font-medium">{employee.lastName + ' ' + employee.firstName + ' ' + employee.middleName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ИИН</p>
                <p className="font-medium">{employee.iin}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Должность</p>
                <p className="font-medium">{employee.position}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Заработная плата</p>
                <p className="font-medium">{employee.salary.toLocaleString()} ₸</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
            >
              <Download className="w-5 h-5 mr-2" />
              Скачать договор
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};