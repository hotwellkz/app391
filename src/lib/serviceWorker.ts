// Утилиты для управления Service Worker
export const isServiceWorkerDisabled = (): boolean => {
  return localStorage.getItem('disable-service-worker') === 'true';
};

export const disableServiceWorker = async (): Promise<void> => {
  localStorage.setItem('disable-service-worker', 'true');
  console.log('🚫 Service Worker disabled via localStorage');
  
  // Удаляем существующий Service Worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('🗑️ Service Worker unregistered:', registration.scope);
    }
  }
  
  // Очищаем кэши
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
      console.log('🗑️ Cache deleted:', cacheName);
    }
  }
  
  console.log('✅ Service Worker completely disabled. Refresh page to apply changes.');
};

export const enableServiceWorker = (): void => {
  localStorage.removeItem('disable-service-worker');
  console.log('✅ Service Worker enabled. Refresh page to register.');
};

// Диагностика Service Worker
export const diagnoseServiceWorker = async (): Promise<void> => {
  console.log('🔍 === SERVICE WORKER DIAGNOSTICS ===');
  
  console.log('Browser support:', 'serviceWorker' in navigator);
  console.log('Disabled via localStorage:', isServiceWorkerDisabled());
  
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('Active registrations:', registrations.length);
    
    for (const registration of registrations) {
      console.log('Registration scope:', registration.scope);
      console.log('Registration state:', {
        installing: !!registration.installing,
        waiting: !!registration.waiting,
        active: !!registration.active
      });
    }
    
    if (navigator.serviceWorker.controller) {
      console.log('Controlled by SW:', navigator.serviceWorker.controller.scriptURL);
    } else {
      console.log('No controlling service worker');
    }
  }
  
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    console.log('Available caches:', cacheNames);
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      console.log(`Cache "${cacheName}":`, requests.length, 'entries');
    }
  }
  
  console.log('🔍 === END DIAGNOSTICS ===');
};

export const registerServiceWorker = async () => {
  // Проверяем отключение через localStorage
  if (isServiceWorkerDisabled()) {
    console.log('🚫 Service Worker disabled via localStorage');
    return;
  }

  if ('serviceWorker' in navigator) {
    try {
      console.log('🔧 Registering Service Worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker registered with scope:', registration.scope);

      // Обработка обновлений Service Worker
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker update found');
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log('🔄 Service Worker state changed:', newWorker.state);
            
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Есть старый SW, показываем уведомление об обновлении
                console.log('🆕 New Service Worker available');
                showUpdateNotification();
              } else {
                // Первая установка
                console.log('✅ Service Worker installed for the first time');
              }
            }
          });
        }
      });

      // Обработка сообщений от Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Message from Service Worker:', event.data);
        
        if (event.data.type === 'CACHE_OUTDATED') {
          showCacheOutdatedNotification(event.data.url);
        }
      });

      // Добавляем глобальные функции для диагностики
      (window as any).swDiagnose = diagnoseServiceWorker;
      (window as any).swDisable = disableServiceWorker;
      (window as any).swEnable = enableServiceWorker;
      
      console.log('🛠️ Service Worker diagnostics available:');
      console.log('- swDiagnose() - run diagnostics');
      console.log('- swDisable() - disable service worker');
      console.log('- swEnable() - enable service worker');

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  } else {
    console.log('❌ Service Worker not supported in this browser');
  }
};

// Показ уведомления об обновлении Service Worker
const showUpdateNotification = () => {
  const notification = document.createElement('div');
  notification.id = 'sw-update-notification';
  notification.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    background-color: #3b82f6;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 300px;
  `;
  
  notification.innerHTML = `
    <div style="font-weight: 600;">Доступно обновление</div>
    <div style="font-size: 14px; opacity: 0.9;">Новая версия приложения готова к использованию</div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.location.reload()" style="
        background: white;
        border: none;
        color: #3b82f6;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      ">Обновить</button>
      <button onclick="document.getElementById('sw-update-notification').remove()" style="
        background: transparent;
        border: 1px solid white;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      ">Позже</button>
    </div>
  `;

  // Удаляем предыдущее уведомление если есть
  const existing = document.getElementById('sw-update-notification');
  if (existing) {
    existing.remove();
  }

  document.body.appendChild(notification);

  // Автоудаление через 30 секунд
  setTimeout(() => {
    if (document.getElementById('sw-update-notification')) {
      notification.remove();
    }
  }, 30000);
};

// Показ уведомления об устаревшем контенте
const showCacheOutdatedNotification = (url: string) => {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #f59e0b;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  notification.innerHTML = `
    <span>Контент может быть устаревшим</span>
    <button onclick="window.location.reload()" style="
      background: white;
      border: none;
      color: #f59e0b;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    ">Обновить</button>
    <button onclick="this.parentElement.remove()" style="
      background: transparent;
      border: 1px solid white;
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    ">✕</button>
  `;

  document.body.appendChild(notification);

  // Удаляем уведомление через 10 секунд
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 10000);
};
