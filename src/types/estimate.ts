export interface EstimateValue {
  value: number;
  isChecked: boolean;
}

export interface EstimateValues {
  [key: string]: EstimateValue;
}

export interface EstimateRow {
  label: string;
  value: number | string;
  unit?: string;
  isHeader?: boolean;
  isRed?: boolean;
  isChecked?: boolean;
  onChange?: (value: number) => void;
  onCheckChange?: (checked: boolean) => void;
}

export interface ConsumablesEstimateItem {
  name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ConsumablesEstimateData {
  items: ConsumablesEstimateItem[];
  totalMaterialsCost: number;
  totalCost: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface FoundationEstimateItem {
  name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
}

export interface FoundationEstimateData {
  items: FoundationEstimateItem[];
  totalMaterialsCost: number;
  foundationWorkCost: number;
  totalCost: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface AdditionalWorksEstimateItem {
  name: string;
  total: number;
  isReadOnly?: boolean;
}

export interface AdditionalWorksEstimateData {
  items: AdditionalWorksEstimateItem[];
  totalCost: number;
  grandTotal: number;
  createdAt?: any;
  updatedAt?: any;
}