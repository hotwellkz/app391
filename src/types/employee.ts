interface Employee {
  id: string;
  lastName: string;
  firstName: string;
  middleName: string;
  iin: string;
  phone: string;
  position: string;
  salary: number;
  email: string;
  status: 'active' | 'inactive';
  createdAt: any;
  contractNumber?: string;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
}

interface EmployeeFormData {
  lastName: string;
  firstName: string;
  middleName: string;
  iin: string;
  phone: string;
  position: string;
  salary: number;
  email: string;
  status: 'active' | 'inactive';
}

const initialEmployeeFormData: EmployeeFormData = {
  lastName: '',
  firstName: '',
  middleName: '',
  iin: '',
  phone: '',
  position: '',
  salary: 0,
  email: '',
  status: 'active'
};

export type { Employee, EmployeeFormData };
export { initialEmployeeFormData };