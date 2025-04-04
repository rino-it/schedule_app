// Nome della cache
const CACHE_NAME = 'taskmaster-cache-v1';

// File da mettere in cache durante l'installazione
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/models/Task.js',
  '/js/models/Scheduler.js',
  '/js/controllers/TaskController.js',
  '/js/controllers/ViewController.js',
  '/js/utils/Storage.js',
  '/js/utils/DateUtils.js',
  '/manifest.json',
  '/icons/favicon.png',
  '/icons/logo.svg',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];

// Installazione del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installazione in corso');
  
  // Mette in cache i file necessari
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Apertura cache');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Attivazione del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Attivazione in corso');
  
  // Rimuove le vecchie cache
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Pulizia cache vecchia', cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Gestione delle richieste di rete
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetch', event.request.url);
  
  // Strategia Cache First con Network Fallback
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Restituisce la risposta dalla cache se disponibile
        if (response) {
          console.log('Service Worker: Trovato nella cache', event.request.url);
          return response;
        }
        
        // Altrimenti fa una richiesta di rete
        console.log('Service Worker: Non trovato nella cache, richiesta di rete', event.request.url);
        return fetch(event.request)
          .then(networkResponse => {
            // Controlla se la risposta è valida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clona la risposta per poterla usare e metterla in cache
            const responseToCache = networkResponse.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          })
          .catch(error => {
            console.log('Service Worker: Errore di fetch', error);
            // Qui si potrebbe restituire una pagina di fallback
          });
      })
  );
});

// Gestione dei messaggi
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Gestione delle notifiche push
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: 'Visualizza'
      },
      {
        action: 'close',
        title: 'Chiudi'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Gestione del click sulle notifiche
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(windowClients => {
        // Se c'è già una finestra aperta, la focalizza
        for (const client of windowClients) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Altrimenti apre una nuova finestra
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
  );
});

// Sincronizzazione in background
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

// Funzione per sincronizzare le attività
async function syncTasks() {
  try {
    // Recupera le attività da sincronizzare
    const db = await openDatabase();
    const tasks = await db.getAll('syncQueue');
    
    // Se non ci sono attività da sincronizzare, esce
    if (tasks.length === 0) {
      return;
    }
    
    // Sincronizza le attività
    for (const task of tasks) {
      // Qui andrebbe la logica di sincronizzazione con un server
      // Per ora, segniamo semplicemente come sincronizzate
      await db.delete('syncQueue', task.id);
    }
    
    // Notifica l'utente
    self.registration.showNotification('Sincronizzazione completata', {
      body: `${tasks.length} attività sincronizzate con successo`,
      icon: '/icons/icon-192x192.png'
    });
  } catch (error) {
    console.error('Errore durante la sincronizzazione:', error);
  }
}

// Funzione per aprire il database
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('taskmaster-db', 1);
    
    request.onerror = event => {
      reject('Errore nell\'apertura del database');
    };
    
    request.onsuccess = event => {
      resolve({
        db: event.target.result,
        getAll: (storeName) => {
          return new Promise((resolve, reject) => {
            const transaction = event.target.result.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onerror = () => {
              reject('Errore nel recupero dei dati');
            };
            
            request.onsuccess = () => {
              resolve(request.result);
            };
          });
        },
        delete: (storeName, id) => {
          return new Promise((resolve, reject) => {
            const transaction = event.target.result.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onerror = () => {
              reject('Errore nell\'eliminazione dei dati');
            };
            
            request.onsuccess = () => {
              resolve();
            };
          });
        }
      });
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Crea gli object store necessari
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    };
  });
}
