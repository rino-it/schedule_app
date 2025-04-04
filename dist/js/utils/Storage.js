/**
 * Utility per la gestione della persistenza dei dati
 */
export default class Storage {
    /**
     * Inizializza il database IndexedDB
     * @returns {Promise} Promise che si risolve quando il database è pronto
     */
    static initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('taskmaster-db', 1);
            
            request.onerror = event => {
                console.error('Errore nell\'apertura del database:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = event => {
                console.log('Database aperto con successo');
                this.db = event.target.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = event => {
                console.log('Aggiornamento della struttura del database');
                const db = event.target.result;
                
                // Crea gli object store necessari se non esistono
                if (!db.objectStoreNames.contains('tasks')) {
                    const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
                    
                    // Crea indici per ricerche efficienti
                    taskStore.createIndex('deadline', 'deadline', { unique: false });
                    taskStore.createIndex('priority', 'priority', { unique: false });
                    taskStore.createIndex('category', 'category', { unique: false });
                    taskStore.createIndex('completed', 'completed', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('syncQueue')) {
                    db.createObjectStore('syncQueue', { keyPath: 'id' });
                }
            };
        });
    }
    
    /**
     * Salva un'attività nel database
     * @param {Object} task - Attività da salvare
     * @returns {Promise} Promise che si risolve con l'ID dell'attività salvata
     */
    static saveTask(task) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database non inizializzato'));
                return;
            }
            
            const transaction = this.db.transaction(['tasks', 'syncQueue'], 'readwrite');
            const taskStore = transaction.objectStore('tasks');
            const syncStore = transaction.objectStore('syncQueue');
            
            // Se l'attività non ha un ID, ne genera uno
            if (!task.id) {
                task.id = this.generateId();
                task.createdAt = new Date().toISOString();
            }
            
            task.updatedAt = new Date().toISOString();
            
            const request = taskStore.put(task);
            
            request.onerror = event => {
                console.error('Errore nel salvataggio dell\'attività:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = event => {
                console.log('Attività salvata con successo:', task.id);
                
                // Aggiunge l'attività alla coda di sincronizzazione
                syncStore.put({
                    id: task.id,
                    action: 'save',
                    data: task,
                    timestamp: new Date().toISOString()
                });
                
                resolve(task.id);
            };
        });
    }
    
    /**
     * Recupera un'attività dal database
     * @param {String} id - ID dell'attività da recuperare
     * @returns {Promise} Promise che si risolve con l'attività
     */
    static getTask(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database non inizializzato'));
                return;
            }
            
            const transaction = this.db.transaction('tasks', 'readonly');
            const store = transaction.objectStore('tasks');
            const request = store.get(id);
            
            request.onerror = event => {
                console.error('Errore nel recupero dell\'attività:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = event => {
                resolve(request.result);
            };
        });
    }
    
    /**
     * Recupera tutte le attività dal database
     * @param {Object} filters - Filtri da applicare
     * @returns {Promise} Promise che si risolve con un array di attività
     */
    static getAllTasks(filters = {}) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database non inizializzato'));
                return;
            }
            
            const transaction = this.db.transaction('tasks', 'readonly');
            const store = transaction.objectStore('tasks');
            const request = store.getAll();
            
            request.onerror = event => {
                console.error('Errore nel recupero delle attività:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = event => {
                let tasks = request.result;
                
                // Applica i filtri
                if (filters) {
                    if (filters.completed !== undefined) {
                        tasks = tasks.filter(task => task.completed === filters.completed);
                    }
                    
                    if (filters.category) {
                        tasks = tasks.filter(task => task.category === filters.category);
                    }
                    
                    if (filters.priority) {
                        tasks = tasks.filter(task => task.priority === filters.priority);
                    }
                    
                    if (filters.startDate && filters.endDate) {
                        tasks = tasks.filter(task => {
                            const taskDate = new Date(task.scheduledStart || task.deadline);
                            return taskDate >= new Date(filters.startDate) && 
                                   taskDate <= new Date(filters.endDate);
                        });
                    }
                }
                
                resolve(tasks);
            };
        });
    }
    
    /**
     * Elimina un'attività dal database
     * @param {String} id - ID dell'attività da eliminare
     * @returns {Promise} Promise che si risolve quando l'attività è stata eliminata
     */
    static deleteTask(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database non inizializzato'));
                return;
            }
            
            const transaction = this.db.transaction(['tasks', 'syncQueue'], 'readwrite');
            const taskStore = transaction.objectStore('tasks');
            const syncStore = transaction.objectStore('syncQueue');
            
            const request = taskStore.delete(id);
            
            request.onerror = event => {
                console.error('Errore nell\'eliminazione dell\'attività:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = event => {
                console.log('Attività eliminata con successo:', id);
                
                // Aggiunge l'eliminazione alla coda di sincronizzazione
                syncStore.put({
                    id: id,
                    action: 'delete',
                    timestamp: new Date().toISOString()
                });
                
                resolve();
            };
        });
    }
    
    /**
     * Salva un'impostazione nel database
     * @param {String} key - Chiave dell'impostazione
     * @param {*} value - Valore dell'impostazione
     * @returns {Promise} Promise che si risolve quando l'impostazione è stata salvata
     */
    static saveSetting(key, value) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database non inizializzato'));
                return;
            }
            
            const transaction = this.db.transaction('settings', 'readwrite');
            const store = transaction.objectStore('settings');
            
            const request = store.put({
                id: key,
                value: value,
                updatedAt: new Date().toISOString()
            });
            
            request.onerror = event => {
                console.error('Errore nel salvataggio dell\'impostazione:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = event => {
                console.log('Impostazione salvata con successo:', key);
                resolve();
            };
        });
    }
    
    /**
     * Recupera un'impostazione dal database
     * @param {String} key - Chiave dell'impostazione
     * @returns {Promise} Promise che si risolve con il valore dell'impostazione
     */
    static getSetting(key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database non inizializzato'));
                return;
            }
            
            const transaction = this.db.transaction('settings', 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(key);
            
            request.onerror = event => {
                console.error('Errore nel recupero dell\'impostazione:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = event => {
                const result = request.result;
                resolve(result ? result.value : null);
            };
        });
    }
    
    /**
     * Esporta tutti i dati in formato JSON
     * @returns {Promise} Promise che si risolve con i dati esportati
     */
    static exportData() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database non inizializzato'));
                return;
            }
            
            const data = {
                tasks: [],
                settings: [],
                version: 1,
                exportDate: new Date().toISOString()
            };
            
            const transaction = this.db.transaction(['tasks', 'settings'], 'readonly');
            
            const taskStore = transaction.objectStore('tasks');
            const taskRequest = taskStore.getAll();
            
            taskRequest.onerror = event => {
                console.error('Errore nell\'esportazione delle attività:', event.target.error);
                reject(event.target.error);
            };
            
            taskRequest.onsuccess = event => {
                data.tasks = taskRequest.result;
                
                const settingStore = transaction.objectStore('settings');
                const settingRequest = settingStore.getAll();
                
                settingRequest.onerror = event => {
                    console.error('Errore nell\'esportazione delle impostazioni:', event.target.error);
                    reject(event.target.error);
                };
                
                settingRequest.onsuccess = event => {
                    data.settings = settingRequest.result;
                    resolve(data);
                };
            };
        });
    }
    
    /**
     * Importa dati da un file JSON
     * @param {Object} data - Dati da importare
     * @returns {Promise} Promise che si risolve quando i dati sono stati importati
     */
    static importData(data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database non inizializzato'));
                return;
            }
            
            if (!data || !data.tasks || !data.settings) {
                reject(new Error('Dati non validi'));
                return;
            }
            
            const transaction = this.db.transaction(['tasks', 'settings'], 'readwrite');
            const taskStore = transaction.objectStore('tasks');
            const settingStore = transaction.objectStore('settings');
            
            // Importa le attività
            let taskCount = 0;
            for (const task of data.tasks) {
                const request = taskStore.put(task);
                request.onsuccess = () => {
                    taskCount++;
                    if (taskCount === data.tasks.length) {
                        // Importa le impostazioni
                        let settingCount = 0;
                        for (const setting of data.settings) {
                            const request = settingStore.put(setting);
                            request.onsuccess = () => {
                                settingCount++;
                                if (settingCount === data.settings.length) {
                                    resolve({
                                        tasks: taskCount,
                                        settings: settingCount
                                    });
                                }
                            };
                            request.onerror = event => {
                                console.error('Errore nell\'importazione dell\'impostazione:', event.target.error);
                                reject(event.target.error);
                            };
                        }
                        
                        // Se non ci sono impostazioni, risolve subito
                        if (data.settings.length === 0) {
                            resolve({
                                tasks: taskCount,
                                settings: 0
                            });
                        }
                    }
                };
                request.onerror = event => {
                    console.error('Errore nell\'importazione dell\'attività:', event.target.error);
                    reject(event.target.error);
                };
            }
            
            // Se non ci sono attività, passa alle impostazioni
            if (data.tasks.length === 0) {
                let settingCount = 0;
                for (const setting of data.settings) {
                    const request = settingStore.put(setting);
                    request.onsuccess = () => {
                        settingCount++;
                        if (settingCount === data.settings.length) {
                            resolve({
                                tasks: 0,
                                settings: settingCount
                            });
                        }
                    };
                    request.onerror = event => {
                        console.error('Errore nell\'importazione dell\'impostazione:', event.target.error);
                        reject(event.target.error);
                    };
                }
                
                // Se non ci sono impostazioni, risolve subito
                if (data.settings.length === 0) {
                    resolve({
                        tasks: 0,
                        settings: 0
                    });
                }
            }
        });
    }
    
    /**
     * Genera un ID univoco
     * @returns {String} ID generato
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    /**
     * Esporta i dati in formato iCalendar
     * @param {Array} tasks - Attività da esportare
     * @returns {String} Dati in formato iCalendar
     */
    static exportToICalendar(tasks) {
        let icalContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//TaskMaster//IT',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];
        
        for (const task of tasks) {
            if (!task.scheduledStart) continue;
            
            const startDate = new Date(task.scheduledStart);
            const endDate = new Date(startDate.getTime() + task.duration * 60 * 60 * 1000);
            
            const formatDate = (date) => {
                return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            };
            
            const priority = 10 - task.priority * 2; // Converte priorità 1-5 in 9-1 (iCal)
            
            icalContent.push('BEGIN:VEVENT');
            icalContent.push(`UID:${task.id}@taskmaster`);
            icalContent.push(`DTSTAMP:${formatDate(new Date())}`);
            icalContent.push(`DTSTART:${formatDate(startDate)}`);
            icalContent.push(`DTEND:${formatDate(endDate)}`);
            icalContent.push(`SUMMARY:${task.title}`);
            
            if (task.description) {
                icalContent.push(`DESCRIPTION:${task.description.replace(/\n/g, '\\n')}`);
            }
            
            icalContent.push(`CATEGORIES:${task.category}`);
            icalContent.push(`PRIORITY:${priority}`);
            
            if (task.completed) {
                icalContent.push('STATUS:COMPLETED');
            } else {
                icalContent.push('STATUS:CONFIRMED');
            }
            
            icalContent.push('END:VEVENT');
        }
        
        icalContent.push('END:VCALENDAR');
        
        return icalContent.join('\r\n');
    }
}
