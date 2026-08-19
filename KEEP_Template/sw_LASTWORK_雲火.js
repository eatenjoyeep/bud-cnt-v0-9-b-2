/**
 * sw.js - 極簡念佛計數器 Service Worker 快取腳本
 * 版本: v0.9.a.1
 */

const CACHE_NAME = 'zen-mantra-v0.9.b.1';

// 欲快取的靜態資源列表 (確保離線狀態下全功能可正常運行)
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
//  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/js/storage.js',
  '/js/audio.js',
  '/js/app.js',
  '/manifest.json'
];

// 1. 安裝 Service Worker 並快取核心檔案
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW v0.9.b.1] 正在寫入靜態資源快取...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. 啟用 Service Worker 並自動清理舊版本快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[SW] 清理舊版本快取:', key);
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// 3. 攔截網路請求：優先回應快取，斷網時 100% 順暢執行
self.addEventListener('fetch', (event) => {
  // 僅處理 GET 請求（安全修復版）
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      // 快取未命中時發起網絡請求，並防止 TypeError 崩潰
      return fetch(event.request).catch(() => {
        // 使用 mode === 'navigate' 安全判斷頁面導航
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/');
        }
      });
    })
  );
});