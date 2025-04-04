/**
 * Utility per la gestione delle date
 */
export default class DateUtils {
    /**
     * Formatta una data nel formato locale italiano
     * @param {Date} date - Data da formattare
     * @param {Object} options - Opzioni di formattazione
     * @returns {String} Data formattata
     */
    static formatDate(date, options = {}) {
        const defaultOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        return date.toLocaleDateString('it-IT', mergedOptions);
    }
    
    /**
     * Formatta un orario nel formato locale italiano
     * @param {Date} date - Data da cui estrarre l'orario
     * @param {Boolean} seconds - Se includere i secondi
     * @returns {String} Orario formattato
     */
    static formatTime(date, seconds = false) {
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        
        if (seconds) {
            options.second = '2-digit';
        }
        
        return date.toLocaleTimeString('it-IT', options);
    }
    
    /**
     * Formatta una data e ora nel formato locale italiano
     * @param {Date} date - Data da formattare
     * @param {Boolean} seconds - Se includere i secondi
     * @returns {String} Data e ora formattata
     */
    static formatDateTime(date, seconds = false) {
        const dateStr = this.formatDate(date, { weekday: undefined });
        const timeStr = this.formatTime(date, seconds);
        return `${dateStr} ${timeStr}`;
    }
    
    /**
     * Ottiene l'inizio della settimana corrente (lunedì)
     * @param {Date} date - Data di riferimento
     * @returns {Date} Data di inizio settimana
     */
    static getStartOfWeek(date = new Date()) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Aggiusta per domenica
        const startOfWeek = new Date(date);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
    }
    
    /**
     * Ottiene la fine della settimana corrente (domenica)
     * @param {Date} date - Data di riferimento
     * @returns {Date} Data di fine settimana
     */
    static getEndOfWeek(date = new Date()) {
        const startOfWeek = this.getStartOfWeek(date);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return endOfWeek;
    }
    
    /**
     * Ottiene l'inizio del giorno
     * @param {Date} date - Data di riferimento
     * @returns {Date} Data di inizio giorno
     */
    static getStartOfDay(date = new Date()) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        return startOfDay;
    }
    
    /**
     * Ottiene la fine del giorno
     * @param {Date} date - Data di riferimento
     * @returns {Date} Data di fine giorno
     */
    static getEndOfDay(date = new Date()) {
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return endOfDay;
    }
    
    /**
     * Ottiene il nome del giorno della settimana
     * @param {Number} dayIndex - Indice del giorno (0-6, dove 0 è domenica)
     * @param {Boolean} short - Se restituire il nome abbreviato
     * @returns {String} Nome del giorno
     */
    static getDayName(dayIndex, short = false) {
        const days = short 
            ? ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
            : ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
        return days[dayIndex];
    }
    
    /**
     * Ottiene il nome del mese
     * @param {Number} monthIndex - Indice del mese (0-11)
     * @param {Boolean} short - Se restituire il nome abbreviato
     * @returns {String} Nome del mese
     */
    static getMonthName(monthIndex, short = false) {
        const months = short
            ? ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
            : ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
        return months[monthIndex];
    }
    
    /**
     * Calcola la durata in formato leggibile
     * @param {Number} hours - Ore di durata
     * @returns {String} Durata formattata
     */
    static formatDuration(hours) {
        if (hours < 1) {
            const minutes = Math.round(hours * 60);
            return `${minutes}m`;
        } else if (Number.isInteger(hours)) {
            return `${hours}h`;
        } else {
            const h = Math.floor(hours);
            const m = Math.round((hours - h) * 60);
            return `${h}h ${m}m`;
        }
    }
    
    /**
     * Calcola l'orario di fine di un'attività
     * @param {Date} startTime - Orario di inizio
     * @param {Number} durationHours - Durata in ore
     * @returns {Date} Orario di fine
     */
    static calculateEndTime(startTime, durationHours) {
        const endTime = new Date(startTime);
        endTime.setTime(endTime.getTime() + durationHours * 60 * 60 * 1000);
        return endTime;
    }
    
    /**
     * Verifica se due intervalli di tempo si sovrappongono
     * @param {Date} start1 - Inizio primo intervallo
     * @param {Date} end1 - Fine primo intervallo
     * @param {Date} start2 - Inizio secondo intervallo
     * @param {Date} end2 - Fine secondo intervallo
     * @returns {Boolean} True se si sovrappongono
     */
    static intervalsOverlap(start1, end1, start2, end2) {
        return start1 < end2 && start2 < end1;
    }
    
    /**
     * Ottiene il range di date per una settimana
     * @param {Date} date - Data di riferimento
     * @returns {Array} Array di date per la settimana
     */
    static getWeekDates(date = new Date()) {
        const startOfWeek = this.getStartOfWeek(date);
        const weekDates = [];
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            weekDates.push(day);
        }
        
        return weekDates;
    }
    
    /**
     * Formatta un range di date per la visualizzazione
     * @param {Date} startDate - Data di inizio
     * @param {Date} endDate - Data di fine
     * @returns {String} Range formattato
     */
    static formatDateRange(startDate, endDate) {
        // Se le date sono nello stesso mese
        if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
            return `${startDate.getDate()} - ${endDate.getDate()} ${this.getMonthName(startDate.getMonth())} ${startDate.getFullYear()}`;
        }
        // Se le date sono in mesi diversi ma stesso anno
        else if (startDate.getFullYear() === endDate.getFullYear()) {
            return `${startDate.getDate()} ${this.getMonthName(startDate.getMonth(), true)} - ${endDate.getDate()} ${this.getMonthName(endDate.getMonth(), true)} ${startDate.getFullYear()}`;
        }
        // Se le date sono in anni diversi
        else {
            return `${startDate.getDate()} ${this.getMonthName(startDate.getMonth(), true)} ${startDate.getFullYear()} - ${endDate.getDate()} ${this.getMonthName(endDate.getMonth(), true)} ${endDate.getFullYear()}`;
        }
    }
}
