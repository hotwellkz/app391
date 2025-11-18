const CACHE_NAME = 'hotwell-cache-v1';
const SETTINGS_CACHE_NAME = 'hotwell-settings-v1';

// Функция для сохранения настроек в кэш
export const saveSettingsToCache = async (key: string, value: any) => {
  try {
    // Сохраняем в localStorage для быстрого доступа
    localStorage.setItem(key, JSON.stringify(value));

    // Сохраняем в кэш для офлайн доступа
    const cache = await caches.open(SETTINGS_CACHE_NAME);
    const response = new Response(JSON.stringify({
      value,
      timestamp: Date.now()
    }));
    await cache.put(`/settings/${key}`, response);
  } catch (error) {
    console.error('Error saving settings to cache:', error);
  }
};

// Функция для получения настроек из кэша
export const getSettingsFromCache = async (key: string, defaultValue: any = null) => {
  try {
    // Сначала пробуем получить из localStorage
    const localValue = localStorage.getItem(key);
    if (localValue) {
      return JSON.parse(localValue);
    }

    // Если нет в localStorage, пробуем получить из кэша
    const cache = await caches.open(SETTINGS_CACHE_NAME);
    const response = await cache.match(`/settings/${key}`);
    
    if (response) {
      const data = await response.json();
      // Сохраняем в localStorage для быстрого доступа в будущем
      localStorage.setItem(key, JSON.stringify(data.value));
      return data.value;
    }

    return defaultValue;
  } catch (error) {
    console.error('Error getting settings from cache:', error);
    return defaultValue;
  }
};
