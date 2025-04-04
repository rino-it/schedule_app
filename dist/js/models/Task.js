/**
 * Modello per la gestione delle attività
 */
export default class Task {
    /**
     * Crea una nuova attività
     * @param {Object} taskData - Dati dell'attività
     */
    constructor(taskData = {}) {
        this.id = taskData.id || null;
        this.title = taskData.title || '';
        this.description = taskData.description || '';
        this.duration = taskData.duration || 1; // Durata in ore
        this.deadline = taskData.deadline || null;
        this.priority = taskData.priority || 3; // Scala 1-5
        this.dependencies = taskData.dependencies || [];
        this.category = taskData.category || 'professionale';
        this.energy = taskData.energy || 'media'; // Alta/Media/Bassa
        this.timePreference = taskData.timePreference || 'indifferente'; // Mattina/Pomeriggio/Sera/Indifferente
        this.completed = taskData.completed || false;
        this.scheduledStart = taskData.scheduledStart || null; // Data e ora di inizio pianificata
        this.createdAt = taskData.createdAt || new Date().toISOString();
        this.updatedAt = taskData.updatedAt || new Date().toISOString();
        this.completedAt = taskData.completedAt || null;
    }

    /**
     * Verifica se l'attività è valida
     * @returns {Boolean} True se l'attività è valida
     */
    isValid() {
        return (
            this.title.trim() !== '' &&
            this.duration > 0 &&
            this.deadline !== null &&
            this.priority >= 1 && this.priority <= 5 &&
            ['alta', 'media', 'bassa'].includes(this.energy) &&
            ['mattina', 'pomeriggio', 'sera', 'indifferente'].includes(this.timePreference)
        );
    }

    /**
     * Marca l'attività come completata
     */
    complete() {
        this.completed = true;
        this.completedAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Marca l'attività come non completata
     */
    uncomplete() {
        this.completed = false;
        this.completedAt = null;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Aggiorna i dati dell'attività
     * @param {Object} taskData - Nuovi dati dell'attività
     */
    update(taskData) {
        if (taskData.title !== undefined) this.title = taskData.title;
        if (taskData.description !== undefined) this.description = taskData.description;
        if (taskData.duration !== undefined) this.duration = taskData.duration;
        if (taskData.deadline !== undefined) this.deadline = taskData.deadline;
        if (taskData.priority !== undefined) this.priority = taskData.priority;
        if (taskData.dependencies !== undefined) this.dependencies = taskData.dependencies;
        if (taskData.category !== undefined) this.category = taskData.category;
        if (taskData.energy !== undefined) this.energy = taskData.energy;
        if (taskData.timePreference !== undefined) this.timePreference = taskData.timePreference;
        if (taskData.scheduledStart !== undefined) this.scheduledStart = taskData.scheduledStart;
        
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Calcola l'orario di fine dell'attività
     * @returns {Date|null} Orario di fine o null se non pianificata
     */
    getEndTime() {
        if (!this.scheduledStart) return null;
        
        const startTime = new Date(this.scheduledStart);
        const endTime = new Date(startTime);
        endTime.setTime(endTime.getTime() + this.duration * 60 * 60 * 1000);
        
        return endTime;
    }

    /**
     * Verifica se l'attività si sovrappone con un'altra
     * @param {Task} otherTask - Altra attività da confrontare
     * @returns {Boolean} True se si sovrappongono
     */
    overlapsWith(otherTask) {
        if (!this.scheduledStart || !otherTask.scheduledStart) return false;
        
        const thisStart = new Date(this.scheduledStart);
        const thisEnd = this.getEndTime();
        
        const otherStart = new Date(otherTask.scheduledStart);
        const otherEnd = otherTask.getEndTime();
        
        return thisStart < otherEnd && otherStart < thisEnd;
    }

    /**
     * Verifica se l'attività è in ritardo
     * @returns {Boolean} True se l'attività è in ritardo
     */
    isOverdue() {
        if (this.completed) return false;
        
        const now = new Date();
        const deadline = new Date(this.deadline);
        
        return now > deadline;
    }

    /**
     * Verifica se l'attività è imminente (entro 24 ore)
     * @returns {Boolean} True se l'attività è imminente
     */
    isImminent() {
        if (this.completed) return false;
        
        const now = new Date();
        const deadline = new Date(this.deadline);
        const diff = deadline.getTime() - now.getTime();
        
        return diff > 0 && diff <= 24 * 60 * 60 * 1000;
    }

    /**
     * Ottiene l'emoji della priorità
     * @returns {String} Emoji della priorità
     */
    getPriorityEmoji() {
        const priorityEmojis = {
            1: '🔵',
            2: '🟢',
            3: '🟡',
            4: '🟠',
            5: '🔴'
        };
        
        return priorityEmojis[this.priority] || '⚪';
    }

    /**
     * Ottiene il colore CSS della priorità
     * @returns {String} Colore CSS della priorità
     */
    getPriorityColor() {
        const priorityColors = {
            1: 'var(--priority-1)',
            2: 'var(--priority-2)',
            3: 'var(--priority-3)',
            4: 'var(--priority-4)',
            5: 'var(--priority-5)'
        };
        
        return priorityColors[this.priority] || 'var(--medium)';
    }

    /**
     * Converte l'attività in un oggetto semplice
     * @returns {Object} Oggetto rappresentante l'attività
     */
    toObject() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            duration: this.duration,
            deadline: this.deadline,
            priority: this.priority,
            dependencies: this.dependencies,
            category: this.category,
            energy: this.energy,
            timePreference: this.timePreference,
            completed: this.completed,
            scheduledStart: this.scheduledStart,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            completedAt: this.completedAt
        };
    }

    /**
     * Crea un'attività da un oggetto
     * @param {Object} obj - Oggetto da cui creare l'attività
     * @returns {Task} Nuova attività
     */
    static fromObject(obj) {
        return new Task(obj);
    }
}
