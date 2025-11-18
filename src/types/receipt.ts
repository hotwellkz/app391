export interface ReceiptSettings {
  includeFinishing: boolean;
}

export interface ReceiptData {
  operationalExpense: number;
  sipWalls: number;
  ceilingInsulation: number;
  generalExpense: number;
  contractPrice: number;
  totalExpense: number;
  netProfit: number;
}

export interface ReceiptCalculationProps {
  clientId: string;
  isEditing?: boolean;
}