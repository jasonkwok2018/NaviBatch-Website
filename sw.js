// Service Worker for NaviBatch
const CACHE_NAME = 'navibatch-v1.1.4';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/combined.min.css?v=1.1.2',
  '/css/loader.css',
  '/js/main.js?v=1.0.3',
  '/images/logo.svg',
  '/images/optimized/hero-screenshot-hq.webp',
  '/images/optimized/hero-screenshot-mobile.webp',
  '/images/hero-screenshot.png',
  '/images/icons/favicon-32x32.png',
  '/images/icons/apple-touch-icon.png',
  '/images/App store badge 2022.webp'
];

// 安装Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', function(event) {
  // 跳过非HTTP(S)请求，避免chrome-extension等协议的错误
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // 跳过跨域请求，避免CORS问题
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // 跳过POST请求和其他非GET请求
  if (event.request.method !== 'GET') {
    return;
  }

  // 跳过包含查询参数的动态请求
  const url = new URL(event.request.url);
  if (url.search && !url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // 如果缓存中有，直接返回
        if (response) {
          return response;
        }

        // 否则从网络获取
        return fetch(event.request).then(
          function(response) {
            // 检查是否是有效响应
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              })
              .catch(function(error) {
                // 静默处理缓存错误，避免控制台错误
                console.warn('Cache put failed:', error);
              });

            return response;
          }
        ).catch(function(error) {
          // 网络请求失败时的处理
          console.warn('Fetch failed:', error);

          // 尝试返回缓存的首页作为后备
          return caches.match('/') || new Response('页面暂时无法访问，请稍后重试', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
    );
});

// 清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});