// sw.js - Service Worker для PWA

const CACHE_NAME = 'my-pwa-v3';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json'
];

// Установка
self.addEventListener('install', event => {
    console.log('Service Worker: installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: кэширование ресурсов');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: установлен');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: ошибка установки:', error);
                throw error;
            })
    );
});

// Активация
self.addEventListener('activate', event => {
    console.log('Service Worker: активирован');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: удаление старого кэша', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    return self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', event => {
    // Игнорируем не-HTTP запросы (расширения браузера и т.д.)
    if (!event.request.url.startsWith('http')) {
        return;
    }
    
    // Игнорируем запросы к сторонним доменам
    if (event.request.url.startsWith('http') && 
        !event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    console.log('Service Worker: из кэша', event.request.url);
                    return response;
                }
                
                return fetch(event.request).then(
                    response => {
                        // Проверяем валидность ответа
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Кэшируем только запросы к нашему домену
                        if (event.request.url.startsWith(self.location.origin)) {
                            const responseToCache = response.clone();
                            
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                })
                                .catch(error => {
                                    console.warn('Не удалось закэшировать:', event.request.url, error);
                                });
                        }
                        
                        return response;
                    }
                ).catch(() => {
                    // Возвращаем офлайн-страницу для навигационных запросов
                    if (event.request.mode === 'navigate') {
                        return caches.match('./');
                    }
                });
            })
    );
});

// Обработка пуш-уведомлений
self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Уведомление';
    const options = {
        body: data.body || 'У вас новое уведомление',
        icon: './icons/icon-192x192.png',
        badge: './icons/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});