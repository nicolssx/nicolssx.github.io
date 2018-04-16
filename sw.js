const CACHE_VERSION = '1.0.1';
const CACHE_NAME = 'my-test-cache';
const CACHE_FILES = [
  'about.html',
  'index.html'
];
const CACHE_KEY = CACHE_NAME + '-' + CACHE_VERSION;
const CACHE_WHITE_LIST = [CACHE_KEY];
// 注册install时间，将文件添加到caches中
self.addEventListener('install', evt => {
  // 安装失败则废弃该sw
  evt.waitUntil(caches.open(CACHE_KEY)
    .then(cache => {
      // 原子操作。添加资源到缓存，某个文件缓存失败则整个序列缓存失败
      return cache.addAll(CACHE_FILES);
    }))
    .then(() => {
      // sw立即生效，跳过等待
      self.skipWaiting();
    })
});

// 缓存更新，删除旧资源
self.addEventListener('activate', evt => {
  evt.waitUntil(Promise.all([
    // 更新客户端
    self.clients.claim(),
    // 清理旧版本
    caches.keys().then(cacheList => Promise.all(cacheList.map(cacheName => {
      if (CACHE_WHITE_LIST.indexOf(cacheName) < 0) {
        caches.delete(cacheName);
      }
    }))).then(() => {
      return self.clients.mathAll().then(clients => {
        if (clients && clients.length) {
          clients.postMessage('sw update');
        }
      })
    }).catch(err => {
      console.error(err);
    })
  ]))
});

// 拦截fetch事件，使用缓存
self.addEventListener('fetch', evt => {
  evt.respondWith(caches.match(evt.request).then(response => {
    // 返回sw缓存
    if (response) {
      return response;
    }
    // 请求服务
    return fetch(evt.request).then(res => {
      // 请求失败直接返回结果
      if (!res || res.status !== 200) {
        return res;
      }
      // 请求成功，进行缓存
      let resClone = res.clone();
      caches.open(CACHE_KEY).then(cache => {
        cache.put(evt.request, resClone);
      });
      return res;
    });
  }));
});

// 监听离线状态
self.addEventListener('offline', ()=>{
  Notification.requestPermission().then(grant =>{
    if(grant !== 'granted'){
      return;
    }
    const notification = new Notification('网络不给力', {
      body: '当前处于离线状态，无法进行数据请求，已访问过的页面可继续访问。'
    });
    notification.onclick = ()=>{
      notification.close();
    }
  })
});

self.addEventListener('error', ()=>{
  console.log(arguments)
});

//当 Promise 类型的回调发生reject 却没有 catch 处理，会触发 unhandledrejection 事件。
self.addEventListener('unhandledrejection', function(event) {
  console.log("unhandledrejection", event);
});

