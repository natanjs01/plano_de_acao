// ====================================
// SERVICE WORKER - PWA ONLINE-ONLY
// ====================================
// Versão simplificada: não faz cache offline
// O app funciona apenas com conexão à internet

const CACHE_NAME = 'plano-acao-v1.0.0';
const APP_VERSION = '1.0.0';

// ====== INSTALAÇÃO ======
self.addEventListener('install', (event) => {
  console.log(`✅ Service Worker v${APP_VERSION} instalado`);
  
  // Força ativação imediata
  self.skipWaiting();
});

// ====== ATIVAÇÃO ======
self.addEventListener('activate', (event) => {
  console.log(`✅ Service Worker v${APP_VERSION} ativado`);
  
  // Remove caches antigos (se houver)
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log(`🗑️ Removendo cache antigo: ${name}`);
            return caches.delete(name);
          })
      );
    })
  );
  
  // Assume controle de todas as páginas
  self.clients.claim();
});

// ====== FETCH (REQUISIÇÕES) ======
self.addEventListener('fetch', (event) => {
  // MODO ONLINE-ONLY: Deixa todas as requisições passarem direto para a rede
  // Não intercepta, não faz cache
  
  // Se quiser adicionar cache no futuro, é só descomentar:
  /*
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return new Response('Você está offline. Conecte-se à internet para usar o sistema.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
  );
  */
});

// ====== MENSAGENS ======
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: APP_VERSION });
  }
});

// ====== NOTIFICAÇÕES PUSH (PREPARADO PARA FUTURO) ======
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/assets/images/icons/icon-192x192.png',
    badge: '/assets/images/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'notification',
    requireInteraction: false,
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Plano de Ação', options)
  );
});

// ====== CLIQUE EM NOTIFICAÇÃO ======
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('📱 PWA Service Worker carregado - Modo: ONLINE-ONLY');
