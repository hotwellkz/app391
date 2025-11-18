// Интерфейс для городов доставки
export interface DeliveryOption {
  label: string;
  price: number; // цена за одну фуру
}

// Города Казахстана для доставки
export const DELIVERY_CITIES: DeliveryOption[] = [
  { label: 'Выберите город доставки', price: 0 },
  { label: 'Алматы', price: 0 },
  { label: 'Астана', price: 646350 },
  { label: 'Шымкент', price: 330000 },
  { label: 'Караганда', price: 550000 },
  { label: 'Актау', price: 1300000 },
  { label: 'Актобе', price: 1000000 },
  { label: 'Костанай', price: 900000 },
  { label: 'Кызылорда', price: 530000 },
  { label: 'Павлодар', price: 670000 },
  { label: 'Усть-Каменогорск', price: 510000 },
  { label: 'Талдыкорган', price: 125000 },
  { label: 'Тараз', price: 240000 },
  { label: 'Петропавловск', price: 800000 },
  { label: 'Экибастуз', price: 612000 },
  { label: 'Семей', price: 527000 },
  { label: 'Темиртау', price: 488000 },
  { label: 'Жезказган', price: 726000 },
  { label: 'Туркестан', price: 395000 },
  { label: 'Кокшетау', price: 715000 },
  { label: 'Балхаш', price: 300000 }
];

// Функция расчета количества фур на основе площади
export const calculateTrucksNeeded = (totalArea: number): number => {
  return Math.ceil(totalArea / 150);
};

// Функция расчета стоимости доставки
export const calculateDeliveryCost = (totalArea: number, deliveryCity: string): number => {
  const cityOption = DELIVERY_CITIES.find(city => city.label === deliveryCity);
  if (!cityOption || cityOption.price === 0 || !deliveryCity || deliveryCity === 'Выберите город доставки') {
    return 0;
  }
  
  const trucksNeeded = calculateTrucksNeeded(totalArea);
  return trucksNeeded * cityOption.price;
}; 