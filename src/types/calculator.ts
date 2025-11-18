// Интерфейс для кастомной дополнительной работы
export interface CustomWork {
  name: string;
  price: number | string;
}

// Интерфейс входных данных для калькулятора
export interface CalculatorInput {
  area: number;
  foundation: string;
  floors: string;
  firstFloorType?: string;
  secondFloorType?: string;
  thirdFloorType?: string;
  firstFloorHeight: number;
  secondFloorHeight?: number;
  thirdFloorHeight?: number;
  firstFloorThickness: number;
  secondFloorThickness?: number;
  thirdFloorThickness?: number;
  partitionType: string;
  ceiling: string;
  roofType: string;
  houseShape: string;
  additionalWorks: string;
  useCustomWorks?: boolean;
  customWorks?: CustomWork[];
  deliveryCity?: string;
}

// Результат расчета стоимости
export interface CalculationResult {
  fundamentCost: number;
  kitCost: number;
  assemblyCost: number;
  total: number;
  pricePerSqm: number;
  deliveryCost?: number;
}

// Состояние формы калькулятора
export interface CalculatorState {
  area: string;
  foundation: string;
  floors: string;
  firstFloorType: string;
  secondFloorType: string;
  thirdFloorType: string;
  firstFloorHeight: string;
  secondFloorHeight: string;
  thirdFloorHeight: string;
  firstFloorThickness: string;
  secondFloorThickness: string;
  thirdFloorThickness: string;
  partitionType: string;
  ceiling: string;
  roofType: string;
  houseShape: string;
  additionalWorks: string;
  useCustomWorks: boolean;
  customWorks: CustomWork[];
  deliveryCity: string;
}

// Опции выпадающих списков
export interface SelectOption {
  label: string;
  value: string | number;
  addition?: number;
  floors?: string;
}

export interface CostBreakdown {
  foundation: number;
  houseKit: number;
  assembly: number;
}