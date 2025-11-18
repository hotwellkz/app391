import { CalculatorInput, CalculationResult } from '../types/calculator';
import { getConfigSync } from './configLoader';
import { calculateDeliveryCost, calculateTrucksNeeded } from './deliveryData';

// Получить базовую цену за квадратный метр
const getBasePricePerSqm = (area: number): number => {
  const config = getConfigSync();
  const priceRange = config.BASE_PRICES.find((range: any) => area >= range.min && area <= range.max);
  return priceRange ? priceRange.price : 0;
};

// Получить доплату за фундамент
const getFoundationAddition = (foundation: string): number => {
  const config = getConfigSync();
  const option = config.FOUNDATION_OPTIONS.find((opt: any) => opt.label === foundation);
  return option ? (option.value || option.addition || 0) : 0;
};

// Получить доплату за этажность
const getFloorsAddition = (floors: string): number => {
  const config = getConfigSync();
  const option = config.FLOORS_OPTIONS.find((opt: any) => opt.label === floors);
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за тип первого этажа
const getFirstFloorTypeAddition = (firstFloorType: string, floors: string): number => {
  if (floors !== '1 этаж') return 0;
  const config = getConfigSync();
  const option = config.FIRST_FLOOR_TYPE_OPTIONS.find((opt: any) => opt.label === firstFloorType);
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за тип второго этажа
const getSecondFloorTypeAddition = (secondFloorType: string, floors: string): number => {
  if (floors !== '2 этажа' && floors !== '3 этажа') return 0;
  
  // Для 3 этажей автоматически считаем второй этаж "Полноценным"
  const effectiveSecondFloorType = floors === '3 этажа' ? 'Полноценный' : secondFloorType;
  
  const config = getConfigSync();
  const option = config.SECOND_FLOOR_TYPE_OPTIONS.find((opt: any) => opt.label === effectiveSecondFloorType);
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за тип третьего этажа
const getThirdFloorTypeAddition = (thirdFloorType: string, floors: string): number => {
  if (floors !== '3 этажа') return 0;
  const config = getConfigSync();
  const option = config.THIRD_FLOOR_TYPE_OPTIONS.find((opt: any) => opt.label === thirdFloorType);
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за высоту этажа
const getFloorHeightAddition = (height: number): number => {
  const config = getConfigSync();
  const option = config.FLOOR_HEIGHT_OPTIONS.find((opt: any) => opt.value === height);
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за толщину стен
const getWallThicknessAddition = (thickness: number): number => {
  const config = getConfigSync();
  const option = config.WALL_THICKNESS_OPTIONS.find((opt: any) => opt.value === thickness);
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за перегородки на основе высоты
const getPartitionAddition = (partitionType: string, height: number): number => {
  const config = getConfigSync();
  let partitionGroup;
  
  if (height === 2.5) partitionGroup = config.PARTITION_OPTIONS.height_2_5;
  else if (height === 2.8) partitionGroup = config.PARTITION_OPTIONS.height_2_8;
  else if (height === 2.9) partitionGroup = config.PARTITION_OPTIONS.height_2_9;
  else if (height === 3.0) partitionGroup = config.PARTITION_OPTIONS.height_3_0;
  else if (height === 3.5) partitionGroup = config.PARTITION_OPTIONS.height_3_5;
  else if (height === 4.0) partitionGroup = config.PARTITION_OPTIONS.height_4_0;
  else partitionGroup = config.PARTITION_OPTIONS.height_2_5; // fallback
  
  const option = partitionGroup.find((opt: any) => opt.label === partitionType);
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за потолок
const getCeilingAddition = (ceiling: string): number => {
  const config = getConfigSync();
  const option = config.CEILING_OPTIONS.find((opt: any) => opt.label === ceiling);
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за крышу
const getRoofAddition = (roofType: string, floors: string): number => {
  const config = getConfigSync();
  const option = config.ROOF_OPTIONS.find((opt: any) => {
    if (opt.floors && opt.floors !== floors.charAt(0)) return false;
    return opt.label === roofType;
  });
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за форму дома
const getHouseShapeAddition = (houseShape: string): number => {
  const config = getConfigSync();
  const option = config.HOUSE_SHAPE_OPTIONS.find((opt: any) => opt.label === houseShape);
  return option ? (option.addition || 0) : 0;
};

// Получить доплату за дополнительные работы
const getAdditionalWorksAddition = (
  additionalWorks: string, 
  useCustomWorks: boolean = false, 
  customWorks: any[] = []
): number => {
  if (useCustomWorks) {
    // Сумма всех кастомных работ с обработкой форматированных цен
    return customWorks.reduce((sum, work) => {
      const price = typeof work.price === 'string' 
        ? Number(work.price.replace(/\s/g, '')) 
        : Number(work.price);
      return sum + (price || 0);
    }, 0);
  }
  
  const config = getConfigSync();
  const option = config.ADDITIONAL_WORKS_OPTIONS.find((opt: any) => opt.label === additionalWorks);
  return option ? (option.addition || 0) : 0;
};

// Получить стоимость доставки
const getDeliveryCost = (totalArea: number, deliveryCity: string): number => {
  const config = getConfigSync();
  
  // Используем настройки доставки из конфигурации или статичные данные как fallback
  const deliveryOptions = config.DELIVERY_OPTIONS || [];
  const cityOption = deliveryOptions.find((city: any) => city.label === deliveryCity);
  
  if (!cityOption || cityOption.price === 0 || !deliveryCity || deliveryCity === 'Выберите город доставки') {
    return 0;
  }
  
  const trucksNeeded = calculateTrucksNeeded(totalArea);
  return trucksNeeded * cityOption.price;
};

// Основная функция расчета цены
export const calculatePrice = (params: CalculatorInput): CalculationResult => {
  const { area } = params;
  const config = getConfigSync();
  
  // Проверка ограничений площади
  if (area < config.AREA_LIMITS.min || area > config.AREA_LIMITS.max) {
    return {
      fundamentCost: 0,
      kitCost: 0,
      assemblyCost: 0,
      total: 0,
      pricePerSqm: 0,
      deliveryCost: 0
    };
  }

  // Расчет компонентов стоимости согласно формуле
  const basePrice = getBasePricePerSqm(area);
  const foundationAddition = getFoundationAddition(params.foundation);
  const floorsAddition = getFloorsAddition(params.floors);
  const firstFloorTypeAddition = getFirstFloorTypeAddition(params.firstFloorType || '', params.floors);
  const secondFloorTypeAddition = getSecondFloorTypeAddition(params.secondFloorType || '', params.floors);
  const thirdFloorTypeAddition = getThirdFloorTypeAddition(params.thirdFloorType || '', params.floors);
  const firstFloorHeightAddition = getFloorHeightAddition(params.firstFloorHeight);
  const secondFloorHeightAddition = params.secondFloorHeight ? getFloorHeightAddition(params.secondFloorHeight) : 0;
  const thirdFloorHeightAddition = params.thirdFloorHeight ? getFloorHeightAddition(params.thirdFloorHeight) : 0;
  const firstFloorThicknessAddition = getWallThicknessAddition(params.firstFloorThickness);
  const secondFloorThicknessAddition = params.secondFloorThickness ? getWallThicknessAddition(params.secondFloorThickness) : 0;
  const thirdFloorThicknessAddition = params.thirdFloorThickness ? getWallThicknessAddition(params.thirdFloorThickness) : 0;
  const partitionAddition = getPartitionAddition(params.partitionType, params.firstFloorHeight);
  const ceilingAddition = getCeilingAddition(params.ceiling);
  const roofAddition = getRoofAddition(params.roofType, params.floors);
  const houseShapeAddition = getHouseShapeAddition(params.houseShape);
  const additionalWorksAddition = getAdditionalWorksAddition(
    params.additionalWorks, 
    params.useCustomWorks, 
    params.customWorks
  );

  // Формула итогового расчёта
  const pricePerSqm = basePrice + 
                      floorsAddition + 
                      firstFloorHeightAddition + 
                      secondFloorHeightAddition + 
                      thirdFloorHeightAddition + 
                      firstFloorThicknessAddition + 
                      secondFloorThicknessAddition + 
                      thirdFloorThicknessAddition + 
                      firstFloorTypeAddition + 
                      secondFloorTypeAddition + 
                      thirdFloorTypeAddition + 
                      foundationAddition + 
                      roofAddition + 
                      houseShapeAddition + 
                      partitionAddition + 
                      ceilingAddition;

  // Для кастомных работ добавляем их стоимость отдельно (не умножая на площадь)
  const customWorksTotal = params.useCustomWorks ? 
    getAdditionalWorksAddition(params.additionalWorks, params.useCustomWorks, params.customWorks) : 0;
  
  const baseTotalCost = Math.round(pricePerSqm * area);
  const standardAdditionalWorksTotal = !params.useCustomWorks ? 
    Math.round(getAdditionalWorksAddition(params.additionalWorks) * area) : 0;
  
  // Расчет стоимости доставки
  const deliveryCost = params.deliveryCity ? getDeliveryCost(area, params.deliveryCity) : 0;
  
  const total = baseTotalCost + standardAdditionalWorksTotal + customWorksTotal + deliveryCost;

  // Разбивка итоговой стоимости (доставка не входит в разбивку)
  const costWithoutDelivery = baseTotalCost + standardAdditionalWorksTotal + customWorksTotal;
  const fundamentCost = Math.round(costWithoutDelivery * config.COST_BREAKDOWN.foundation);
  const kitCost = Math.round(costWithoutDelivery * config.COST_BREAKDOWN.houseKit);
  const assemblyCost = Math.round(costWithoutDelivery * config.COST_BREAKDOWN.assembly);

  return {
    fundamentCost,
    kitCost,
    assemblyCost,
    total,
    pricePerSqm: Math.round(pricePerSqm),
    deliveryCost
  };
}; 