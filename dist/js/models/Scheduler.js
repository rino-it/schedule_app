/**
 * Modello per la schedulazione intelligente delle attività
 */
export default class Scheduler {
    /**
     * Inizializza lo scheduler
     * @param {Array} systemConstraints - Vincoli di sistema (orari protetti)
     */
    constructor(systemConstraints = []) {
        this.systemConstraints = systemConstraints;
        this.tasks = [];
        this.scheduledTasks = [];
    }

    /**
     * Imposta i vincoli di sistema
     * @param {Array} constraints - Vincoli di sistema
     */
    setSystemConstraints(constraints) {
        this.systemConstraints = constraints;
    }

    /**
     * Carica le attività nello scheduler
     * @param {Array} tasks - Attività da caricare
     */
    loadTasks(tasks) {
        this.tasks = [...tasks];
    }

    /**
     * Aggiunge una singola attività
     * @param {Task} task - Attività da aggiungere
     */
    addTask(task) {
        this.tasks.push(task);
    }

    /**
     * Rimuove un'attività
     * @param {String} taskId - ID dell'attività da rimuovere
     */
    removeTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.scheduledTasks = this.scheduledTasks.filter(task => task.id !== taskId);
    }

    /**
     * Esegue la schedulazione delle attività
     * @returns {Array} Attività schedulate
     */
    schedule() {
        // Resetta le attività schedulate
        this.scheduledTasks = [];
        
        // Filtra le attività non completate
        const uncompletedTasks = this.tasks.filter(task => !task.completed);
        
        // Ordina le attività per priorità e scadenza
        const sortedTasks = this._sortTasksByPriorityAndDeadline(uncompletedTasks);
        
        // Crea una mappa degli slot temporali disponibili
        const timeSlots = this._generateTimeSlots();
        
        // Assegna le attività agli slot disponibili
        for (const task of sortedTasks) {
            this._assignTaskToTimeSlot(task, timeSlots);
        }
        
        return this.scheduledTasks;
    }

    /**
     * Ordina le attività per priorità e scadenza
     * @param {Array} tasks - Attività da ordinare
     * @returns {Array} Attività ordinate
     * @private
     */
    _sortTasksByPriorityAndDeadline(tasks) {
        return [...tasks].sort((a, b) => {
            // Prima per priorità (decrescente)
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            
            // Poi per scadenza (crescente)
            const deadlineA = new Date(a.deadline);
            const deadlineB = new Date(b.deadline);
            return deadlineA - deadlineB;
        });
    }

    /**
     * Genera gli slot temporali disponibili
     * @returns {Object} Mappa degli slot temporali
     * @private
     */
    _generateTimeSlots() {
        const timeSlots = {};
        const today = new Date();
        
        // Genera slot per i prossimi 14 giorni
        for (let i = 0; i < 14; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);
            const dateKey = this._formatDateKey(currentDate);
            
            timeSlots[dateKey] = {};
            
            // Genera slot orari dalle 8 alle 20
            for (let hour = 8; hour < 20; hour++) {
                const timeKey = `${hour}:00`;
                
                // Verifica se lo slot è protetto dai vincoli di sistema
                const isProtected = this._isTimeSlotProtected(currentDate, hour);
                
                timeSlots[dateKey][timeKey] = {
                    date: new Date(currentDate.setHours(hour, 0, 0, 0)),
                    available: !isProtected,
                    protected: isProtected,
                    task: null
                };
            }
        }
        
        return timeSlots;
    }

    /**
     * Verifica se uno slot temporale è protetto dai vincoli di sistema
     * @param {Date} date - Data da verificare
     * @param {Number} hour - Ora da verificare
     * @returns {Boolean} True se lo slot è protetto
     * @private
     */
    _isTimeSlotProtected(date, hour) {
        const dayOfWeek = date.getDay(); // 0 = Domenica, 1 = Lunedì, ...
        
        for (const constraint of this.systemConstraints) {
            // Verifica se il vincolo si applica a questo giorno
            if (constraint.days.includes(dayOfWeek)) {
                // Verifica se l'ora rientra nell'intervallo del vincolo
                if (hour >= constraint.startHour && hour < constraint.endHour) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Assegna un'attività a uno slot temporale disponibile
     * @param {Task} task - Attività da assegnare
     * @param {Object} timeSlots - Mappa degli slot temporali
     * @private
     */
    _assignTaskToTimeSlot(task, timeSlots) {
        // Calcola il numero di slot necessari per l'attività
        const slotsNeeded = Math.ceil(task.duration);
        
        // Ottiene la data di scadenza
        const deadline = new Date(task.deadline);
        const deadlineDateKey = this._formatDateKey(deadline);
        
        // Determina la fascia oraria preferita
        const preferredHours = this._getPreferredHours(task.timePreference);
        
        // Determina i giorni in cui cercare slot disponibili
        const availableDays = Object.keys(timeSlots).filter(dateKey => {
            return dateKey <= deadlineDateKey;
        }).sort();
        
        // Cerca slot disponibili in base all'energia richiesta
        const energyMatchDays = this._findDaysWithEnergyMatch(task, timeSlots, availableDays);
        
        // Cerca slot consecutivi disponibili
        for (const dateKey of energyMatchDays) {
            // Prima cerca negli orari preferiti
            const preferredSlot = this._findConsecutiveSlots(timeSlots, dateKey, preferredHours, slotsNeeded);
            
            if (preferredSlot) {
                this._assignTaskToSlots(task, timeSlots, dateKey, preferredSlot, slotsNeeded);
                return;
            }
            
            // Se non trova slot negli orari preferiti, cerca in tutti gli orari
            const allHours = Array.from({ length: 12 }, (_, i) => i + 8);
            const anySlot = this._findConsecutiveSlots(timeSlots, dateKey, allHours, slotsNeeded);
            
            if (anySlot) {
                this._assignTaskToSlots(task, timeSlots, dateKey, anySlot, slotsNeeded);
                return;
            }
        }
        
        // Se non trova slot consecutivi, cerca slot non consecutivi
        for (const dateKey of availableDays) {
            const availableSlots = this._findAvailableSlots(timeSlots, dateKey);
            
            if (availableSlots.length > 0) {
                // Assegna l'attività al primo slot disponibile
                const firstSlot = availableSlots[0];
                const taskCopy = { ...task };
                
                // Imposta l'orario di inizio
                const startTime = timeSlots[dateKey][firstSlot].date;
                taskCopy.scheduledStart = startTime.toISOString();
                
                // Aggiunge l'attività agli slot schedulati
                this.scheduledTasks.push(taskCopy);
                
                // Marca lo slot come occupato
                timeSlots[dateKey][firstSlot].available = false;
                timeSlots[dateKey][firstSlot].task = taskCopy;
                
                return;
            }
        }
        
        // Se non trova slot disponibili, aggiunge l'attività senza schedulazione
        this.scheduledTasks.push({ ...task });
    }

    /**
     * Trova giorni con corrispondenza di energia
     * @param {Task} task - Attività da assegnare
     * @param {Object} timeSlots - Mappa degli slot temporali
     * @param {Array} availableDays - Giorni disponibili
     * @returns {Array} Giorni ordinati per corrispondenza di energia
     * @private
     */
    _findDaysWithEnergyMatch(task, timeSlots, availableDays) {
        // Mappa l'energia richiesta a fasce orarie
        const energyHours = {
            'alta': [9, 10, 15, 16],
            'media': [11, 12, 14, 17],
            'bassa': [8, 13, 18, 19]
        };
        
        // Calcola il punteggio di corrispondenza per ogni giorno
        const dayScores = availableDays.map(dateKey => {
            let score = 0;
            const preferredHours = energyHours[task.energy] || [];
            
            for (const hour of preferredHours) {
                const timeKey = `${hour}:00`;
                if (timeSlots[dateKey][timeKey] && timeSlots[dateKey][timeKey].available) {
                    score++;
                }
            }
            
            return { dateKey, score };
        });
        
        // Ordina i giorni per punteggio decrescente
        return dayScores
            .sort((a, b) => b.score - a.score)
            .map(item => item.dateKey);
    }

    /**
     * Trova slot consecutivi disponibili
     * @param {Object} timeSlots - Mappa degli slot temporali
     * @param {String} dateKey - Chiave della data
     * @param {Array} hours - Ore da considerare
     * @param {Number} slotsNeeded - Numero di slot necessari
     * @returns {String|null} Chiave del primo slot disponibile o null
     * @private
     */
    _findConsecutiveSlots(timeSlots, dateKey, hours, slotsNeeded) {
        for (const hour of hours) {
            const startTimeKey = `${hour}:00`;
            
            // Verifica se ci sono abbastanza slot consecutivi disponibili
            let consecutiveSlots = 0;
            for (let i = 0; i < slotsNeeded; i++) {
                const currentHour = hour + i;
                const currentTimeKey = `${currentHour}:00`;
                
                if (
                    timeSlots[dateKey][currentTimeKey] &&
                    timeSlots[dateKey][currentTimeKey].available
                ) {
                    consecutiveSlots++;
                } else {
                    break;
                }
            }
            
            if (consecutiveSlots >= slotsNeeded) {
                return startTimeKey;
            }
        }
        
        return null;
    }

    /**
     * Trova tutti gli slot disponibili in un giorno
     * @param {Object} timeSlots - Mappa degli slot temporali
     * @param {String} dateKey - Chiave della data
     * @returns {Array} Chiavi degli slot disponibili
     * @private
     */
    _findAvailableSlots(timeSlots, dateKey) {
        return Object.keys(timeSlots[dateKey]).filter(timeKey => {
            return timeSlots[dateKey][timeKey].available;
        });
    }

    /**
     * Assegna un'attività a slot consecutivi
     * @param {Task} task - Attività da assegnare
     * @param {Object} timeSlots - Mappa degli slot temporali
     * @param {String} dateKey - Chiave della data
     * @param {String} startTimeKey - Chiave dell'orario di inizio
     * @param {Number} slotsNeeded - Numero di slot necessari
     * @private
     */
    _assignTaskToSlots(task, timeSlots, dateKey, startTimeKey, slotsNeeded) {
        const startHour = parseInt(startTimeKey.split(':')[0]);
        const taskCopy = { ...task };
        
        // Imposta l'orario di inizio
        const startTime = timeSlots[dateKey][startTimeKey].date;
        taskCopy.scheduledStart = startTime.toISOString();
        
        // Aggiunge l'attività agli slot schedulati
        this.scheduledTasks.push(taskCopy);
        
        // Marca gli slot come occupati
        for (let i = 0; i < slotsNeeded; i++) {
            const currentHour = startHour + i;
            const currentTimeKey = `${currentHour}:00`;
            
            if (timeSlots[dateKey][currentTimeKey]) {
                timeSlots[dateKey][currentTimeKey].available = false;
                timeSlots[dateKey][currentTimeKey].task = taskCopy;
            }
        }
    }

    /**
     * Ottiene le ore preferite in base alla fascia oraria
     * @param {String} timePreference - Preferenza di fascia oraria
     * @returns {Array} Ore preferite
     * @private
     */
    _getPreferredHours(timePreference) {
        switch (timePreference) {
            case 'mattina':
                return [8, 9, 10, 11, 12];
            case 'pomeriggio':
                return [14, 15, 16, 17];
            case 'sera':
                return [18, 19];
            case 'indifferente':
            default:
                return Array.from({ length: 12 }, (_, i) => i + 8);
        }
    }

    /**
     * Formatta una data come chiave per la mappa degli slot
     * @param {Date} date - Data da formattare
     * @returns {String} Chiave formattata
     * @private
     */
    _formatDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    /**
     * Ottiene le attività schedulate per una data specifica
     * @param {Date} date - Data da considerare
     * @returns {Array} Attività schedulate per la data
     */
    getTasksForDate(date) {
        const dateKey = this._formatDateKey(date);
        
        return this.scheduledTasks.filter(task => {
            if (!task.scheduledStart) return false;
            
            const taskDate = new Date(task.scheduledStart);
            const taskDateKey = this._formatDateKey(taskDate);
            
            return taskDateKey === dateKey;
        }).sort((a, b) => {
            const startA = new Date(a.scheduledStart);
            const startB = new Date(b.scheduledStart);
            return startA - startB;
        });
    }

    /**
     * Ottiene le attività schedulate per una settimana
     * @param {Date} startDate - Data di inizio settimana
     * @returns {Object} Attività schedulate per giorno
     */
    getTasksForWeek(startDate) {
        const result = {};
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dateKey = this._formatDateKey(currentDate);
            result[dateKey] = this.getTasksForDate(currentDate);
        }
        
        return result;
    }

    /**
     * Verifica se è possibile spostare un'attività
     * @param {String} taskId - ID dell'attività da spostare
     * @param {Date} newStartTime - Nuovo orario di inizio
     * @returns {Boolean} True se lo spostamento è possibile
     */
    canMoveTask(taskId, newStartTime) {
        const task = this.scheduledTasks.find(t => t.id === taskId);
        if (!task) return false;
        
        // Verifica se il nuovo orario rispetta la scadenza
        const deadline = new Date(task.deadline);
        const taskEnd = new Date(newStartTime);
        taskEnd.setTime(taskEnd.getTime() + task.duration * 60 * 60 * 1000);
        
        if (taskEnd > deadline) return false;
        
        // Verifica se il nuovo orario si sovrappone con altre attività
        const dateKey = this._formatDateKey(newStartTime);
        const startHour = newStartTime.getHours();
        const endHour = Math.ceil(startHour + task.duration);
        
        for (let hour = startHour; hour < endHour; hour++) {
            const timeKey = `${hour}:00`;
            
            // Verifica se lo slot è protetto
            if (this._isTimeSlotProtected(newStartTime, hour)) {
                return false;
            }
            
            // Verifica se lo slot è occupato da un'altra attività
            const otherTasks = this.scheduledTasks.filter(t => {
                if (t.id === taskId || !t.scheduledStart) return false;
                
                const tStart = new Date(t.scheduledStart);
                const tDateKey = this._formatDateKey(tStart);
                const tStartHour = tStart.getHours();
                const tEndHour = Math.ceil(tStartHour + t.duration);
                
                return tDateKey === dateKey && hour >= tStartHour && hour < tEndHour;
            });
            
            if (otherTasks.length > 0) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Sposta un'attività a un nuovo orario
     * @param {String} taskId - ID dell'attività da spostare
     * @param {Date} newStartTime - Nuovo orario di inizio
     * @returns {Boolean} True se lo spostamento è riuscito
     */
    moveTask(taskId, newStartTime) {
        if (!this.canMoveTask(taskId, newStartTime)) {
            return false;
        }
        
        const taskIndex = this.scheduledTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return false;
        
        // Aggiorna l'orario di inizio
        this.scheduledTasks[taskIndex].scheduledStart = newStartTime.toISOString();
        this.scheduledTasks[taskIndex].updatedAt = new Date().toISOString();
        
        return true;
    }

    /**
     * Identifica i conflitti nella schedulazione
     * @returns {Array} Conflitti trovati
     */
    identifyConflicts() {
        const conflicts = [];
        
        // Verifica sovrapposizioni tra attività
        for (let i = 0; i < this.scheduledTasks.length; i++) {
            const task1 = this.scheduledTasks[i];
            if (!task1.scheduledStart) continue;
            
            for (let j = i + 1; j < this.scheduledTasks.length; j++) {
                const task2 = this.scheduledTasks[j];
                if (!task2.scheduledStart) continue;
                
                if (task1.overlapsWith(task2)) {
                    conflicts.push({
                        type: 'overlap',
                        task1: task1,
                        task2: task2
                    });
                }
            }
            
            // Verifica se l'attività è schedulata dopo la scadenza
            const startTime = new Date(task1.scheduledStart);
            const endTime = new Date(startTime.getTime() + task1.duration * 60 * 60 * 1000);
            const deadline = new Date(task1.deadline);
            
            if (endTime > deadline) {
                conflicts.push({
                    type: 'deadline',
                    task: task1
                });
            }
            
            // Verifica dipendenze
            for (const depId of task1.dependencies) {
                const depTask = this.scheduledTasks.find(t => t.id === depId);
                
                if (depTask && !depTask.completed && depTask.scheduledStart) {
                    const depEndTime = new Date(depTask.scheduledStart);
                    depEndTime.setTime(depEndTime.getTime() + depTask.duration * 60 * 60 * 1000);
                    
                    if (startTime < depEndTime) {
                        conflicts.push({
                            type: 'dependency',
                            task: task1,
                            dependsOn: depTask
                        });
                    }
                }
            }
        }
        
        return conflicts;
    }

    /**
     * Propone scenari alternativi per risolvere i conflitti
     * @param {Array} conflicts - Conflitti da risolvere
     * @returns {Array} Scenari alternativi
     */
    proposeAlternatives(conflicts) {
        const alternatives = [];
        
        for (const conflict of conflicts) {
            switch (conflict.type) {
                case 'overlap':
                    alternatives.push(
                        this._proposeOverlapAlternatives(conflict.task1, conflict.task2)
                    );
                    break;
                    
                case 'deadline':
                    alternatives.push(
                        this._proposeDeadlineAlternatives(conflict.task)
                    );
                    break;
                    
                case 'dependency':
                    alternatives.push(
                        this._proposeDependencyAlternatives(conflict.task, conflict.dependsOn)
                    );
                    break;
            }
        }
        
        return alternatives;
    }

    /**
     * Propone alternative per conflitti di sovrapposizione
     * @param {Task} task1 - Prima attività in conflitto
     * @param {Task} task2 - Seconda attività in conflitto
     * @returns {Object} Alternative proposte
     * @private
     */
    _proposeOverlapAlternatives(task1, task2) {
        return {
            conflict: {
                type: 'overlap',
                description: `Le attività "${task1.title}" e "${task2.title}" si sovrappongono`
            },
            alternatives: [
                {
                    description: `Spostare "${task1.title}" dopo "${task2.title}"`,
                    impact: 'basso',
                    action: 'move',
                    taskId: task1.id,
                    newTime: this._calculateTimeAfter(task2)
                },
                {
                    description: `Spostare "${task2.title}" dopo "${task1.title}"`,
                    impact: 'basso',
                    action: 'move',
                    taskId: task2.id,
                    newTime: this._calculateTimeAfter(task1)
                },
                {
                    description: `Ripianificare entrambe le attività`,
                    impact: 'medio',
                    action: 'reschedule',
                    taskIds: [task1.id, task2.id]
                }
            ]
        };
    }

    /**
     * Propone alternative per conflitti di scadenza
     * @param {Task} task - Attività in conflitto
     * @returns {Object} Alternative proposte
     * @private
     */
    _proposeDeadlineAlternatives(task) {
        return {
            conflict: {
                type: 'deadline',
                description: `L'attività "${task.title}" è schedulata oltre la scadenza`
            },
            alternatives: [
                {
                    description: `Anticipare "${task.title}" a prima della scadenza`,
                    impact: 'medio',
                    action: 'move',
                    taskId: task.id,
                    newTime: this._calculateTimeBeforeDeadline(task)
                },
                {
                    description: `Estendere la scadenza di "${task.title}"`,
                    impact: 'alto',
                    action: 'extend',
                    taskId: task.id,
                    newDeadline: this._calculateExtendedDeadline(task)
                },
                {
                    description: `Ridurre la durata di "${task.title}"`,
                    impact: 'alto',
                    action: 'reduce',
                    taskId: task.id,
                    newDuration: Math.max(0.5, task.duration * 0.75)
                }
            ]
        };
    }

    /**
     * Propone alternative per conflitti di dipendenza
     * @param {Task} task - Attività in conflitto
     * @param {Task} dependsOn - Attività da cui dipende
     * @returns {Object} Alternative proposte
     * @private
     */
    _proposeDependencyAlternatives(task, dependsOn) {
        return {
            conflict: {
                type: 'dependency',
                description: `L'attività "${task.title}" è schedulata prima del completamento di "${dependsOn.title}" da cui dipende`
            },
            alternatives: [
                {
                    description: `Spostare "${task.title}" dopo "${dependsOn.title}"`,
                    impact: 'basso',
                    action: 'move',
                    taskId: task.id,
                    newTime: this._calculateTimeAfter(dependsOn)
                },
                {
                    description: `Rimuovere la dipendenza da "${dependsOn.title}"`,
                    impact: 'alto',
                    action: 'removeDependency',
                    taskId: task.id,
                    dependencyId: dependsOn.id
                },
                {
                    description: `Anticipare "${dependsOn.title}"`,
                    impact: 'medio',
                    action: 'move',
                    taskId: dependsOn.id,
                    newTime: this._calculateTimeBeforeTask(task, dependsOn)
                }
            ]
        };
    }

    /**
     * Calcola un orario dopo un'attività
     * @param {Task} task - Attività di riferimento
     * @returns {Date} Orario calcolato
     * @private
     */
    _calculateTimeAfter(task) {
        const startTime = new Date(task.scheduledStart);
        const endTime = new Date(startTime);
        endTime.setTime(endTime.getTime() + task.duration * 60 * 60 * 1000);
        
        // Aggiungi un buffer di 30 minuti
        endTime.setTime(endTime.getTime() + 30 * 60 * 1000);
        
        return endTime;
    }

    /**
     * Calcola un orario prima della scadenza
     * @param {Task} task - Attività di riferimento
     * @returns {Date} Orario calcolato
     * @private
     */
    _calculateTimeBeforeDeadline(task) {
        const deadline = new Date(task.deadline);
        const newStartTime = new Date(deadline);
        newStartTime.setTime(newStartTime.getTime() - task.duration * 60 * 60 * 1000);
        
        return newStartTime;
    }

    /**
     * Calcola una scadenza estesa
     * @param {Task} task - Attività di riferimento
     * @returns {Date} Scadenza estesa
     * @private
     */
    _calculateExtendedDeadline(task) {
        const startTime = new Date(task.scheduledStart);
        const endTime = new Date(startTime);
        endTime.setTime(endTime.getTime() + task.duration * 60 * 60 * 1000);
        
        // Aggiungi un buffer di 1 ora
        endTime.setTime(endTime.getTime() + 60 * 60 * 1000);
        
        return endTime;
    }

    /**
     * Calcola un orario prima di un'attività
     * @param {Task} targetTask - Attività target
     * @param {Task} taskToMove - Attività da spostare
     * @returns {Date} Orario calcolato
     * @private
     */
    _calculateTimeBeforeTask(targetTask, taskToMove) {
        const targetStart = new Date(targetTask.scheduledStart);
        const newEndTime = new Date(targetStart);
        
        // Sottrai un buffer di 30 minuti
        newEndTime.setTime(newEndTime.getTime() - 30 * 60 * 1000);
        
        // Calcola il nuovo orario di inizio
        const newStartTime = new Date(newEndTime);
        newStartTime.setTime(newStartTime.getTime() - taskToMove.duration * 60 * 60 * 1000);
        
        return newStartTime;
    }

    /**
     * Analizza la distribuzione del tempo
     * @returns {Object} Statistiche sulla distribuzione del tempo
     */
    analyzeTimeDistribution() {
        const stats = {
            byCategory: {},
            byPriority: {},
            byEnergy: {},
            totalScheduled: 0,
            totalUnscheduled: 0,
            overdue: 0,
            completed: 0,
            upcoming: 0
        };
        
        // Inizializza le categorie
        const categories = ['professionale', 'personale', 'formazione', 'amministrativa', 'altro'];
        categories.forEach(cat => {
            stats.byCategory[cat] = 0;
        });
        
        // Inizializza le priorità
        for (let i = 1; i <= 5; i++) {
            stats.byPriority[i] = 0;
        }
        
        // Inizializza i livelli di energia
        const energyLevels = ['alta', 'media', 'bassa'];
        energyLevels.forEach(level => {
            stats.byEnergy[level] = 0;
        });
        
        // Analizza le attività
        for (const task of this.tasks) {
            // Categoria
            if (stats.byCategory[task.category] !== undefined) {
                stats.byCategory[task.category] += task.duration;
            } else {
                stats.byCategory.altro += task.duration;
            }
            
            // Priorità
            stats.byPriority[task.priority] += task.duration;
            
            // Energia
            stats.byEnergy[task.energy] += task.duration;
            
            // Stato
            if (task.completed) {
                stats.completed += task.duration;
            } else {
                const now = new Date();
                const deadline = new Date(task.deadline);
                
                if (deadline < now) {
                    stats.overdue += task.duration;
                } else {
                    stats.upcoming += task.duration;
                }
            }
            
            // Schedulazione
            if (task.scheduledStart) {
                stats.totalScheduled += task.duration;
            } else {
                stats.totalUnscheduled += task.duration;
            }
        }
        
        return stats;
    }

    /**
     * Identifica attività che potrebbero essere delegate
     * @returns {Array} Attività candidabili per delega
     */
    identifyDelegationCandidates() {
        // Filtra le attività non completate
        const uncompletedTasks = this.tasks.filter(task => !task.completed);
        
        // Identifica le attività a bassa priorità
        const lowPriorityTasks = uncompletedTasks.filter(task => task.priority <= 2);
        
        // Identifica le attività amministrative
        const administrativeTasks = uncompletedTasks.filter(task => 
            task.category === 'amministrativa' || 
            task.title.toLowerCase().includes('amministra') ||
            task.description.toLowerCase().includes('amministra')
        );
        
        // Identifica le attività con poche dipendenze
        const fewDependenciesTasks = uncompletedTasks.filter(task => 
            task.dependencies.length === 0
        );
        
        // Combina i risultati, rimuovendo i duplicati
        const candidates = [...new Set([
            ...lowPriorityTasks,
            ...administrativeTasks,
            ...fewDependenciesTasks
        ])];
        
        // Ordina per priorità crescente
        return candidates.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Identifica attività che potrebbero essere rimandate
     * @returns {Array} Attività candidabili per posticipo
     */
    identifyPostponementCandidates() {
        // Filtra le attività non completate
        const uncompletedTasks = this.tasks.filter(task => !task.completed);
        
        // Identifica le attività a bassa priorità
        const lowPriorityTasks = uncompletedTasks.filter(task => task.priority <= 2);
        
        // Identifica le attività con scadenza lontana
        const now = new Date();
        const farDeadlineTasks = uncompletedTasks.filter(task => {
            const deadline = new Date(task.deadline);
            const diffDays = Math.floor((deadline - now) / (1000 * 60 * 60 * 24));
            return diffDays > 7;
        });
        
        // Identifica le attività non dipendenti da altre
        const nonBlockingTasks = uncompletedTasks.filter(task => {
            // Verifica se ci sono attività che dipendono da questa
            return !uncompletedTasks.some(t => t.dependencies.includes(task.id));
        });
        
        // Combina i risultati, rimuovendo i duplicati
        const candidates = [...new Set([
            ...lowPriorityTasks,
            ...farDeadlineTasks,
            ...nonBlockingTasks
        ])];
        
        // Ordina per priorità crescente e poi per scadenza decrescente
        return candidates.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            
            const deadlineA = new Date(a.deadline);
            const deadlineB = new Date(b.deadline);
            return deadlineB - deadlineA;
        });
    }

    /**
     * Verifica se c'è un sovraccarico di attività
     * @returns {Object} Informazioni sul sovraccarico
     */
    checkOverload() {
        const now = new Date();
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);
        
        // Filtra le attività non completate con scadenza entro la prossima settimana
        const urgentTasks = this.tasks.filter(task => {
            if (task.completed) return false;
            
            const deadline = new Date(task.deadline);
            return deadline <= nextWeek;
        });
        
        // Conta le attività ad alta priorità
        const highPriorityCount = urgentTasks.filter(task => task.priority >= 4).length;
        
        // Calcola le ore totali richieste
        const totalHours = urgentTasks.reduce((sum, task) => sum + task.duration, 0);
        
        // Calcola le ore disponibili (considerando 8 ore al giorno per 5 giorni lavorativi)
        const workingDays = 5;
        const hoursPerDay = 8;
        const availableHours = workingDays * hoursPerDay;
        
        return {
            isOverloaded: totalHours > availableHours || highPriorityCount > 5,
            urgentTasksCount: urgentTasks.length,
            highPriorityCount: highPriorityCount,
            totalHoursRequired: totalHours,
            availableHours: availableHours,
            overloadPercentage: Math.max(0, Math.round((totalHours / availableHours - 1) * 100))
        };
    }
}
