/**
 * Utility per la gestione delle notifiche
 */
export default class NotificationManager {
    /**
     * Inizializza il manager delle notifiche
     */
    constructor() {
        this.notificationsEnabled = false;
        this.notificationQueue = [];
    }

    /**
     * Inizializza il manager
     * @returns {Promise<Boolean>} Promise che si risolve con true se l'inizializzazione è riuscita
     */
    async init() {
        try {
            // Verifica se le notifiche sono supportate
            if (!('Notification' in window)) {
                console.log('Le notifiche non sono supportate in questo browser');
                return false;
            }

            // Verifica se le notifiche sono già abilitate
            if (Notification.permission === 'granted') {
                this.notificationsEnabled = true;
                return true;
            }

            // Altrimenti, memorizza lo stato corrente
            this.notificationsEnabled = Notification.permission === 'granted';
            
            return this.notificationsEnabled;
        } catch (error) {
            console.error('Errore durante l\'inizializzazione del NotificationManager:', error);
            return false;
        }
    }

    /**
     * Richiede il permesso per le notifiche
     * @returns {Promise<Boolean>} Promise che si risolve con true se il permesso è stato concesso
     */
    async requestPermission() {
        try {
            // Richiedi il permesso
            const permission = await Notification.requestPermission();
            
            // Aggiorna lo stato
            this.notificationsEnabled = permission === 'granted';
            
            return this.notificationsEnabled;
        } catch (error) {
            console.error('Errore durante la richiesta del permesso per le notifiche:', error);
            return false;
        }
    }

    /**
     * Verifica se le notifiche sono abilitate
     * @returns {Boolean} True se le notifiche sono abilitate
     */
    areNotificationsEnabled() {
        return this.notificationsEnabled;
    }

    /**
     * Invia una notifica
     * @param {String} title - Titolo della notifica
     * @param {Object} options - Opzioni della notifica
     * @returns {Promise<Boolean>} Promise che si risolve con true se la notifica è stata inviata
     */
    async sendNotification(title, options = {}) {
        try {
            // Se le notifiche non sono abilitate, aggiungi alla coda
            if (!this.notificationsEnabled) {
                this.notificationQueue.push({ title, options });
                return false;
            }
            
            // Imposta le opzioni predefinite
            const defaultOptions = {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/badge-72x72.png',
                vibrate: [100, 50, 100],
                data: {
                    url: options.url || window.location.href
                }
            };
            
            // Unisci le opzioni
            const mergedOptions = { ...defaultOptions, ...options };
            
            // Invia la notifica
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                // Invia tramite service worker
                await navigator.serviceWorker.ready;
                await navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    title,
                    options: mergedOptions
                });
            } else {
                // Invia direttamente
                new Notification(title, mergedOptions);
            }
            
            return true;
        } catch (error) {
            console.error('Errore durante l\'invio della notifica:', error);
            return false;
        }
    }

    /**
     * Invia le notifiche in coda
     * @returns {Promise<Number>} Promise che si risolve con il numero di notifiche inviate
     */
    async sendQueuedNotifications() {
        try {
            // Se le notifiche non sono abilitate, esci
            if (!this.notificationsEnabled) {
                return 0;
            }
            
            // Se la coda è vuota, esci
            if (this.notificationQueue.length === 0) {
                return 0;
            }
            
            // Invia le notifiche in coda
            let sentCount = 0;
            
            for (const notification of this.notificationQueue) {
                const sent = await this.sendNotification(notification.title, notification.options);
                
                if (sent) {
                    sentCount++;
                }
            }
            
            // Svuota la coda
            this.notificationQueue = [];
            
            return sentCount;
        } catch (error) {
            console.error('Errore durante l\'invio delle notifiche in coda:', error);
            return 0;
        }
    }

    /**
     * Pianifica una notifica per un'attività
     * @param {Task} task - Attività per cui pianificare la notifica
     * @returns {Promise<Boolean>} Promise che si risolve con true se la notifica è stata pianificata
     */
    async scheduleTaskNotification(task) {
        try {
            // Se le notifiche non sono abilitate, esci
            if (!this.notificationsEnabled) {
                return false;
            }
            
            // Se l'attività non ha un orario di inizio pianificato, esci
            if (!task.scheduledStart) {
                return false;
            }
            
            // Calcola il tempo di notifica in base alla priorità
            const startTime = new Date(task.scheduledStart);
            const notificationTime = new Date(startTime);
            
            // Priorità alta: 30 minuti prima
            // Priorità media: 15 minuti prima
            // Priorità bassa: 5 minuti prima
            let minutesBefore = 15;
            
            if (task.priority >= 4) {
                minutesBefore = 30;
            } else if (task.priority <= 2) {
                minutesBefore = 5;
            }
            
            notificationTime.setMinutes(notificationTime.getMinutes() - minutesBefore);
            
            // Se il tempo di notifica è già passato, esci
            if (notificationTime < new Date()) {
                return false;
            }
            
            // In un'implementazione reale, qui si utilizzerebbe l'API Notification Triggers
            // o si registrerebbe la notifica nel service worker
            // Per semplicità, in questa implementazione utilizziamo setTimeout
            
            const timeUntilNotification = notificationTime.getTime() - Date.now();
            
            setTimeout(() => {
                this.sendNotification(`Promemoria: ${task.title}`, {
                    body: `Inizia tra ${minutesBefore} minuti`,
                    tag: `task-${task.id}`,
                    data: {
                        taskId: task.id
                    }
                });
            }, timeUntilNotification);
            
            return true;
        } catch (error) {
            console.error('Errore durante la pianificazione della notifica per l\'attività:', error);
            return false;
        }
    }
}
