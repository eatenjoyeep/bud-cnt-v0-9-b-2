/**
 * sw.js - 極簡念佛計數器 Service Worker 快取腳本
 * 版本: v0.9.b.1 (修正 Promise 離線回退邏輯與防崩潰機制)
 */

const CACHE_NAME = 'zen-mantra-v0.9.b.6';

// 欲快取的靜態資源列表 (全數使用相對路徑，適應 GitHub Pages 子目錄)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/storage.js',
  './js/audio.js',
  './js/app.js',
  './manifest.json'
];

// 1. 安裝 Service Worker 並快取核心檔案
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`[SW ${CACHE_NAME}] 正在寫入靜態資源快取...`);
      // 強制 cache: 'reload'，繞過 HTTP 舊快取，確保抓到 GitHub 最新檔案
      return cache.addAll(
        ASSETS_TO_CACHE.map((url) => new Request(url, { cache: 'reload' }))
      );
    })
  );
  self.skipWaiting(); // 讓新 SW 立即生效
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
  self.clients.claim(); // 立即接管所有頁面
});

// 3. 攔截網路請求：優先回應快取，斷網時安全回退
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. 命中快取，直接回傳
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. 未命中快取，發起網絡請求
      return fetch(event.request).catch(() => {
        // 3. 斷網且為頁面導航請求時，執行正確的 Promise 鏈式回退
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html')
            .then((resp) => resp || caches.match('./'))
            .then((resp) => resp || new Response('目前處於離線狀態，且快取不可用。', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            }));
        }

        // 4. 非頁面請求（如圖片、普通 JS）斷網失敗時，明確回傳 Error Response 避免 SW 崩潰
        return Response.error();
      });
    })
  );
});