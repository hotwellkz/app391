import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Plus, Trash2, ChevronDown, ChevronUp, Copy, Download } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { clearConfigCache } from '../../utils/configLoader';
import { DeliveryOption, DELIVERY_CITIES } from '../../utils/deliveryData';

interface PriceRange {
  min: number;
  max: number;
  price: number;
}

interface CalculatorOption {
  label: string;
  value?: number | string;
  addition?: number;
  floors?: string;
}

interface WallThicknessOption {
  label: string;
  value: number;
  addition: number;
}

interface PartitionOptions {
  height_2_5: CalculatorOption[];
  height_2_8: CalculatorOption[];
  height_2_9: CalculatorOption[];
  height_3_0: CalculatorOption[];
  height_3_5: CalculatorOption[];
  height_4_0: CalculatorOption[];
}

interface CostBreakdown {
  foundation: number;
  houseKit: number;
  assembly: number;
}

interface CalculatorConfig {
  BASE_PRICES: PriceRange[];
  FOUNDATION_OPTIONS: CalculatorOption[];
  FLOORS_OPTIONS: CalculatorOption[];
  FIRST_FLOOR_TYPE_OPTIONS: CalculatorOption[];
  SECOND_FLOOR_TYPE_OPTIONS: CalculatorOption[];
  THIRD_FLOOR_TYPE_OPTIONS: CalculatorOption[];
  FLOOR_HEIGHT_OPTIONS: CalculatorOption[];
  WALL_THICKNESS_OPTIONS: WallThicknessOption[];
  PARTITION_OPTIONS: PartitionOptions;
  CEILING_OPTIONS: CalculatorOption[];
  ROOF_OPTIONS: CalculatorOption[];
  HOUSE_SHAPE_OPTIONS: CalculatorOption[];
  ADDITIONAL_WORKS_OPTIONS: CalculatorOption[];
  DELIVERY_OPTIONS?: DeliveryOption[];
  COST_BREAKDOWN: CostBreakdown;
  AREA_LIMITS: { min: number; max: number };
}

interface CalculatorAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorAdminPanel: React.FC<CalculatorAdminPanelProps> = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();
  const [config, setConfig] = useState<CalculatorConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['base_prices']));
  const [priceChangePercent, setPriceChangePercent] = useState<string>('');

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadConfig();
    }
  }, [isOpen, isAdmin]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const configDoc = await getDoc(doc(db, 'settings', 'calculator_config'));
      
      if (configDoc.exists()) {
        const data = configDoc.data() as CalculatorConfig;
        // Если DELIVERY_OPTIONS не существует, добавляем из дефолтных данных
        if (!data.DELIVERY_OPTIONS) {
          data.DELIVERY_OPTIONS = [...DELIVERY_CITIES];
        }
        setConfig(data);
      } else {
        // Загружаем дефолтную конфигурацию из calculatorData
        const defaultConfig = await import('../../utils/calculatorData');
        setConfig({
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
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки конфигурации:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      await setDoc(doc(db, 'settings', 'calculator_config'), config);
      clearConfigCache();
      alert('Конфигурация сохранена успешно! Изменения применятся при следующем расчёте.');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка при сохранении конфигурации');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
      await loadConfig();
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateBasePrices = (index: number, field: keyof PriceRange, value: number) => {
    if (!config) return;
    const newBasePrices = [...config.BASE_PRICES];
    newBasePrices[index] = { ...newBasePrices[index], [field]: value };
    setConfig({ ...config, BASE_PRICES: newBasePrices });
  };

  const addPriceRange = () => {
    if (!config) return;
    const lastRange = config.BASE_PRICES[config.BASE_PRICES.length - 1];
    const newRange: PriceRange = {
      min: lastRange.max + 1,
      max: lastRange.max + 50,
      price: lastRange.price
    };
    setConfig({ ...config, BASE_PRICES: [...config.BASE_PRICES, newRange] });
  };

  const removePriceRange = (index: number) => {
    if (!config || config.BASE_PRICES.length <= 1) return;
    const newBasePrices = config.BASE_PRICES.filter((_, i) => i !== index);
    setConfig({ ...config, BASE_PRICES: newBasePrices });
  };

  const updateOption = (section: keyof CalculatorConfig, index: number, field: string, value: any) => {
    if (!config) return;
    const newConfig = { ...config };
    const options = newConfig[section] as any[];
    options[index] = { ...options[index], [field]: value };
    setConfig(newConfig);
  };

  const addOption = (section: keyof CalculatorConfig) => {
    if (!config) return;
    const newConfig = { ...config };
    const options = newConfig[section] as any[];
    const newOption = {
      label: 'Новая опция',
      value: 0,
      addition: 0
    };
    options.push(newOption);
    setConfig(newConfig);
  };

  const removeOption = (section: keyof CalculatorConfig, index: number) => {
    if (!config) return;
    const newConfig = { ...config };
    const options = newConfig[section] as any[];
    if (options.length > 1) {
      newConfig[section] = options.filter((_, i) => i !== index) as any;
      setConfig(newConfig);
    }
  };

  const updateDeliveryOption = (index: number, field: keyof DeliveryOption, value: string | number) => {
    if (!config) return;
    const newDeliveryOptions = [...(config.DELIVERY_OPTIONS || [])];
    newDeliveryOptions[index] = { ...newDeliveryOptions[index], [field]: value };
    setConfig({ ...config, DELIVERY_OPTIONS: newDeliveryOptions });
  };

  const addDeliveryOption = () => {
    if (!config) return;
    const newDeliveryOptions = [...(config.DELIVERY_OPTIONS || [])];
    newDeliveryOptions.push({ label: 'Новый город', price: 0 });
    setConfig({ ...config, DELIVERY_OPTIONS: newDeliveryOptions });
  };

  const removeDeliveryOption = (index: number) => {
    if (!config || !config.DELIVERY_OPTIONS || config.DELIVERY_OPTIONS.length <= 1) return;
    const newDeliveryOptions = config.DELIVERY_OPTIONS.filter((_, i) => i !== index);
    setConfig({ ...config, DELIVERY_OPTIONS: newDeliveryOptions });
  };

  // Функция массового изменения цен
  const applyMassPriceChange = () => {
    if (!config || !priceChangePercent) {
      alert('Введите процент изменения цен');
      return;
    }

    const percent = parseFloat(priceChangePercent);
    if (isNaN(percent)) {
      alert('Введите корректное числовое значение процента');
      return;
    }

    const confirmMessage = `Вы уверены, что хотите изменить ВСЕ цены на ${percent > 0 ? '+' : ''}${percent}%? Это действие нельзя отменить.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    const multiplier = 1 + (percent / 100);
    const newConfig = { ...config };

    // Обновляем базовые цены
    newConfig.BASE_PRICES = newConfig.BASE_PRICES.map(range => ({
      ...range,
      price: Math.round(range.price * multiplier)
    }));

    // Обновляем фундаменты (используем value)
    newConfig.FOUNDATION_OPTIONS = newConfig.FOUNDATION_OPTIONS.map(option => ({
      ...option,
      value: option.value && typeof option.value === 'number' ? Math.round(option.value * multiplier) : option.value
    }));

    // Обновляем этажность
    newConfig.FLOORS_OPTIONS = newConfig.FLOORS_OPTIONS.map(option => ({
      ...option,
      addition: option.addition !== undefined ? Math.round(option.addition * multiplier) : option.addition
    }));

    // Обновляем типы первого этажа
    newConfig.FIRST_FLOOR_TYPE_OPTIONS = newConfig.FIRST_FLOOR_TYPE_OPTIONS.map(option => ({
      ...option,
      addition: option.addition !== undefined ? Math.round(option.addition * multiplier) : option.addition
    }));

    // Обновляем типы второго этажа
    newConfig.SECOND_FLOOR_TYPE_OPTIONS = newConfig.SECOND_FLOOR_TYPE_OPTIONS.map(option => ({
      ...option,
      addition: option.addition !== undefined ? Math.round(option.addition * multiplier) : option.addition
    }));

    // Обновляем типы третьего этажа
    newConfig.THIRD_FLOOR_TYPE_OPTIONS = newConfig.THIRD_FLOOR_TYPE_OPTIONS.map(option => ({
      ...option,
      addition: option.addition !== undefined ? Math.round(option.addition * multiplier) : option.addition
    }));

    // Обновляем высоты этажей
    newConfig.FLOOR_HEIGHT_OPTIONS = newConfig.FLOOR_HEIGHT_OPTIONS.map(option => ({
      ...option,
      addition: option.addition !== undefined ? Math.round(option.addition * multiplier) : option.addition
    }));

    // Обновляем толщины стен
    newConfig.WALL_THICKNESS_OPTIONS = newConfig.WALL_THICKNESS_OPTIONS.map(option => ({
      ...option,
      addition: option.addition !== undefined ? Math.round(option.addition * multiplier) : option.addition
    }));

    // Обновляем перегородки (все группы высот)
    Object.keys(newConfig.PARTITION_OPTIONS).forEach(heightKey => {
      const heightGroup = heightKey as keyof PartitionOptions;
      newConfig.PARTITION_OPTIONS[heightGroup] = newConfig.PARTITION_OPTIONS[heightGroup].map(option => ({
        ...option,
        addition: option.addition !== undefined ? Math.round(option.addition * multiplier) : option.addition
      }));
    });

    // Обновляем потолки
    newConfig.CEILING_OPTIONS = newConfig.CEILING_OPTIONS.map(option => ({
      ...option,
      addition: option.addition !== undefined ? Math.round(option.addition * multiplier) : option.addition
    }));

    // Обновляем крыши
    newConfig.ROOF_OPTIONS = newConfig.ROOF_OPTIONS.map(option => ({
      ...option,
      addition: option.addition !== undefined ? Math.round(option.addition * multiplier) : option.addition
    }));

    // Обновляем формы домов
    newConfig.HOUSE_SHAPE_OPTIONS = newConfig.HOUSE_SHAPE_OPTIONS.map(option => ({
      ...option,
      addition: option.addition !== undefined ? Math.round(option.addition * multiplier) : option.addition
    }));

    // Обновляем дополнительные работы
    newConfig.ADDITIONAL_WORKS_OPTIONS = newConfig.ADDITIONAL_WORKS_OPTIONS.map(option => ({
      ...option,
      addition: option.addition !== undefined ? Math.round(option.addition * multiplier) : option.addition
    }));

    setConfig(newConfig);
    setPriceChangePercent('');
    alert(`Все цены успешно изменены на ${percent > 0 ? '+' : ''}${percent}%. Не забудьте сохранить изменения!`);
  };

  // Функция генерации текстового представления всех параметров
  const generateConfigText = (): string => {
    if (!config) return '';

    const formatPrice = (price: number): string => {
      return new Intl.NumberFormat('ru-RU').format(price);
    };

    let text = `КОНФИГУРАЦИЯ КАЛЬКУЛЯТОРА HOTWELL.KZ\n`;
    text += `Экспортировано: ${new Date().toLocaleString('ru-RU')}\n`;
    text += `==========================================\n\n`;

    // Диапазоны площадей
    text += `📐 ДИАПАЗОНЫ ПЛОЩАДЕЙ:\n`;
    config.BASE_PRICES.forEach(range => {
      text += `${range.min}–${range.max} м²: ${formatPrice(range.price)} ₸/м²\n`;
    });
    text += `\n`;

    // Типы фундамента
    text += `🧱 ТИПЫ ФУНДАМЕНТА:\n`;
    config.FOUNDATION_OPTIONS.forEach(option => {
      const value = option.value || option.addition || 0;
      text += `${option.label}: ${formatPrice(Number(value))} ₸\n`;
    });
    text += `\n`;

    // Количество этажей
    text += `📊 КОЛИЧЕСТВО ЭТАЖЕЙ:\n`;
    config.FLOORS_OPTIONS.forEach(option => {
      const addition = option.addition || 0;
      text += `${option.label}: коэффициент ${formatPrice(addition)} ₸\n`;
    });
    text += `\n`;

    // Типы первого этажа
    text += `🏠 ТИПЫ ПЕРВОГО ЭТАЖА:\n`;
    config.FIRST_FLOOR_TYPE_OPTIONS.forEach(option => {
      const addition = option.addition || 0;
      text += `${option.label}: коэффициент ${formatPrice(addition)} ₸\n`;
    });
    text += `\n`;

    // Типы второго этажа
    text += `🏢 ТИПЫ ВТОРОГО ЭТАЖА:\n`;
    config.SECOND_FLOOR_TYPE_OPTIONS.forEach(option => {
      const addition = option.addition || 0;
      text += `${option.label}: коэффициент ${formatPrice(addition)} ₸\n`;
    });
    text += `\n`;

    // Типы третьего этажа
    text += `🏗️ ТИПЫ ТРЕТЬЕГО ЭТАЖА:\n`;
    config.THIRD_FLOOR_TYPE_OPTIONS.forEach(option => {
      const addition = option.addition || 0;
      text += `${option.label}: коэффициент ${formatPrice(addition)} ₸\n`;
    });
    text += `\n`;

    // Высоты этажей
    text += `📏 ВЫСОТЫ ЭТАЖЕЙ:\n`;
    config.FLOOR_HEIGHT_OPTIONS.forEach(option => {
      const addition = option.addition || 0;
      text += `${option.label}: коэффициент ${formatPrice(addition)} ₸\n`;
    });
    text += `\n`;

    // Толщины стен
    text += `🧱 ТОЛЩИНЫ СТЕН:\n`;
    config.WALL_THICKNESS_OPTIONS.forEach(option => {
      const addition = option.addition || 0;
      text += `${option.label}: коэффициент ${formatPrice(addition)} ₸\n`;
    });
    text += `\n`;

    // Перегородки
    text += `🔲 ПЕРЕГОРОДКИ:\n`;
    Object.entries(config.PARTITION_OPTIONS).forEach(([heightKey, options]) => {
      const heightName = heightKey.replace('height_', '').replace('_', ',') + ' м';
      text += `  Высота ${heightName}:\n`;
      options.forEach((option: any) => {
        const addition = option.addition || 0;
        text += `    ${option.label}: коэффициент ${formatPrice(addition)} ₸\n`;
      });
    });
    text += `\n`;

    // Потолки
    text += `🏠 ПОТОЛКИ:\n`;
    config.CEILING_OPTIONS.forEach(option => {
      const addition = option.addition || 0;
      text += `${option.label}: коэффициент ${formatPrice(addition)} ₸\n`;
    });
    text += `\n`;

    // Крыши
    text += `🏘️ ТИПЫ КРЫШ:\n`;
    config.ROOF_OPTIONS.forEach(option => {
      const addition = option.addition || 0;
      const floors = option.floors ? ` (для ${option.floors}-этажных)` : '';
      text += `${option.label}${floors}: коэффициент ${formatPrice(addition)} ₸\n`;
    });
    text += `\n`;

    // Формы домов
    text += `🏗️ ФОРМЫ ДОМОВ:\n`;
    config.HOUSE_SHAPE_OPTIONS.forEach(option => {
      const addition = option.addition || 0;
      text += `${option.label}: коэффициент ${formatPrice(addition)} ₸\n`;
    });
    text += `\n`;

    // Дополнительные работы
    text += `🔧 ДОПОЛНИТЕЛЬНЫЕ РАБОТЫ:\n`;
    config.ADDITIONAL_WORKS_OPTIONS.forEach(option => {
      const addition = option.addition || 0;
      text += `${option.label}: коэффициент ${formatPrice(addition)} ₸\n`;
    });
    text += `\n`;

    // Доставка по городам
    text += `🚚 СТОИМОСТЬ ДОСТАВКИ ПО ГОРОДАМ:\n`;
    if (config.DELIVERY_OPTIONS) {
      config.DELIVERY_OPTIONS.forEach(option => {
        text += `${option.label}: ${formatPrice(option.price)} ₸ за фуру\n`;
      });
    }
    text += `\n`;

    // Разбивка стоимости
    text += `💰 РАЗБИВКА СТОИМОСТИ:\n`;
    text += `Фундамент: ${(config.COST_BREAKDOWN.foundation * 100).toFixed(1)}%\n`;
    text += `Домокомплект: ${(config.COST_BREAKDOWN.houseKit * 100).toFixed(1)}%\n`;
    text += `Сборка: ${(config.COST_BREAKDOWN.assembly * 100).toFixed(1)}%\n`;
    text += `\n`;

    // Ограничения площади
    text += `📐 ОГРАНИЧЕНИЯ ПЛОЩАДИ:\n`;
    text += `Минимальная: ${config.AREA_LIMITS.min} м²\n`;
    text += `Максимальная: ${config.AREA_LIMITS.max} м²\n`;
    text += `\n`;

    text += `==========================================\n`;
    text += `© HotWell.kz - Калькулятор СИП домов\n`;

    return text;
  };

  // Функция копирования конфигурации в буфер обмена
  const copyConfigToClipboard = async () => {
    try {
      const configText = generateConfigText();
      await navigator.clipboard.writeText(configText);
      alert('✅ Все параметры успешно скопированы в буфер обмена');
    } catch (error) {
      console.error('Ошибка копирования:', error);
      alert('❌ Ошибка при копировании в буфер обмена');
    }
  };

  // Функция скачивания конфигурации как TXT файл
  const downloadConfigAsTxt = () => {
    const configText = generateConfigText();
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Конфигурация_калькулятора_HotWell_${currentDate}.txt`;
    
    const blob = new Blob([configText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    alert('📁 Конфигурация сохранена в файл');
  };

  if (!isAdmin) {
    return null;
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6" />
            <h2 className="text-xl font-bold">Админ-панель калькулятора</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content with scroll */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Загрузка конфигурации...</p>
              </div>
            </div>
          ) : (
            config && (
              <div className="p-6 space-y-6">
                {/* Массовое изменение цен */}
                <div className="flex items-center gap-2 mb-4 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                      💰 Массовое изменение всех цен
                    </h4>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-yellow-700 font-medium">
                        Изменить все цены на:
                      </label>
                      <input
                        type="number"
                        value={priceChangePercent}
                        onChange={(e) => setPriceChangePercent(e.target.value)}
                        placeholder="Введите % (например, 10 или -10)"
                        className="px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 w-48"
                      />
                      <span className="text-sm text-yellow-700">%</span>
                      <button
                        onClick={applyMassPriceChange}
                        disabled={!priceChangePercent || loading}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                      >
                        Применить ко всем
                      </button>
                    </div>
                    <p className="text-xs text-yellow-600 mt-2">
                      ⚠️ Внимание: изменения затронут все цены в калькуляторе. Обязательно сохраните после применения.
                    </p>
                  </div>
                </div>

                {/* Базовые цены */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('base_prices')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">📐 Диапазоны площади и цены</h3>
                    {expandedSections.has('base_prices') ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  
                  {expandedSections.has('base_prices') && (
                    <div className="p-4">
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {config.BASE_PRICES.map((range, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Мин. площадь</label>
                                <input
                                  type="number"
                                  value={range.min}
                                  onChange={(e) => updateBasePrices(index, 'min', Number(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Макс. площадь</label>
                                <input
                                  type="number"
                                  value={range.max}
                                  onChange={(e) => updateBasePrices(index, 'max', Number(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Цена за м²</label>
                                <input
                                  type="number"
                                  value={range.price}
                                  onChange={(e) => updateBasePrices(index, 'price', Number(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => removePriceRange(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              disabled={config.BASE_PRICES.length <= 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={addPriceRange}
                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Добавить диапазон
                      </button>
                    </div>
                  )}
                </div>

                {/* Прочие секции - Foundation, Floors, etc. */}
                {[
                  { key: 'FOUNDATION_OPTIONS', title: '🧱 Типы фундамента', icon: '🧱' },
                  { key: 'FLOORS_OPTIONS', title: '📊 Количество этажей', icon: '📊' },
                  { key: 'FLOOR_HEIGHT_OPTIONS', title: '📏 Высота этажей', icon: '📏' },
                  { key: 'WALL_THICKNESS_OPTIONS', title: '🧱 Толщина стен', icon: '🧱' },
                  { key: 'CEILING_OPTIONS', title: '🏠 Потолки', icon: '🏠' },
                  { key: 'ROOF_OPTIONS', title: '🏘️ Типы крыш', icon: '🏘️' },
                  { key: 'HOUSE_SHAPE_OPTIONS', title: '🏗️ Форма дома', icon: '🏗️' },
                  { key: 'ADDITIONAL_WORKS_OPTIONS', title: '🔧 Дополнительные работы', icon: '🔧' }
                ].map((section) => (
                  <div key={section.key} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(section.key)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                      {expandedSections.has(section.key) ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    
                    {expandedSections.has(section.key) && (
                      <div className="p-4">
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {(config[section.key as keyof CalculatorConfig] as any[])?.map((option: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1 grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                                  <input
                                    type="text"
                                    value={option.label}
                                    onChange={(e) => updateOption(section.key as keyof CalculatorConfig, index, 'label', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Коэффициент</label>
                                  <input
                                    type="number"
                                    value={option.addition || option.value || 0}
                                    onChange={(e) => updateOption(section.key as keyof CalculatorConfig, index, option.addition !== undefined ? 'addition' : 'value', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => removeOption(section.key as keyof CalculatorConfig, index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => addOption(section.key as keyof CalculatorConfig)}
                          className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Добавить опцию
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Стоимость доставки */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('DELIVERY_OPTIONS')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">🚚 Стоимость доставки по городам</h3>
                    {expandedSections.has('DELIVERY_OPTIONS') ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  
                  {expandedSections.has('DELIVERY_OPTIONS') && (
                    <div className="p-4">
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>ℹ️ Информация:</strong> Цена указывается за одну фуру. Количество фур рассчитывается автоматически: каждые 150 м² = 1 фура.
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Например: площадь 160 м² = 2 фуры, площадь 300 м² = 2 фуры, площадь 310 м² = 3 фуры.
                        </p>
                      </div>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {(config.DELIVERY_OPTIONS || []).map((delivery: DeliveryOption, index: number) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
                                <input
                                  type="text"
                                  value={delivery.label}
                                  onChange={(e) => updateDeliveryOption(index, 'label', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Цена за фуру (₸)</label>
                                <input
                                  type="number"
                                  value={delivery.price}
                                  onChange={(e) => updateDeliveryOption(index, 'price', Number(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => removeDeliveryOption(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              disabled={(config.DELIVERY_OPTIONS || []).length <= 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={addDeliveryOption}
                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Добавить город
                      </button>
                    </div>
                  )}
                </div>

                {/* Разбивка стоимости */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('cost_breakdown')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">💰 Разбивка стоимости</h3>
                    {expandedSections.has('cost_breakdown') ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  
                  {expandedSections.has('cost_breakdown') && (
                    <div className="p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Фундамент (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={config.COST_BREAKDOWN.foundation}
                            onChange={(e) => setConfig({
                              ...config,
                              COST_BREAKDOWN: { ...config.COST_BREAKDOWN, foundation: Number(e.target.value) }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Домокомплект (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={config.COST_BREAKDOWN.houseKit}
                            onChange={(e) => setConfig({
                              ...config,
                              COST_BREAKDOWN: { ...config.COST_BREAKDOWN, houseKit: Number(e.target.value) }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Сборка (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={config.COST_BREAKDOWN.assembly}
                            onChange={(e) => setConfig({
                              ...config,
                              COST_BREAKDOWN: { ...config.COST_BREAKDOWN, assembly: Number(e.target.value) }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ограничения площади */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('area_limits')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">📐 Ограничения площади</h3>
                    {expandedSections.has('area_limits') ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  
                  {expandedSections.has('area_limits') && (
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Минимальная площадь</label>
                          <input
                            type="number"
                            value={config.AREA_LIMITS.min}
                            onChange={(e) => setConfig({
                              ...config,
                              AREA_LIMITS: { ...config.AREA_LIMITS, min: Number(e.target.value) }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Максимальная площадь</label>
                          <input
                            type="number"
                            value={config.AREA_LIMITS.max}
                            onChange={(e) => setConfig({
                              ...config,
                              AREA_LIMITS: { ...config.AREA_LIMITS, max: Number(e.target.value) }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Добавляем отступ внизу для footer */}
                <div className="h-4"></div>
              </div>
            )
          )}
        </div>

        {/* Fixed Footer with action buttons */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              💡 Изменения применяются после сохранения и перезагрузки калькулятора
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyConfigToClipboard}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                disabled={loading}
                title="Копировать все параметры в буфер обмена"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Копировать как текст</span>
                <span className="sm:hidden">📋</span>
              </button>
              <button
                onClick={downloadConfigAsTxt}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm"
                disabled={loading}
                title="Скачать конфигурацию как TXT файл"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Скачать TXT</span>
                <span className="sm:hidden">📁</span>
              </button>
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                disabled={loading}
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Сброс</span>
              </button>
              <button
                onClick={saveConfig}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                disabled={saving || loading}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Сохранение...' : <span className="hidden sm:inline">Сохранить</span>}
                {!saving && <span className="sm:hidden">💾</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 