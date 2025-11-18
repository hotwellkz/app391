import { useMemo } from 'react';
import { Employee } from '../types/employee';

export const useEmployeeStats = (employees: Employee[]) => {
  return useMemo(() => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'active').length;
    const inactiveEmployees = employees.filter(e => e.status === 'inactive').length;
    const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0);

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      totalSalary
    };
  }, [employees]);
};