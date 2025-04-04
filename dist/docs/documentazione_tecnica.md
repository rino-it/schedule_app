# Documentazione Tecnica - TaskMaster PWA

## Panoramica del sistema

TaskMaster è un'applicazione web progressiva (PWA) per la schedulazione intelligente delle attività, sviluppata utilizzando tecnologie web standard (HTML, CSS, JavaScript) con un'architettura modulare basata sul pattern MVC (Model-View-Controller).

Questa documentazione tecnica descrive l'architettura del sistema, i componenti principali e le tecnologie utilizzate.

## Architettura del sistema

L'applicazione è strutturata secondo il pattern MVC:

- **Model**: Gestisce i dati e la logica di business
- **View**: Gestisce l'interfaccia utente e la presentazione
- **Controller**: Gestisce l'interazione tra Model e View

### Struttura delle directory

```
task-scheduler-pwa/
├── css/                  # Fogli di stile
│   ├── styles.css        # Stili principali
│   └── offline.css       # Stili per la modalità offline
├── js/                   # Script JavaScript
│   ├── app.js            # Punto di ingresso dell'applicazione
│   ├── models/           # Modelli di dati
│   │   ├── Task.js       # Modello per le attività
│   │   └── Scheduler.js  # Modello per la schedulazione
│   ├── controllers/      # Controller
│   │   ├── TaskController.js    # Controller per le attività
│   │   └── ViewController.js    # Controller per le viste
│   └── utils/            # Utility
│       ├── DateUtils.js          # Utility per le date
│       ├── Storage.js            # Utility per la persistenza
│       ├── BackupManager.js      # Utility per i backup
│       ├── SyncManager.js        # Utility per la sincronizzazione
│       ├── NotificationManager.js # Utility per le notifiche
│       └── OfflineManager.js     # Utility per la modalità offline
├── icons/                # Icone dell'applicazione
├── img/                  # Immagini
├── index.html            # Pagina principale
├── manifest.json         # Manifest per PWA
└── service-worker.js     # Service Worker per funzionalità offline
```

## Componenti principali

### Model

#### Task.js
Rappresenta un'attività con proprietà come titolo, descrizione, durata, scadenza, priorità, ecc.

```javascript
export default class Task {
    constructor(data) {
        this.id = data.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        this.title = data.title;
        this.description = data.description || '';
        this.duration = data.duration; // in ore
        this.deadline = data.deadline;
        this.priority = data.priority || 3; // 1-5
        this.category = data.category || 'Generale';
        this.energy = data.energy || 'Media'; // Alta, Media, Bassa
        this.timePreference = data.timePreference || 'Indifferente'; // Mattina, Pomeriggio, Sera, Indifferente
        this.dependencies = data.dependencies || [];
        this.completed = data.completed || false;
        this.completedAt = data.completedAt || null;
        this.scheduledStart = data.scheduledStart || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }
    
    // Metodi per la gestione dell'attività
    // ...
}
```

#### Scheduler.js
Implementa l'algoritmo di schedulazione che alloca le attività in base a priorità, scadenze, dipendenze e altri vincoli.

```javascript
export default class Scheduler {
    constructor() {
        this.tasks = [];
        this.constraints = [];
        this.preferences = {};
    }
    
    // Metodi per la schedulazione
    // ...
}
```

### Controller

#### TaskController.js
Gestisce la logica di business per le attività, come creazione, modifica, eliminazione e completamento.

```javascript
export default class TaskController {
    constructor(scheduler) {
        this.scheduler = scheduler;
        this.tasks = [];
        this.eventListeners = {};
    }
    
    // Metodi per la gestione delle attività
    // ...
}
```

#### ViewController.js
Gestisce l'interfaccia utente e l'interazione con l'utente.

```javascript
export default class ViewController {
    constructor(taskController) {
        this.taskController = taskController;
        this.currentView = 'welcome';
        this.currentDate = new Date();
        this.weekStartDate = DateUtils.getStartOfWeek(this.currentDate);
        
        // Elementi DOM principali
        // ...
    }
    
    // Metodi per la gestione delle viste
    // ...
}
```

### Utility

#### Storage.js
Gestisce la persistenza dei dati utilizzando IndexedDB.

```javascript
export default class Storage {
    static async init() {
        // Inizializza IndexedDB
        // ...
    }
    
    static async saveTasks(tasks) {
        // Salva le attività in IndexedDB
        // ...
    }
    
    static async loadTasks() {
        // Carica le attività da IndexedDB
        // ...
    }
    
    // Altri metodi per la persistenza
    // ...
}
```

#### BackupManager.js
Gestisce il backup e il ripristino dei dati.

```javascript
export default class BackupManager {
    static async generateBackupCode() {
        // Genera un codice di backup
        // ...
    }
    
    static async restoreFromBackupCode(backupCode) {
        // Ripristina i dati da un codice di backup
        // ...
    }
    
    // Altri metodi per il backup
    // ...
}
```

#### SyncManager.js
Gestisce la sincronizzazione dei dati quando l'applicazione torna online.

```javascript
export default class SyncManager {
    constructor() {
        this.syncQueue = [];
        this.isSyncing = false;
    }
    
    async init() {
        // Inizializza il manager
        // ...
    }
    
    async sync() {
        // Sincronizza i dati
        // ...
    }
    
    // Altri metodi per la sincronizzazione
    // ...
}
```

#### NotificationManager.js
Gestisce le notifiche per le attività imminenti e in ritardo.

```javascript
export default class NotificationManager {
    constructor() {
        this.notificationsEnabled = false;
        this.notificationQueue = [];
    }
    
    async init() {
        // Inizializza il manager
        // ...
    }
    
    async sendNotification(title, options = {}) {
        // Invia una notifica
        // ...
    }
    
    // Altri metodi per le notifiche
    // ...
}
```

#### OfflineManager.js
Gestisce la modalità offline dell'applicazione.

```javascript
export default class OfflineManager {
    constructor(syncManager) {
        this.syncManager = syncManager;
        this.isOnline = navigator.onLine;
        this.offlineMode = false;
        this.offlineModeForced = false;
        this.lastOnlineTime = Date.now();
        this.reconnectionAttempts = 0;
    }
    
    async init() {
        // Inizializza il manager
        // ...
    }
    
    // Altri metodi per la modalità offline
    // ...
}
```

## Algoritmo di schedulazione

L'algoritmo di schedulazione implementato in `Scheduler.js` utilizza un approccio euristico per allocare le attività in modo ottimale, tenendo conto di:

1. **Priorità**: Le attività con priorità più alta vengono schedulate prima
2. **Scadenze**: Le attività con scadenze più vicine hanno precedenza
3. **Dipendenze**: Le attività dipendenti vengono schedulate dopo quelle da cui dipendono
4. **Preferenze di fascia oraria**: Le attività vengono allocate nelle fasce orarie preferite quando possibile
5. **Livello di energia**: Le attività che richiedono alta energia vengono allocate nei momenti della giornata con maggiore energia
6. **Vincoli di sistema**: Orari protetti, pause, ecc.

L'algoritmo segue questi passaggi:

1. Ordina le attività in base a priorità, scadenza e dipendenze
2. Per ogni attività:
   - Identifica gli slot disponibili che soddisfano i vincoli
   - Valuta ogni slot in base a preferenze e livello di energia
   - Assegna l'attività allo slot con il punteggio più alto
3. Risolve i conflitti spostando le attività con priorità inferiore
4. Verifica il sovraccarico e propone soluzioni alternative

## Persistenza dei dati

L'applicazione utilizza IndexedDB per la persistenza dei dati, implementata in `Storage.js`. I dati vengono salvati localmente nel browser dell'utente, permettendo l'accesso offline e la sincronizzazione quando si torna online.

## Funzionalità offline

Le funzionalità offline sono implementate utilizzando:

1. **Service Worker**: Per il caching delle risorse e l'intercettazione delle richieste di rete
2. **IndexedDB**: Per la persistenza dei dati
3. **SyncManager**: Per la sincronizzazione dei dati quando si torna online
4. **OfflineManager**: Per la gestione dello stato offline e la modalità offline forzata

## Notifiche

Le notifiche sono implementate utilizzando l'API Notifications del browser, gestita da `NotificationManager.js`. Le notifiche vengono inviate per:

1. Attività imminenti
2. Attività in ritardo
3. Conflitti nella schedulazione
4. Sovraccarico di attività

## Backup e ripristino

Il sistema di backup e ripristino, implementato in `BackupManager.js`, permette agli utenti di:

1. Generare un codice di backup che codifica tutte le attività
2. Ripristinare i dati da un codice di backup
3. Pianificare backup automatici

## Esportazione e importazione

L'applicazione supporta:

1. Esportazione in formato iCalendar (.ics)
2. Importazione da formati JSON, CSV e iCalendar

## Requisiti di sistema

### Client
- Browser moderno con supporto per:
  - JavaScript ES6+
  - IndexedDB
  - Service Worker
  - Notifications API
  - Cache API
  - Promise API
  - Fetch API

### Compatibilità browser
- Chrome 64+
- Firefox 63+
- Safari 13+
- Edge 79+
- Opera 51+
- iOS Safari 13+
- Android Browser 76+

## Deployment

L'applicazione può essere distribuita su qualsiasi server web statico. Non richiede un backend server-side, poiché tutte le funzionalità sono implementate lato client.

## Limitazioni note

1. Le notifiche potrebbero non funzionare su iOS Safari a causa delle restrizioni di Apple
2. La sincronizzazione in background potrebbe non essere supportata su tutti i browser
3. L'installazione come PWA su iOS ha alcune limitazioni rispetto ad Android

## Sviluppi futuri

1. Implementazione di un backend per la sincronizzazione tra dispositivi
2. Integrazione con servizi di calendario esterni (Google Calendar, Outlook, ecc.)
3. Funzionalità di collaborazione per la condivisione di attività
4. Analisi avanzata dell'utilizzo del tempo con machine learning
5. Supporto per la geolocalizzazione per attività legate a luoghi specifici

## Conclusioni

TaskMaster PWA è un'applicazione completa per la schedulazione intelligente delle attività, sviluppata utilizzando tecnologie web moderne e seguendo le best practice per le Progressive Web App. L'architettura modulare e l'approccio MVC rendono l'applicazione facilmente manutenibile ed estensibile.
