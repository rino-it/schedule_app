/**
 * Controller per la gestione delle attività
 */
import Task from '../models/Task.js';
import Storage from '../utils/Storage.js';
import DateUtils from '../utils/DateUtils.js';

export default class TaskController {
    /**
     * Inizializza il controller
     * @param {Scheduler} scheduler - Istanza dello scheduler
     */
    constructor(scheduler) {
        this.scheduler = scheduler;
        this.tasks = [];
        this.eventListeners = {};
    }

    /**
     * Inizializza il controller
     * @returns {Promise} Promise che si risolve quando l'inizializzazione è completata
     */
    async init() {
        try {
            // Inizializza il database
            await Storage.initDatabase();
            
            // Carica i vincoli di sistema
            const systemConstraints = await this._loadSystemConstraints();
            this.scheduler.setSystemConstraints(systemConstraints);
            
            // Carica le attività
            await this.loadTasks();
            
            // Esegue la schedulazione iniziale
            this.scheduler.schedule();
            
            // Emette l'evento di inizializzazione completata
            this._emitEvent('initialized');
            
            return true;
        } catch (error) {
            console.error('Errore durante l\'inizializzazione del controller:', error);
            return false;
        }
    }

    /**
     * Carica i vincoli di sistema
     * @returns {Promise<Array>} Promise che si risolve con i vincoli di sistema
     * @private
     */
    async _loadSystemConstraints() {
        try {
            // Tenta di caricare i vincoli personalizzati
            const customConstraints = await Storage.getSetting('systemConstraints');
            
            if (customConstraints) {
                return customConstraints;
            }
            
            // Altrimenti, usa i vincoli predefiniti
            return [
                {
                    name: 'Pausa pranzo',
                    days: [1, 2, 3, 4, 5, 6, 0], // Tutti i giorni
                    startHour: 13,
                    endHour: 14
                },
                {
                    name: 'Riunione di team',
                    days: [1], // Lunedì
                    startHour: 9,
                    endHour: 10.5
                },
                {
                    name: 'Amministrazione contabile',
                    days: [5], // Venerdì
                    startHour: 15,
                    endHour: 17
                },
                {
                    name: 'Tempo famiglia',
                    days: [1, 2, 3, 4, 5, 6, 0], // Tutti i giorni
                    startHour: 18.5,
                    endHour: 21
                },
                {
                    name: 'Revisione settimanale',
                    days: [5], // Venerdì
                    startHour: 17,
                    endHour: 18
                }
            ];
        } catch (error) {
            console.error('Errore durante il caricamento dei vincoli di sistema:', error);
            return [];
        }
    }

    /**
     * Carica le attività dal database
     * @returns {Promise} Promise che si risolve quando le attività sono caricate
     */
    async loadTasks() {
        try {
            // Carica tutte le attività dal database
            const taskData = await Storage.getAllTasks();
            
            // Converte i dati in oggetti Task
            this.tasks = taskData.map(data => Task.fromObject(data));
            
            // Carica le attività nello scheduler
            this.scheduler.loadTasks(this.tasks);
            
            // Emette l'evento di caricamento completato
            this._emitEvent('tasksLoaded', this.tasks);
            
            return this.tasks;
        } catch (error) {
            console.error('Errore durante il caricamento delle attività:', error);
            return [];
        }
    }

    /**
     * Crea una nuova attività
     * @param {Object} taskData - Dati dell'attività
     * @returns {Promise<Task>} Promise che si risolve con l'attività creata
     */
    async createTask(taskData) {
        try {
            // Crea una nuova attività
            const task = new Task(taskData);
            
            // Verifica se l'attività è valida
            if (!task.isValid()) {
                throw new Error('Dati attività non validi');
            }
            
            // Salva l'attività nel database
            const taskId = await Storage.saveTask(task.toObject());
            task.id = taskId;
            
            // Aggiunge l'attività alla lista e allo scheduler
            this.tasks.push(task);
            this.scheduler.addTask(task);
            
            // Riesegue la schedulazione
            this.scheduler.schedule();
            
            // Emette l'evento di attività creata
            this._emitEvent('taskCreated', task);
            
            return task;
        } catch (error) {
            console.error('Errore durante la creazione dell\'attività:', error);
            throw error;
        }
    }

    /**
     * Aggiorna un'attività esistente
     * @param {String} taskId - ID dell'attività da aggiornare
     * @param {Object} taskData - Nuovi dati dell'attività
     * @returns {Promise<Task>} Promise che si risolve con l'attività aggiornata
     */
    async updateTask(taskId, taskData) {
        try {
            // Trova l'attività
            const taskIndex = this.tasks.findIndex(t => t.id === taskId);
            
            if (taskIndex === -1) {
                throw new Error('Attività non trovata');
            }
            
            // Aggiorna l'attività
            this.tasks[taskIndex].update(taskData);
            
            // Verifica se l'attività è valida
            if (!this.tasks[taskIndex].isValid()) {
                throw new Error('Dati attività non validi');
            }
            
            // Salva l'attività nel database
            await Storage.saveTask(this.tasks[taskIndex].toObject());
            
            // Aggiorna lo scheduler
            this.scheduler.loadTasks(this.tasks);
            
            // Riesegue la schedulazione
            this.scheduler.schedule();
            
            // Emette l'evento di attività aggiornata
            this._emitEvent('taskUpdated', this.tasks[taskIndex]);
            
            return this.tasks[taskIndex];
        } catch (error) {
            console.error('Errore durante l\'aggiornamento dell\'attività:', error);
            throw error;
        }
    }

    /**
     * Elimina un'attività
     * @param {String} taskId - ID dell'attività da eliminare
     * @returns {Promise<Boolean>} Promise che si risolve con true se l'eliminazione è riuscita
     */
    async deleteTask(taskId) {
        try {
            // Trova l'attività
            const taskIndex = this.tasks.findIndex(t => t.id === taskId);
            
            if (taskIndex === -1) {
                throw new Error('Attività non trovata');
            }
            
            // Elimina l'attività dal database
            await Storage.deleteTask(taskId);
            
            // Rimuove l'attività dalla lista
            const deletedTask = this.tasks.splice(taskIndex, 1)[0];
            
            // Rimuove l'attività dallo scheduler
            this.scheduler.removeTask(taskId);
            
            // Riesegue la schedulazione
            this.scheduler.schedule();
            
            // Emette l'evento di attività eliminata
            this._emitEvent('taskDeleted', deletedTask);
            
            return true;
        } catch (error) {
            console.error('Errore durante l\'eliminazione dell\'attività:', error);
            return false;
        }
    }

    /**
     * Marca un'attività come completata
     * @param {String} taskId - ID dell'attività da completare
     * @returns {Promise<Task>} Promise che si risolve con l'attività completata
     */
    async completeTask(taskId) {
        try {
            // Trova l'attività
            const taskIndex = this.tasks.findIndex(t => t.id === taskId);
            
            if (taskIndex === -1) {
                throw new Error('Attività non trovata');
            }
            
            // Marca l'attività come completata
            this.tasks[taskIndex].complete();
            
            // Salva l'attività nel database
            await Storage.saveTask(this.tasks[taskIndex].toObject());
            
            // Aggiorna lo scheduler
            this.scheduler.loadTasks(this.tasks);
            
            // Riesegue la schedulazione
            this.scheduler.schedule();
            
            // Emette l'evento di attività completata
            this._emitEvent('taskCompleted', this.tasks[taskIndex]);
            
            return this.tasks[taskIndex];
        } catch (error) {
            console.error('Errore durante il completamento dell\'attività:', error);
            throw error;
        }
    }

    /**
     * Sposta un'attività a un nuovo orario
     * @param {String} taskId - ID dell'attività da spostare
     * @param {Date} newStartTime - Nuovo orario di inizio
     * @returns {Promise<Boolean>} Promise che si risolve con true se lo spostamento è riuscito
     */
    async moveTask(taskId, newStartTime) {
        try {
            // Verifica se lo spostamento è possibile
            if (!this.scheduler.canMoveTask(taskId, newStartTime)) {
                return false;
            }
            
            // Trova l'attività
            const taskIndex = this.tasks.findIndex(t => t.id === taskId);
            
            if (taskIndex === -1) {
                throw new Error('Attività non trovata');
            }
            
            // Aggiorna l'orario di inizio
            this.tasks[taskIndex].update({
                scheduledStart: newStartTime.toISOString()
            });
            
            // Salva l'attività nel database
            await Storage.saveTask(this.tasks[taskIndex].toObject());
            
            // Aggiorna lo scheduler
            this.scheduler.loadTasks(this.tasks);
            
            // Riesegue la schedulazione
            this.scheduler.schedule();
            
            // Emette l'evento di attività spostata
            this._emitEvent('taskMoved', this.tasks[taskIndex]);
            
            return true;
        } catch (error) {
            console.error('Errore durante lo spostamento dell\'attività:', error);
            return false;
        }
    }

    /**
     * Ricalcola la schedulazione
     * @returns {Promise<Array>} Promise che si risolve con le attività schedulate
     */
    async recalculateSchedule() {
        try {
            // Riesegue la schedulazione
            const scheduledTasks = this.scheduler.schedule();
            
            // Salva le attività schedulate nel database
            for (const task of scheduledTasks) {
                await Storage.saveTask(task.toObject());
            }
            
            // Aggiorna la lista delle attività
            await this.loadTasks();
            
            // Emette l'evento di schedulazione ricalcolata
            this._emitEvent('scheduleRecalculated', scheduledTasks);
            
            return scheduledTasks;
        } catch (error) {
            console.error('Errore durante la ricalcolazione della schedulazione:', error);
            throw error;
        }
    }

    /**
     * Ottiene le attività per una data specifica
     * @param {Date} date - Data da considerare
     * @returns {Array} Attività schedulate per la data
     */
    getTasksForDate(date) {
        return this.scheduler.getTasksForDate(date);
    }

    /**
     * Ottiene le attività per una settimana
     * @param {Date} startDate - Data di inizio settimana
     * @returns {Object} Attività schedulate per giorno
     */
    getTasksForWeek(startDate) {
        return this.scheduler.getTasksForWeek(startDate);
    }

    /**
     * Analizza la distribuzione del tempo
     * @returns {Object} Statistiche sulla distribuzione del tempo
     */
    analyzeTimeDistribution() {
        return this.scheduler.analyzeTimeDistribution();
    }

    /**
     * Verifica se c'è un sovraccarico di attività
     * @returns {Object} Informazioni sul sovraccarico
     */
    checkOverload() {
        return this.scheduler.checkOverload();
    }

    /**
     * Identifica attività che potrebbero essere delegate
     * @returns {Array} Attività candidabili per delega
     */
    identifyDelegationCandidates() {
        return this.scheduler.identifyDelegationCandidates();
    }

    /**
     * Identifica attività che potrebbero essere rimandate
     * @returns {Array} Attività candidabili per posticipo
     */
    identifyPostponementCandidates() {
        return this.scheduler.identifyPostponementCandidates();
    }

    /**
     * Identifica i conflitti nella schedulazione
     * @returns {Array} Conflitti trovati
     */
    identifyConflicts() {
        return this.scheduler.identifyConflicts();
    }

    /**
     * Propone scenari alternativi per risolvere i conflitti
     * @param {Array} conflicts - Conflitti da risolvere
     * @returns {Array} Scenari alternativi
     */
    proposeAlternatives(conflicts) {
        return this.scheduler.proposeAlternatives(conflicts);
    }

    /**
     * Esporta i dati in formato iCalendar
     * @returns {Promise<String>} Promise che si risolve con i dati in formato iCalendar
     */
    async exportToICalendar() {
        try {
            // Ottiene tutte le attività
            const tasks = await this.loadTasks();
            
            // Esporta in formato iCalendar
            const icalData = Storage.exportToICalendar(tasks);
            
            return icalData;
        } catch (error) {
            console.error('Errore durante l\'esportazione in formato iCalendar:', error);
            throw error;
        }
    }

    /**
     * Esporta tutti i dati in formato JSON
     * @returns {Promise<Object>} Promise che si risolve con i dati esportati
     */
    async exportData() {
        try {
            // Esporta i dati
            const data = await Storage.exportData();
            
            return data;
        } catch (error) {
            console.error('Errore durante l\'esportazione dei dati:', error);
            throw error;
        }
    }

    /**
     * Importa dati da un file JSON
     * @param {Object} data - Dati da importare
     * @returns {Promise<Object>} Promise che si risolve quando i dati sono stati importati
     */
    async importData(data) {
        try {
            // Importa i dati
            const result = await Storage.importData(data);
            
            // Ricarica le attività
            await this.loadTasks();
            
            // Riesegue la schedulazione
            this.scheduler.schedule();
            
            // Emette l'evento di dati importati
            this._emitEvent('dataImported', result);
            
            return result;
        } catch (error) {
            console.error('Errore durante l\'importazione dei dati:', error);
            throw error;
        }
    }

    /**
     * Registra un listener per un evento
     * @param {String} event - Nome dell'evento
     * @param {Function} callback - Funzione da chiamare quando l'evento si verifica
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        
        this.eventListeners[event].push(callback);
    }

    /**
     * Rimuove un listener per un evento
     * @param {String} event - Nome dell'evento
     * @param {Function} callback - Funzione da rimuovere
     */
    off(event, callback) {
        if (!this.eventListeners[event]) {
            return;
        }
        
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }

    /**
     * Emette un evento
     * @param {String} event - Nome dell'evento
     * @param {*} data - Dati da passare ai listener
     * @private
     */
    _emitEvent(event, data) {
        if (!this.eventListeners[event]) {
            return;
        }
        
        for (const callback of this.eventListeners[event]) {
            callback(data);
        }
    }
}
