export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  order: number;
}

export interface NewProduct {
  name: string;
  unit: string;
  price: number;
  order: number;
}

export const PREDEFINED_UNITS = [
  { value: 'метр', label: 'Метр' },
  { value: 'шт', label: 'Шт' },
  { value: 'кг', label: 'Кг' },
  { value: 'меш', label: 'Меш' },
  { value: 'маш', label: 'Маш' },
  { value: 'рулон', label: 'Рулон' },
  { value: 'бухта', label: 'Бухта' },
  { value: 'пачка', label: 'Пачка' },
  { value: 'балон', label: 'Балон' },
  { value: 'лист', label: 'Лист' },
  { value: 'м2', label: 'М²' },
  { value: 'м3', label: 'М³' }
] as const;