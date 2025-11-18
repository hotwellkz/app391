import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import * as defaultConfig from './calculatorData';
import { DELIVERY_CITIES } from './deliveryData';

let cachedConfig: any = null;
let configPromise: Promise<any> | null = null;

export const loadCalculatorConfig = async () => {
  // Если конфигурация уже кэширована, возвращаем её
  if (cachedConfig) {
    return cachedConfig;
  }

  // Если уже идет загрузка, ждем её завершения
  if (configPromise) {
    return configPromise;
  }

  configPromise = (async () => {
    try {
      const configDoc = await getDoc(doc(db, 'settings', 'calculator_config'));
      
      if (configDoc.exists()) {
        console.log('🔧 Загружена конфигурация калькулятора из Firebase');
        cachedConfig = configDoc.data();
        // Если DELIVERY_OPTIONS не существует, добавляем из дефолтных данных
        if (!cachedConfig.DELIVERY_OPTIONS) {
          cachedConfig.DELIVERY_OPTIONS = [...DELIVERY_CITIES];
        }
      } else {
        console.log('📝 Используется конфигурация калькулятора по умолчанию');
        cachedConfig = {
          BASE_PRICES: defaultConfig.BASE_PRICES,
          FOUNDATION_OPTIONS: defaultConfig.FOUNDATION_OPTIONS,
          FLOORS_OPTIONS: defaultConfig.FLOORS_OPTIONS,
          FIRST_FLOOR_TYPE_OPTIONS: defaultConfig.FIRST_FLOOR_TYPE_OPTIONS,
          SECOND_FLOOR_TYPE_OPTIONS: defaultConfig.SECOND_FLOOR_TYPE_OPTIONS,
          THIRD_FLOOR_TYPE_OPTIONS: defaultConfig.THIRD_FLOOR_TYPE_OPTIONS,
          FLOOR_HEIGHT_OPTIONS: defaultConfig.FLOOR_HEIGHT_OPTIONS,
          WALL_THICKNESS_OPTIONS: defaultConfig.WALL_THICKNESS_OPTIONS,
          PARTITION_OPTIONS: defaultConfig.PARTITION_OPTIONS,
          CEILING_OPTIONS: defaultConfig.CEILING_OPTIONS,
          ROOF_OPTIONS: defaultConfig.ROOF_OPTIONS,
          HOUSE_SHAPE_OPTIONS: defaultConfig.HOUSE_SHAPE_OPTIONS,
          ADDITIONAL_WORKS_OPTIONS: defaultConfig.ADDITIONAL_WORKS_OPTIONS,
          DELIVERY_OPTIONS: [...DELIVERY_CITIES],
          COST_BREAKDOWN: defaultConfig.COST_BREAKDOWN,
          AREA_LIMITS: defaultConfig.AREA_LIMITS
        };
      }
      
      return cachedConfig;
    } catch (error) {
      console.error('❌ Ошибка загрузки конфигурации, используем значения по умолчанию:', error);
      cachedConfig = {
        BASE_PRICES: defaultConfig.BASE_PRICES,
        FOUNDATION_OPTIONS: defaultConfig.FOUNDATION_OPTIONS,
        FLOORS_OPTIONS: defaultConfig.FLOORS_OPTIONS,
        FIRST_FLOOR_TYPE_OPTIONS: defaultConfig.FIRST_FLOOR_TYPE_OPTIONS,
        SECOND_FLOOR_TYPE_OPTIONS: defaultConfig.SECOND_FLOOR_TYPE_OPTIONS,
        THIRD_FLOOR_TYPE_OPTIONS: defaultConfig.THIRD_FLOOR_TYPE_OPTIONS,
        FLOOR_HEIGHT_OPTIONS: defaultConfig.FLOOR_HEIGHT_OPTIONS,
        WALL_THICKNESS_OPTIONS: defaultConfig.WALL_THICKNESS_OPTIONS,
        PARTITION_OPTIONS: defaultConfig.PARTITION_OPTIONS,
        CEILING_OPTIONS: defaultConfig.CEILING_OPTIONS,
        ROOF_OPTIONS: defaultConfig.ROOF_OPTIONS,
        HOUSE_SHAPE_OPTIONS: defaultConfig.HOUSE_SHAPE_OPTIONS,
        ADDITIONAL_WORKS_OPTIONS: defaultConfig.ADDITIONAL_WORKS_OPTIONS,
        DELIVERY_OPTIONS: [...DELIVERY_CITIES],
        COST_BREAKDOWN: defaultConfig.COST_BREAKDOWN,
        AREA_LIMITS: defaultConfig.AREA_LIMITS
      };
      return cachedConfig;
    } finally {
      configPromise = null;
    }
  })();

  return configPromise;
};

// Функция для сброса кэша (вызывается после сохранения конфигурации)
export const clearConfigCache = () => {
  cachedConfig = null;
  configPromise = null;
  console.log('🔄 Кэш конфигурации калькулятора очищен');
};

// Синхронная функция для получения конфигурации (если она уже загружена)
export const getConfigSync = () => {
  return cachedConfig || {
    BASE_PRICES: defaultConfig.BASE_PRICES,
    FOUNDATION_OPTIONS: defaultConfig.FOUNDATION_OPTIONS,
    FLOORS_OPTIONS: defaultConfig.FLOORS_OPTIONS,
    FIRST_FLOOR_TYPE_OPTIONS: defaultConfig.FIRST_FLOOR_TYPE_OPTIONS,
    SECOND_FLOOR_TYPE_OPTIONS: defaultConfig.SECOND_FLOOR_TYPE_OPTIONS,
    THIRD_FLOOR_TYPE_OPTIONS: defaultConfig.THIRD_FLOOR_TYPE_OPTIONS,
    FLOOR_HEIGHT_OPTIONS: defaultConfig.FLOOR_HEIGHT_OPTIONS,
    WALL_THICKNESS_OPTIONS: defaultConfig.WALL_THICKNESS_OPTIONS,
    PARTITION_OPTIONS: defaultConfig.PARTITION_OPTIONS,
    CEILING_OPTIONS: defaultConfig.CEILING_OPTIONS,
    ROOF_OPTIONS: defaultConfig.ROOF_OPTIONS,
    HOUSE_SHAPE_OPTIONS: defaultConfig.HOUSE_SHAPE_OPTIONS,
    ADDITIONAL_WORKS_OPTIONS: defaultConfig.ADDITIONAL_WORKS_OPTIONS,
    DELIVERY_OPTIONS: [...DELIVERY_CITIES],
    COST_BREAKDOWN: defaultConfig.COST_BREAKDOWN,
    AREA_LIMITS: defaultConfig.AREA_LIMITS
  };
}; 