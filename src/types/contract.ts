export interface ContractTemplate {
  id: string;
  title: string;
  description: string;
  lastModified: string;
  content: string;
  placeholders: string[];
}

export interface ContractData {
  clientNumber: string;
  lastName: string;
  firstName: string;
  middleName: string;
  iin: string;
  phone: string;
  email: string;
  constructionAddress: string;
  livingAddress: string;
  objectName: string;
  constructionDays: number;
  totalAmount: number;
  totalAmountWords: string;
  deposit: number;
  depositWords: string;
  firstPayment: number;
  firstPaymentWords: string;
  secondPayment: number;
  secondPaymentWords: string;
  thirdPayment: number;
  thirdPaymentWords: string;
  fourthPayment: number;
  fourthPaymentWords: string;
  additionalWorks: string;
  currentDate: string;
  estimateData?: {
    totalAmount: number;
    materials: Array<{
      name: string;
      quantity: number;
      unit: string;
      price: number;
    }>;
    works: Array<{
      name: string;
      quantity: number;
      unit: string;
      price: number;
    }>;
  };
}

export interface Contract {
  id: string;
  templateId: string;
  clientId: string;
  data: ContractData;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'completed';
} 