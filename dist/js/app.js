/**
 * Integrazione finale delle funzionalità offline
 */
import Task from './models/Task.js';
import Scheduler from './models/Scheduler.js';
import TaskController from './controllers/TaskController.js';
import ViewController from './controllers/ViewController.js';
import Storage from './utils/Storage.js';
import DateUtils from './utils/DateUtils.js';
import BackupManager from './utils/BackupManager.js';
import SyncManager from './utils/SyncManager.js';
import NotificationManager from './utils/NotificationManager.js';
import OfflineManager from './utils/OfflineManager.js';

// Classe principale dell'applicazione
class TaskMasterApp {
    /**
     * Inizializza l'applicazione
     */
    constructor() {
        // Crea lo scheduler
        this.scheduler = new Scheduler();
        
        // Inizializza i manager
        this.syncManager = new SyncManager();
        this.notificationManager = new NotificationManager();
        this.offlineManager = new OfflineManager(this.syncManager);
        
        // Crea il controller delle attività
        this.taskController = new TaskController(this.scheduler);
        
        // Crea il controller delle viste
        this.viewController = new ViewController(this.taskController);
        
        // Inizializza l'applicazione
        this.init();
    }
    
    /**
     * Inizializza l'applicazione
     */
    async init() {
        try {
            // Inizializza i manager
            await this.syncManager.init();
            await this.notificationManager.init();
            await this.offlineManager.init();
            
            // Inizializza il controller delle attività
            await this.taskController.init();
            
            // Registra gli event listener per lo stato offline
            this._registerOfflineEventListeners();
            
            // Verifica se ci sono parametri nell'URL
            this._handleUrlParams();
            
            // Verifica se è la prima esecuzione
            const isFirstRun = await Storage.getSetting('firstRun');
            
            if (isFirstRun === null) {
                // Imposta il flag di prima esecuzione
                await Storage.saveSetting('firstRun', false);
                
                // Mostra il tutorial
                this._showTutorial();
                
                // Richiedi il permesso per le notifiche
                this.notificationManager.requestPermission();
            }
            
            // Pianifica il backup automatico
            BackupManager.scheduleAutomaticBackup(60); // Ogni ora
            
            // Verifica se ci sono attività da completare
            this._checkOverdueTasks();
            
            // Aggiorna l'interfaccia in base allo stato offline
            this._updateOfflineUI();
            
            console.log('Applicazione inizializzata con successo');
        } catch (error) {
            console.error('Errore durante l\'inizializzazione dell\'applicazione:', error);
            this._showErrorMessage('Errore durante l\'inizializzazione dell\'applicazione');
        }
    }
    
    /**
     * Registra gli event listener per lo stato offline
     * @private
     */
    _registerOfflineEventListeners() {
        // Ascolta i cambiamenti di stato offline
        window.addEventListener('offlineStateChange', (event) => {
            this._updateOfflineUI();
        });
        
        // Aggiungi un pulsante per la modalità offline nella UI
        const offlineButton = document.createElement('button');
        offlineButton.id = 'btn-offline-mode';
        offlineButton.className = 'offline-toggle';
        offlineButton.innerHTML = '<span class="material-icons">wifi_off</span>';
        offlineButton.title = 'Modalità offline';
        
        // Aggiorna lo stato iniziale
        this._updateOfflineButtonState(offlineButton);
        
        // Aggiungi l'evento click
        offlineButton.addEventListener('click', () => {
            this.offlineManager.toggleForcedOfflineMode(!this.offlineManager.isOfflineModeForced());
            this._updateOfflineButtonState(offlineButton);
        });
        
        // Aggiungi il pulsante all'header
        const header = document.querySelector('header nav');
        header.insertBefore(offlineButton, header.firstChild);
    }
    
    /**
     * Aggiorna lo stato del pulsante offline
     * @param {HTMLElement} button - Pulsante da aggiornare
     * @private
     */
    _updateOfflineButtonState(button) {
        if (this.offlineManager.isOfflineModeForced()) {
            button.classList.add('active');
            button.title = 'Disattiva modalità offline';
        } else {
            button.classList.remove('active');
            button.title = 'Attiva modalità offline';
        }
    }
    
    /**
     * Aggiorna l'interfaccia in base allo stato offline
     * @private
     */
    _updateOfflineUI() {
        const isOffline = this.offlineManager.isOfflineMode();
        
        // Aggiorna la classe del body
        if (isOffline) {
            document.body.classList.add('offline-mode');
        } else {
            document.body.classList.remove('offline-mode');
        }
        
        // Aggiorna l'indicatore di stato
        let statusIndicator = document.getElementById('connection-status');
        
        if (!statusIndicator) {
            statusIndicator = document.createElement('div');
            statusIndicator.id = 'connection-status';
            document.body.appendChild(statusIndicator);
        }
        
        if (isOffline) {
            statusIndicator.className = 'offline';
            statusIndicator.innerHTML = '<span class="material-icons">wifi_off</span> Offline';
        } else {
            statusIndicator.className = 'online';
            statusIndicator.innerHTML = '<span class="material-icons">wifi</span> Online';
            
            // Se ci sono operazioni in attesa, mostra l'indicatore di sincronizzazione
            if (this.syncManager.hasPendingOperations()) {
                statusIndicator.className = 'syncing';
                statusIndicator.innerHTML = '<span class="material-icons">sync</span> Sincronizzazione...';
            }
        }
        
        // Mostra l'indicatore
        statusIndicator.classList.remove('hidden');
        
        // Nascondi l'indicatore dopo 3 secondi
        setTimeout(() => {
            statusIndicator.classList.add('hidden');
        }, 3000);
    }
    
    /**
     * Gestisce i parametri dell'URL
     * @private
     */
    _handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        if (action) {
            switch (action) {
                case 'new-task':
                    this.viewController.showNewTaskModal();
                    break;
                case 'show-today':
                    this.viewController.showDailyView(new Date());
                    break;
                case 'show-week':
                    this.viewController.showWeeklyView();
                    break;
                case 'offline-mode':
                    this.offlineManager.toggleForcedOfflineMode(true);
                    break;
                default:
                    break;
            }
            
            // Rimuovi i parametri dall'URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    /**
     * Mostra il tutorial
     * @private
     */
    _showTutorial() {
        // Crea il modale del tutorial
        const tutorialModal = document.createElement('div');
        tutorialModal.className = 'modal tutorial-modal active';
        
        // Contenuto del tutorial
        tutorialModal.innerHTML = `
            <div class="modal-header">
                <h2>Benvenuto in TaskMaster</h2>
                <button class="close-modal" aria-label="Chiudi">&times;</button>
            </div>
            <div class="modal-content">
                <div class="tutorial-step">
                    <h3>Gestisci le tue attività in modo intelligente</h3>
                    <p>TaskMaster ti aiuta a organizzare le tue attività professionali e personali in modo ottimale, assegnando priorità e collocandole strategicamente durante la settimana.</p>
                </div>
                <div class="tutorial-step">
                    <h3>Funzionalità principali</h3>
                    <ul>
                        <li><strong>Nuova attività</strong>: Aggiungi nuove attività con tutti i dettagli necessari</li>
                        <li><strong>Vista settimanale</strong>: Visualizza la pianificazione dell'intera settimana</li>
                        <li><strong>Vista giornaliera</strong>: Concentrati sulle attività del giorno</li>
                        <li><strong>Ricalcola</strong>: Ottimizza automaticamente la tua pianificazione</li>
                        <li><strong>Modalità offline</strong>: Lavora anche senza connessione internet</li>
                    </ul>
                </div>
                <div class="tutorial-step">
                    <h3>Iniziamo!</h3>
                    <p>Premi il pulsante "Nuova attività" per aggiungere la tua prima attività o esplora le viste settimanale e giornaliera dal menu.</p>
                </div>
                <div class="form-actions">
                    <button type="button" class="primary-btn" id="tutorial-close">Inizia a usare TaskMaster</button>
                </div>
            </div>
        `;
        
        // Aggiungi il modale al container
        const modalContainer = document.getElementById('modal-container');
        modalContainer.appendChild(tutorialModal);
        modalContainer.classList.add('active');
        
        // Aggiungi l'evento per chiudere il tutorial
        tutorialModal.querySelector('#tutorial-close').addEventListener('click', () => {
            modalContainer.classList.remove('active');
            setTimeout(() => {
                modalContainer.removeChild(tutorialModal);
            }, 300);
        });
        
        tutorialModal.querySelector('.close-modal').addEventListener('click', () => {
            modalContainer.classList.remove('active');
            setTimeout(() => {
                modalContainer.removeChild(tutorialModal);
            }, 300);
        });
    }
    
    /**
     * Verifica se ci sono attività in ritardo
     * @private
     */
    _checkOverdueTasks() {
        const now = new Date();
        
        // Filtra le attività non completate con scadenza passata
        const overdueTasks = this.taskController.tasks.filter(task => {
            if (task.completed) return false;
            
            const deadline = new Date(task.deadline);
            return deadline < now;
        });
        
        // Se ci sono attività in ritardo
        if (overdueTasks.length > 0) {
            console.log('Attività in ritardo:', overdueTasks);
            
            // Mostra una notifica
            if (this.notificationManager.areNotificationsEnabled()) {
                this.notificationManager.sendNotification(
                    `Hai ${overdueTasks.length} attività in ritardo`,
                    {
                        body: 'Clicca per visualizzare le attività in ritardo',
                        data: {
                            action: 'show-overdue'
                        }
                    }
                );
            }
            
            // Mostra un avviso nell'interfaccia
            this._showOverdueTasksWarning(overdueTasks);
        }
    }
    
    /**
     * Mostra un avviso per le attività in ritardo
     * @param {Array} overdueTasks - Attività in ritardo
     * @private
     */
    _showOverdueTasksWarning(overdueTasks) {
        // Crea l'elemento di avviso
        const warningElement = document.createElement('div');
        warningElement.className = 'overdue-warning';
        warningElement.innerHTML = `
            <div class="overdue-header">
                <span class="material-icons">warning</span>
                <h3>Attività in ritardo</h3>
                <button class="close-warning" aria-label="Chiudi">&times;</button>
            </div>
            <div class="overdue-content">
                <p>Hai ${overdueTasks.length} attività in ritardo. Vuoi ripianificarle?</p>
                <div class="overdue-actions">
                    <button class="secondary-btn" id="btn-show-overdue">Visualizza</button>
                    <button class="primary-btn" id="btn-reschedule-overdue">Ripianifica</button>
                </div>
            </div>
        `;
        
        // Aggiungi l'avviso al documento
        document.body.appendChild(warningElement);
        
        // Mostra l'avviso
        setTimeout(() => {
            warningElement.classList.add('show');
        }, 1000);
        
        // Aggiungi gli eventi
        warningElement.querySelector('.close-warning').addEventListener('click', () => {
            warningElement.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(warningElement);
            }, 300);
        });
        
        warningElement.querySelector('#btn-show-overdue').addEventListener('click', () => {
            // Mostra la vista giornaliera con le attività in ritardo
            this.viewController.showDailyView(new Date());
            warningElement.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(warningElement);
            }, 300);
        });
        
        warningElement.querySelector('#btn-reschedule-overdue').addEventListener('click', () => {
            // Ripianifica le attività in ritardo
            this.taskController.recalculateSchedule();
            warningElement.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(warningElement);
            }, 300);
        });
    }
    
    /**
     * Mostra un messaggio di errore
     * @param {String} message - Messaggio di errore
     * @private
     */
    _showErrorMessage(message) {
        // Crea l'elemento toast
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        
        // Aggiungi il toast al documento
        document.body.appendChild(toast);
        
        // Mostra il toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Rimuovi il toast dopo 5 secondi
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 5000);
    }
}

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
    // Carica le icone Material
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // Carica gli stili per la modalità offline
    const offlineStyles = document.createElement('link');
    offlineStyles.href = 'css/offline.css';
    offlineStyles.rel = 'stylesheet';
    document.head.appendChild(offlineStyles);
    
    // Inizializza l'applicazione
    window.app = new TaskMasterApp();
});

// Gestione degli errori globali
window.addEventListener('error', (event) => {
    console.error('Errore globale:', event.error);
    
    // Salva l'errore nel localStorage per debug
    try {
        const errors = JSON.parse(localStorage.getItem('taskmaster_errors') || '[]');
        errors.push({
            message: event.error.message,
            stack: event.error.stack,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('taskmaster_errors', JSON.stringify(errors.slice(-10))); // Mantieni solo gli ultimi 10 errori
    } catch (e) {
        console.error('Errore durante il salvataggio dell\'errore:', e);
    }
    
    // Mostra un messaggio di errore all'utente
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = 'Si è verificato un errore. Ricarica la pagina se l\'applicazione non funziona correttamente.';
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 5000);
});

// Gestione delle promesse non gestite
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promessa non gestita:', event.reason);
    
    // Salva l'errore nel localStorage per debug
    try {
        const errors = JSON.parse(localStorage.getItem('taskmaster_unhandled_rejections') || '[]');
        errors.push({
            message: event.reason.message,
            stack: event.reason.stack,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('taskmaster_unhandled_rejections', JSON.stringify(errors.slice(-10))); // Mantieni solo gli ultimi 10 errori
    } catch (e) {
        console.error('Errore durante il salvataggio della promessa non gestita:', e);
    }
});
