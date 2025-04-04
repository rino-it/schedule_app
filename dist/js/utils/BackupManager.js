/**
 * Utility per la gestione dei backup
 */
import Storage from './Storage.js';

export default class BackupManager {
    /**
     * Genera un codice di backup che codifica tutte le attività schedulate
     * @returns {Promise<String>} Promise che si risolve con il codice di backup
     */
    static async generateBackupCode() {
        try {
            // Esporta i dati
            const data = await Storage.exportData();
            
            // Converti in JSON
            const jsonData = JSON.stringify(data);
            
            // Comprimi i dati
            const compressedData = await this._compressData(jsonData);
            
            // Codifica in base64
            const base64Data = btoa(compressedData);
            
            // Aggiungi un prefisso per identificare il backup
            const backupCode = `TM-${this._generateVersion()}-${base64Data}`;
            
            return backupCode;
        } catch (error) {
            console.error('Errore durante la generazione del codice di backup:', error);
            throw error;
        }
    }
    
    /**
     * Ripristina lo stato da un codice di backup
     * @param {String} backupCode - Codice di backup
     * @returns {Promise<Object>} Promise che si risolve con il risultato del ripristino
     */
    static async restoreFromBackupCode(backupCode) {
        try {
            // Verifica che il codice di backup sia valido
            if (!backupCode.startsWith('TM-')) {
                throw new Error('Codice di backup non valido');
            }
            
            // Estrai la versione e i dati
            const parts = backupCode.split('-');
            if (parts.length < 3) {
                throw new Error('Formato del codice di backup non valido');
            }
            
            const version = parts[1];
            const base64Data = parts.slice(2).join('-'); // In caso ci siano trattini nei dati
            
            // Decodifica da base64
            const compressedData = atob(base64Data);
            
            // Decomprimi i dati
            const jsonData = await this._decompressData(compressedData);
            
            // Converti da JSON
            const data = JSON.parse(jsonData);
            
            // Verifica la compatibilità della versione
            if (!this._isVersionCompatible(version, data.version)) {
                throw new Error('Versione del backup non compatibile');
            }
            
            // Ripristina i dati
            const result = await Storage.importData(data);
            
            return result;
        } catch (error) {
            console.error('Errore durante il ripristino dal codice di backup:', error);
            throw error;
        }
    }
    
    /**
     * Comprime i dati
     * @param {String} data - Dati da comprimere
     * @returns {Promise<String>} Promise che si risolve con i dati compressi
     * @private
     */
    static async _compressData(data) {
        // In un'implementazione reale, qui si utilizzerebbe una libreria di compressione
        // Per semplicità, in questa implementazione non comprimiamo realmente i dati
        return data;
    }
    
    /**
     * Decomprime i dati
     * @param {String} compressedData - Dati compressi
     * @returns {Promise<String>} Promise che si risolve con i dati decompressi
     * @private
     */
    static async _decompressData(compressedData) {
        // In un'implementazione reale, qui si utilizzerebbe una libreria di decompressione
        // Per semplicità, in questa implementazione non decomprimiamo realmente i dati
        return compressedData;
    }
    
    /**
     * Genera la versione corrente
     * @returns {String} Versione corrente
     * @private
     */
    static _generateVersion() {
        return '1.0.0';
    }
    
    /**
     * Verifica se la versione del backup è compatibile
     * @param {String} backupVersion - Versione del backup
     * @param {Number} dataVersion - Versione dei dati
     * @returns {Boolean} True se la versione è compatibile
     * @private
     */
    static _isVersionCompatible(backupVersion, dataVersion) {
        // In un'implementazione reale, qui si verificherebbe la compatibilità delle versioni
        // Per semplicità, in questa implementazione accettiamo qualsiasi versione
        return true;
    }
    
    /**
     * Pianifica un backup automatico
     * @param {Number} intervalMinutes - Intervallo in minuti tra i backup
     * @returns {Promise<Boolean>} Promise che si risolve con true se il backup è stato pianificato
     */
    static async scheduleAutomaticBackup(intervalMinutes = 60) {
        try {
            // Salva l'impostazione dell'intervallo
            await Storage.saveSetting('backupInterval', intervalMinutes);
            
            // Salva l'orario dell'ultimo backup
            await Storage.saveSetting('lastBackupTime', new Date().toISOString());
            
            // In un'implementazione reale, qui si utilizzerebbe un service worker
            // Per semplicità, in questa implementazione utilizziamo localStorage
            localStorage.setItem('taskmaster_backup_interval', intervalMinutes.toString());
            
            return true;
        } catch (error) {
            console.error('Errore durante la pianificazione del backup automatico:', error);
            return false;
        }
    }
    
    /**
     * Esegue un backup automatico se necessario
     * @returns {Promise<Boolean>} Promise che si risolve con true se il backup è stato eseguito
     */
    static async performAutomaticBackupIfNeeded() {
        try {
            // Ottieni l'intervallo di backup
            const intervalMinutes = parseInt(localStorage.getItem('taskmaster_backup_interval') || '60');
            
            // Ottieni l'orario dell'ultimo backup
            const lastBackupTimeStr = await Storage.getSetting('lastBackupTime');
            
            if (!lastBackupTimeStr) {
                // Se non c'è un ultimo backup, esegui il backup
                return await this.performAutomaticBackup();
            }
            
            const lastBackupTime = new Date(lastBackupTimeStr);
            const now = new Date();
            
            // Calcola la differenza in minuti
            const diffMinutes = (now - lastBackupTime) / (1000 * 60);
            
            // Se è passato abbastanza tempo, esegui il backup
            if (diffMinutes >= intervalMinutes) {
                return await this.performAutomaticBackup();
            }
            
            return false;
        } catch (error) {
            console.error('Errore durante la verifica del backup automatico:', error);
            return false;
        }
    }
    
    /**
     * Esegue un backup automatico
     * @returns {Promise<Boolean>} Promise che si risolve con true se il backup è stato eseguito
     */
    static async performAutomaticBackup() {
        try {
            // Genera il codice di backup
            const backupCode = await this.generateBackupCode();
            
            // Salva il codice di backup
            await Storage.saveSetting('lastBackupCode', backupCode);
            
            // Aggiorna l'orario dell'ultimo backup
            await Storage.saveSetting('lastBackupTime', new Date().toISOString());
            
            // Salva lo storico dei backup
            const backupHistory = await Storage.getSetting('backupHistory') || [];
            backupHistory.push({
                timestamp: new Date().toISOString(),
                code: backupCode
            });
            
            // Mantieni solo gli ultimi 10 backup
            if (backupHistory.length > 10) {
                backupHistory.shift();
            }
            
            await Storage.saveSetting('backupHistory', backupHistory);
            
            return true;
        } catch (error) {
            console.error('Errore durante l\'esecuzione del backup automatico:', error);
            return false;
        }
    }
}
