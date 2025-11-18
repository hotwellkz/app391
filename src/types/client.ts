import { ContractData } from './contract';
import { Timestamp } from 'firebase/firestore';

export interface ClientFile {
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date | Timestamp;
  path: string;
}

export interface Client {
  floors?: string; // этажность для EstimateBlock
  id: string;
  name: string;
  phone: string;
  objectName: string;
  address?: string;
  comment?: string;
  clientNumber: string;
  firstName: string;
  year: number;
  status: 'building' | 'deposit' | 'built';
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  files?: Array<ClientFile>;
  isIconsVisible: boolean;
  order: number;
  lastName?: string;
  middleName?: string;
  email: string;
  iin: string;
  constructionAddress?: string;
  livingAddress: string;
  constructionDays: number;
  startDate?: string; // дата начала строительства
  buildDays?: number; // количество дней для строительства (по умолчанию 45)
  categoryChangeDate?: string; // дата перевода в статус "Строим"
  totalAmount?: number;
  deposit: number;
  firstPayment?: number;
  secondPayment?: number;
  thirdPayment?: number;
  fourthPayment?: number;
  totalAmountWords: string;
  firstPaymentWords: string;
  secondPaymentWords: string;
  thirdPaymentWords: string;
  fourthPaymentWords: string;
  depositWords: string;
  additionalWorks: string;
  currentDate: string;
}

export type NewClient = Omit<Client, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export const initialClientState: NewClient = {
  floors: '2 эт',
  clientNumber: '',
  firstName: '',
  objectName: '',
  name: '',
  year: new Date().getFullYear(),
  status: 'deposit',
  isIconsVisible: true,
  order: 0,
  lastName: '',
  phone: '',
  middleName: '',
  email: '',
  iin: '',
  constructionAddress: '',
  livingAddress: '',
  constructionDays: 0,
  startDate: '', // дата начала строительства
  buildDays: 45, // количество дней для строительства по умолчанию
  categoryChangeDate: '', // дата перевода в статус "Строим"
  totalAmount: 0,
  totalAmountWords: '',
  deposit: 0,
  firstPayment: 0,
  firstPaymentWords: '',
  secondPayment: 0,
  secondPaymentWords: '',
  thirdPayment: 0,
  thirdPaymentWords: '',
  fourthPayment: 0,
  fourthPaymentWords: '',
  depositWords: '',
  additionalWorks: '',
  currentDate: ''
};