/**
 * Utility per la gestione delle funzionalità offline
 */
import Storage from './Storage.js';
import BackupManager from './BackupManager.js';
import SyncManager from './SyncManager.js';

export default class OfflineManager {
    /**
     * Inizializza il manager delle funzionalità offline
     * @param {SyncManager} syncManager - Istanza del SyncManager
     */
    constructor(syncManager) {
        this.syncManager = syncManager;
        this.isOnline = navigator.onLine;
        this.offlineMode = false;
        this.offlineModeForced = false;
        this.lastOnlineTime = Date.now();
        this.reconnectionAttempts = 0;
    }

    /**
     * Inizializza il manager
     * @returns {Promise<Boolean>} Promise che si risolve con true se l'inizializzazione è riuscita
     */
    async init() {
        try {
            // Registra gli event listener per lo stato della connessione
            window.addEventListener('online', () => this._handleOnline());
            window.addEventListener('offline', () => this._handleOffline());
            
            // Imposta lo stato iniziale
            this.isOnline = navigator.onLine;
            
            // Carica le impostazioni
            const offlineModeForced = await Storage.getSetting('offlineModeForced');
            if (offlineModeForced !== null) {
                this.offlineModeForced = offlineModeForced;
            }
            
            // Se è in modalità offline forzata, imposta la modalità offline
            if (this.offlineModeForced) {
                this.offlineMode = true;
            } else {
                this.offlineMode = !this.isOnline;
            }
            
            // Esegui un backup se online
            if (this.isOnline && !this.offlineMode) {
                BackupManager.performAutomaticBackupIfNeeded();
            }
            
            return true;
        } catch (error) {
            console.error('Errore durante l\'inizializzazione dell\'OfflineManager:', error);
            return false;
        }
    }

    /**
     * Gestisce l'evento online
     * @private
     */
    _handleOnline() {
        this.isOnline = true;
        this.lastOnlineTime = Date.now();
        this.reconnectionAttempts = 0;
        
        // Se non è in modalità offline forzata, disattiva la modalità offline
        if (!this.offlineModeForced) {
            this.offlineMode = false;
            
            // Notifica il cambiamento di stato
            this._notifyStateChange();
            
            // Sincronizza i dati
            this.syncManager.sync();
            
            // Esegui un backup
            BackupManager.performAutomaticBackupIfNeeded();
        }
    }

    /**
     * Gestisce l'evento offline
     * @private
     */
    _handleOffline() {
        this.isOnline = false;
        this.offlineMode = true;
        
        // Notifica il cambiamento di stato
        this._notifyStateChange();
    }

    /**
     * Notifica il cambiamento di stato
     * @private
     */
    _notifyStateChange() {
        // Crea un evento personalizzato
        const event = new CustomEvent('offlineStateChange', {
            detail: {
                isOnline: this.isOnline,
                offlineMode: this.offlineMode,
                offlineModeForced: this.offlineModeForced
            }
        });
        
        // Dispara l'evento
        window.dispatchEvent(event);
        
        // Mostra un messaggio all'utente
        this._showStatusMessage();
    }

    /**
     * Mostra un messaggio di stato all'utente
     * @private
     */
    _showStatusMessage() {
        let message = '';
        let type = 'info';
        
        if (this.offlineModeForced) {
            message = 'Modalità offline forzata attiva. I dati non verranno sincronizzati.';
            type = 'warning';
        } else if (!this.isOnline) {
            message = 'Sei offline. I dati verranno sincronizzati quando tornerai online.';
            type = 'warning';
        } else if (this.syncManager.hasPendingOperations()) {
            message = 'Sincronizzazione dati in corso...';
            type = 'info';
        } else {
            message = 'Sei online. Tutti i dati sono sincronizzati.';
            type = 'success';
        }
        
        // Mostra il messaggio
        this._showToast(message, type);
    }

    /**
     * Mostra un messaggio toast
     * @param {String} message - Messaggio da mostrare
     * @param {String} type - Tipo di messaggio (success, error, warning, info)
     * @private
     */
    _showToast(message, type = 'info') {
        // Crea l'elemento toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        // Aggiungi il toast al documento
        document.body.appendChild(toast);
        
        // Mostra il toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Rimuovi il toast dopo 3 secondi
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    /**
     * Attiva/disattiva la modalità offline forzata
     * @param {Boolean} forced - Se forzare la modalità offline
     * @returns {Promise<Boolean>} Promise che si risolve con true se l'operazione è riuscita
     */
    async toggleForcedOfflineMode(forced) {
        try {
            this.offlineModeForced = forced;
            
            // Salva l'impostazione
            await Storage.saveSetting('offlineModeForced', forced);
            
            // Aggiorna la modalità offline
            if (forced) {
                this.offlineMode = true;
            } else {
                this.offlineMode = !this.isOnline;
            }
            
            // Notifica il cambiamento di stato
            this._notifyStateChange();
            
            // Se torna online e ci sono operazioni in attesa, sincronizza
            if (!this.offlineMode && this.isOnline && this.syncManager.hasPendingOperations()) {
                this.syncManager.sync();
            }
            
            return true;
        } catch (error) {
            console.error('Errore durante il cambio della modalità offline forzata:', error);
            return false;
        }
    }

    /**
     * Verifica se è in modalità offline
     * @returns {Boolean} True se è in modalità offline
     */
    isOfflineMode() {
        return this.offlineMode;
    }

    /**
     * Verifica se la modalità offline è forzata
     * @returns {Boolean} True se la modalità offline è forzata
     */
    isOfflineModeForced() {
        return this.offlineModeForced;
    }

    /**
     * Verifica se è online
     * @returns {Boolean} True se è online
     */
    isNetworkOnline() {
        return this.isOnline;
    }

    /**
     * Ottiene il tempo trascorso dall'ultima connessione
     * @returns {Number} Tempo trascorso in millisecondi
     */
    getTimeSinceLastOnline() {
        return Date.now() - this.lastOnlineTime;
    }

    /**
     * Tenta di riconnettersi
     * @returns {Promise<Boolean>} Promise che si risolve con true se la riconnessione è riuscita
     */
    async attemptReconnection() {
        try {
            // Se è già online, esci
            if (this.isOnline) {
                return true;
            }
            
            // Incrementa il contatore dei tentativi
            this.reconnectionAttempts++;
            
            // In un'implementazione reale, qui si tenterebbe di stabilire una connessione
            // Per semplicità, in questa implementazione controlliamo solo lo stato della rete
            const online = navigator.onLine;
            
            if (online) {
                this._handleOnline();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Errore durante il tentativo di riconnessione:', error);
            return false;
        }
    }
}
