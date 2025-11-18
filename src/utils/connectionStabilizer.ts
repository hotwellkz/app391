import React from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Типы для системы стабилизации соединения
export interface ConnectionState {
    isConnected: boolean;
    isServerReady: boolean;
    lastConnectedAt: Date | null;
    failureCount: number;
    retryAttempts: number;
    is503ErrorActive: boolean; // Новое поле для отслеживания 503 ошибок
}

export interface RetryConfig {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
    retryCondition?: (error: any) => boolean;
}

export interface QueuedRequest {
    id: string;
    config: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timestamp: number;
    retryCount: number;
}

interface HealthCheckResponse {
    status: string;
    whatsapp?: {
        ready: boolean;
        authenticated: boolean;
    };
}

// Состояние соединения
class ConnectionStabilizer {
    private state: ConnectionState = {
        isConnected: false,
        isServerReady: false,
        lastConnectedAt: null,
        failureCount: 0,
        retryAttempts: 0,
        is503ErrorActive: false
    };

    private requestQueue: QueuedRequest[] = [];
    private isProcessingQueue = false;
    private maxQueueSize = 50;
    private queueTimeout = 30000; // 30 секунд
    private statusCheckInterval: NodeJS.Timeout | null = null;
    private listeners: ((state: ConnectionState) => void)[] = [];
    private lastHealthCheckTime = 0;
    private healthCheckCooldown = 10000; // 10 секунд между проверками при 503

    // Настройки retry по умолчанию
    private defaultRetryConfig: RetryConfig = {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
        retryCondition: (error) => {
            // НЕ повторяем 503 ошибки слишком агрессивно
            if (error.response?.status === 503) {
                return false; // Пусть health check определит когда сервер снова готов
            }
            
            // Retry на network errors, timeouts, и другие 5xx ошибки
            return !error.response || 
                   error.code === 'NETWORK_ERROR' ||
                   error.code === 'ECONNREFUSED' ||
                   error.code === 'ENOTFOUND' ||
                   (error.response?.status >= 500 && error.response?.status < 600 && error.response?.status !== 503);
        }
    };

    constructor() {
        this.startStatusMonitoring();
        this.setupAxiosInterceptors();
    }

    // Подписка на изменения состояния соединения
    public onStateChange(callback: (state: ConnectionState) => void): () => void {
        this.listeners.push(callback);
        // Возвращаем функцию отписки
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    // Уведомление слушателей об изменении состояния
    private notifyStateChange(): void {
        this.listeners.forEach(callback => {
            try {
                callback({ ...this.state });
            } catch (error) {
                console.error('🔥 Error in connection state listener:', error);
            }
        });
    }

    // Обновление состояния соединения
    private updateState(updates: Partial<ConnectionState>): void {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...updates };
        
        // Логируем важные изменения
        if (prevState.isConnected !== this.state.isConnected) {
            console.log(`🔌 Connection state changed: ${this.state.isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);
        }
        
        if (prevState.isServerReady !== this.state.isServerReady) {
            console.log(`🖥️ Server ready state changed: ${this.state.isServerReady ? 'READY' : 'NOT_READY'}`);
        }

        if (prevState.is503ErrorActive !== this.state.is503ErrorActive) {
            console.log(`🚫 503 Error state changed: ${this.state.is503ErrorActive ? 'ACTIVE' : 'RESOLVED'}`);
        }

        this.notifyStateChange();
    }

    // Проверка состояния сервера с улучшенной логикой
    private async checkServerStatus(): Promise<boolean> {
        const now = Date.now();
        
        // Если недавно получали 503 ошибку, увеличиваем интервал проверок
        if (this.state.is503ErrorActive && (now - this.lastHealthCheckTime) < this.healthCheckCooldown) {
            return false;
        }
        
        this.lastHealthCheckTime = now;
        
        try {
            const response = await axios.get<HealthCheckResponse>(`${import.meta.env.VITE_BACKEND_URL || 'http://35.194.39.8:3000'}/health`, {
                timeout: 5000,
                validateStatus: (status) => status === 200
            });
            
            const isReady = response.data?.whatsapp?.ready === true;
            
            this.updateState({
                isConnected: true,
                isServerReady: isReady,
                lastConnectedAt: new Date(),
                failureCount: 0,
                is503ErrorActive: false // Сервер ответил успешно
            });

            // Если сервер готов, обрабатываем очередь
            if (isReady && this.requestQueue.length > 0) {
                this.processRequestQueue();
            }

            return true;
        } catch (error: any) {
            const is503 = error.response?.status === 503;
            
            this.updateState({
                isConnected: !is503, // При 503 соединение есть, но сервис недоступен
                isServerReady: false,
                failureCount: this.state.failureCount + 1,
                is503ErrorActive: is503
            });

            if (is503) {
                console.warn(`🚫 Server returning 503 - WhatsApp service not ready`);
            } else {
                console.warn(`⚠️ Server status check failed:`, error.message);
            }
            
            return false;
        }
    }

    // Мониторинг состояния сервера с адаптивными интервалами
    private startStatusMonitoring(): void {
        // Немедленная проверка
        this.checkServerStatus();

        // Периодическая проверка с адаптивным интервалом
        this.statusCheckInterval = setInterval(() => {
            const interval = this.state.is503ErrorActive ? 15000 : 5000; // 15 сек при 503, 5 сек обычно
            this.checkServerStatus();
        }, 5000);
    }

    // Настройка перехватчиков Axios
    private setupAxiosInterceptors(): void {
        // Перехватчик запросов
        axios.interceptors.request.use(
            (config: any) => {
                // Пропускаем health check запросы
                if (config.url?.includes('/health')) {
                    return config;
                }

                // Если активна 503 ошибка, показываем предупреждение но не блокируем
                if (this.state.is503ErrorActive) {
                    console.warn('🚫 503 error active, but proceeding with request:', config.url);
                } else if (!this.state.isServerReady && !config.url?.includes('/whatsapp/status')) {
                    console.warn('⚠️ Server not ready, but proceeding with request:', config.url);
                }

                return config;
            },
            (error) => Promise.reject(error)
        );

        // Перехватчик ответов - обработка ошибок
        axios.interceptors.response.use(
            (response) => {
                // Успешный ответ - обновляем состояние
                if (!this.state.isConnected || this.state.is503ErrorActive) {
                    this.updateState({
                        isConnected: true,
                        failureCount: 0,
                        is503ErrorActive: false
                    });
                }
                return response;
            },
            async (error) => {
                // Обрабатываем ошибки соединения
                this.handleConnectionError(error);
                return Promise.reject(error);
            }
        );
    }

    // Добавление запроса в очередь (упрощенная версия)
    private async queueRequest(config: any): Promise<any> {
        console.log(`📝 Queueing request: ${config.method?.toUpperCase()} ${config.url}`);
        
        // Простая задержка перед повторной попыткой
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return axios(config);
    }

    // Обработка очереди запросов
    private async processRequestQueue(): Promise<void> {
        if (this.isProcessingQueue || this.requestQueue.length === 0 || !this.state.isServerReady) {
            return;
        }

        this.isProcessingQueue = true;
        console.log(`🔄 Processing request queue: ${this.requestQueue.length} requests`);

        // Убираем уведомление о очереди
        toast.dismiss('server-queue');
        toast.success('Сервер доступен. Обрабатываем очередь запросов...', {
            duration: 2000
        });

        // Обрабатываем запросы по очереди
        while (this.requestQueue.length > 0 && this.state.isServerReady) {
            const request = this.requestQueue.shift();
            if (!request) break;

            try {
                console.log(`📤 Processing queued request: ${request.config.method?.toUpperCase()} ${request.config.url}`);
                const response = await axios(request.config);
                request.resolve(response);
            } catch (error) {
                console.error(`❌ Failed to process queued request:`, error);
                request.reject(error);
            }
        }

        this.isProcessingQueue = false;
        console.log(`✅ Request queue processing completed`);
    }

    // Удаление запроса из очереди
    private removeRequestFromQueue(requestId: string, error: Error): void {
        const index = this.requestQueue.findIndex(req => req.id === requestId);
        if (index > -1) {
            const request = this.requestQueue.splice(index, 1)[0];
            request.reject(error);
        }
    }

    // Улучшенная обработка ошибок соединения
    private handleConnectionError(error: any): void {
        const isNetworkError = !error.response || 
                              error.code === 'NETWORK_ERROR' ||
                              error.code === 'ECONNREFUSED' ||
                              error.code === 'ENOTFOUND';

        const isServerError = error.response?.status >= 500;
        const is503Error = error.response?.status === 503;
        const isClientNotReady = is503Error;

        if (isNetworkError || isServerError) {
            this.updateState({
                isConnected: !is503Error, // При 503 соединение есть
                isServerReady: false,
                failureCount: this.state.failureCount + 1,
                is503ErrorActive: is503Error
            });

            // Показываем пользователю информацию о проблеме
            if (isNetworkError) {
                console.error('🌐 Network error detected:', error.message);
            } else if (isClientNotReady) {
                console.warn('⏳ WhatsApp client not ready:', error.response?.data?.error || 'Service unavailable');
                // Показываем toast только при первой 503 ошибке
                if (!this.state.is503ErrorActive) {
                    toast.error('WhatsApp клиент не готов. Ожидаем готовности...', {
                        duration: 4000,
                        id: 'whatsapp-503'
                    });
                }
            } else {
                console.error('🔥 Server error detected:', error.response?.status, error.response?.statusText);
            }
        }
    }

    // Выполнение запроса с retry логикой
    public async executeWithRetry<T>(
        requestFn: () => Promise<T>, 
        config: Partial<RetryConfig> = {}
    ): Promise<T> {
        const retryConfig = { ...this.defaultRetryConfig, ...config };
        let lastError: any;

        for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
            try {
                const result = await requestFn();
                
                // Сброс счетчика неудач при успехе
                if (this.state.failureCount > 0 || this.state.is503ErrorActive) {
                    this.updateState({ 
                        failureCount: 0,
                        is503ErrorActive: false
                    });
                }
                
                return result;
            } catch (error: any) {
                lastError = error;
                
                // Для 503 ошибок не повторяем агрессивно
                if (error.response?.status === 503) {
                    console.warn(`🚫 503 error - stopping retries, will wait for health check`);
                    this.updateState({ is503ErrorActive: true });
                    break;
                }
                
                // Проверяем, стоит ли повторять попытку
                if (attempt === retryConfig.maxAttempts || !retryConfig.retryCondition?.(error)) {
                    break;
                }

                // Вычисляем задержку с exponential backoff
                const delay = Math.min(
                    retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt - 1),
                    retryConfig.maxDelay
                );

                console.warn(`⚠️ Request failed (attempt ${attempt}/${retryConfig.maxAttempts}). Retrying in ${delay}ms...`, error.message);
                
                this.updateState({ retryAttempts: this.state.retryAttempts + 1 });
                
                // Ждем перед следующей попыткой
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }

    // Получение текущего состояния
    public getState(): ConnectionState {
        return { ...this.state };
    }

    // Очистка ресурсов
    public cleanup(): void {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = null;
        }

        // Отклоняем все запросы в очереди
        this.requestQueue.forEach(request => {
            request.reject(new Error('Connection stabilizer is being cleaned up'));
        });
        this.requestQueue = [];

        this.listeners = [];
        console.log('🧹 Connection stabilizer cleaned up');
    }
}

// Singleton экземпляр
export const connectionStabilizer = new ConnectionStabilizer();

// Утилитарные функции для использования в компонентах
export const withRetry = connectionStabilizer.executeWithRetry.bind(connectionStabilizer);

export const useConnectionState = () => {
    const [state, setState] = React.useState<ConnectionState>(connectionStabilizer.getState());
    
    React.useEffect(() => {
        const unsubscribe = connectionStabilizer.onStateChange(setState);
        return unsubscribe;
    }, []);
    
    return state;
};

// Функция для проверки готовности к выполнению операций
export const isReadyForOperation = (): boolean => {
    const state = connectionStabilizer.getState();
    return state.isConnected && state.isServerReady;
};

// Обертка для критически важных операций
export const executeCriticalOperation = async <T>(
    operation: () => Promise<T>,
    fallback?: () => T
): Promise<T> => {
    try {
        return await withRetry(operation, {
            maxAttempts: 5,
            baseDelay: 1000,
            maxDelay: 8000,
            backoffFactor: 1.5
        });
    } catch (error) {
        console.error('🚨 Critical operation failed after all retries:', error);
        
        if (fallback) {
            console.log('🔄 Using fallback for critical operation');
            return fallback();
        }
        
        throw error;
    }
};

export default connectionStabilizer; 