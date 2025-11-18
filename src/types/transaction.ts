import { User } from './user';

export interface TransactionFile {
  id: string;
  transactionId: string;
  name: string;
  url: string;
  type: string;
  size: number;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  fromUser: string;
  toUser: string;
  amount: number;
  description: string;
  date: any;
  type: 'income' | 'expense';
  categoryId: string;
  isSalary?: boolean;
  waybillNumber?: string;
  waybillData?: {
    documentNumber: string;
    date: string;
    project: string;
    note: string;
    items: Array<{
      product: {
        name: string;
        unit: string;
      };
      quantity: number;
      price: number;
    }>;
  };
  photos?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
    path: string;
  }>;
  files?: TransactionFile[];
}

export interface GroupedTransactions {
  [key: string]: Transaction[];
}