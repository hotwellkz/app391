import { useCallback, useRef, useEffect, useMemo, useState } from 'react';

// Debounce hook для оптимизации поиска и фильтрации
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook для оптимизации скролла
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const throttledCallback = useRef<T>();
  const lastExecuted = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastExecuted.current >= delay) {
        lastExecuted.current = now;
        return callback(...args);
      }
    }) as T,
    [callback, delay]
  );
};

// Intersection Observer hook для lazy loading
export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean => {
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options]);

  return isIntersecting;
};

// Мемоизация для тяжёлых вычислений
export const useMemoizedComputation = <T>(
  computation: () => T,
  dependencies: React.DependencyList
): T => {
  return useMemo(computation, dependencies);
};

// Cache для API запросов
class SimpleCache<T = any> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();

  set(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

export const apiCache = new SimpleCache();

// Hook для кэширования API запросов
export const useCachedData = <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): { data: T | null; loading: boolean; error: Error | null } => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const cachedData = apiCache.get(key);
    
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetcher();
        apiCache.set(key, result, ttl);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key, fetcher, ttl]);

  return { data, loading, error };
};

// Оптимизированная функция для работы с изображениями
export const optimizeImage = (url: string, width?: number, height?: number): string => {
  if (!url) return '';
  
  // Если это Firebase Storage URL, добавляем параметры оптимизации
  if (url.includes('firebasestorage.googleapis.com')) {
    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    params.append('format', 'webp');
    params.append('quality', '80');
    
    return `${url}&${params.toString()}`;
  }
  
  return url;
};

// Функция для предзагрузки критических ресурсов
export const preloadCriticalResources = (urls: string[]): void => {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = 'image';
    document.head.appendChild(link);
  });
};

// Web Worker для тяжёлых вычислений
export const useWebWorker = <T, R>(
  workerFunction: (data: T) => R,
  dependencies: React.DependencyList = []
) => {
  const workerRef = useRef<Worker>();

  const runWorker = useCallback((data: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }

      const workerCode = `
        self.onmessage = function(e) {
          const result = (${workerFunction.toString()})(e.data);
          self.postMessage(result);
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      workerRef.current = worker;

      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
      };

      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };

      worker.postMessage(data);
    });
  }, dependencies);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  return runWorker;
}; 