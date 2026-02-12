// sw.js - Service Worker для PWA

const CACHE_NAME = 'my-pwa-v2';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// Установка
self.addEventListener('install', event => {
    console.log('Service Worker: installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: кэширование ресурсов');
                
                // Проверяем каждый файл по отдельности
                const promises = urlsToCache.map(url => {
                    return fetch(url, { method: 'GET' })
                        .then(response => {
                            if (response.ok) {
                                console.log('✅', url, '- OK');
                                return cache.put(url, response);
                            } else {
                                console.warn('⚠️', url, '- не найден (', response.status, ')');
                                throw new Error(`Файл ${url} вернул статус ${response.status}`);
                            }
                        })
                        .catch(error => {
                            console.error('❌', url, '-', error.message);
                            // Пропускаем файл, если он не найден
                            return Promise.resolve();
                        });
                });
                
                return Promise.all(promises);
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
    // Игнорируем не-HTTP запросы
    if (!event.request.url.startsWith('http')) {
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
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    }
                ).catch(() => {
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