/**
 * Controller per la gestione delle viste dell'applicazione
 */
import DateUtils from '../utils/DateUtils.js';

export default class ViewController {
    /**
     * Inizializza il controller
     * @param {TaskController} taskController - Istanza del controller delle attività
     */
    constructor(taskController) {
        this.taskController = taskController;
        this.currentView = 'welcome';
        this.currentDate = new Date();
        this.weekStartDate = DateUtils.getStartOfWeek(this.currentDate);
        
        // Elementi DOM principali
        this.viewContainer = document.getElementById('view-container');
        this.menuPanel = document.getElementById('menu-panel');
        this.modalContainer = document.getElementById('modal-container');
        
        // Template
        this.weeklyViewTemplate = document.getElementById('weekly-view-template');
        this.dailyViewTemplate = document.getElementById('daily-view-template');
        this.taskItemTemplate = document.getElementById('task-item-template');
        this.allTasksViewTemplate = document.getElementById('all-tasks-view-template');
        
        // Gestione paginazione per vista tutte le attività
        this.currentPage = 1;
        this.tasksPerPage = 10;
        this.currentSortField = 'deadline';
        this.currentSortDirection = 'asc';
        
        // Inizializza gli event listener
        this._initEventListeners();
    }

    /**
     * Inizializza gli event listener
     * @private
     */
    _initEventListeners() {
        // Bottoni principali
        document.getElementById('btn-new-task').addEventListener('click', () => this.showNewTaskModal());
        document.getElementById('btn-menu').addEventListener('click', () => this.toggleMenu());
        
        // Bottoni del menu
        document.getElementById('btn-show-week').addEventListener('click', () => this.showWeeklyView());
        document.getElementById('btn-show-today').addEventListener('click', () => this.showDailyView(new Date()));
        document.getElementById('btn-show-all-tasks').addEventListener('click', () => this.showAllTasksView());
        document.getElementById('btn-recalculate').addEventListener('click', () => this.recalculateSchedule());
        document.getElementById('btn-time-analysis').addEventListener('click', () => this.showTimeAnalysis());
        document.getElementById('btn-export').addEventListener('click', () => this.exportCalendar());
        document.getElementById('btn-import').addEventListener('click', () => this.showImportModal());
        document.getElementById('btn-travel-mode').addEventListener('click', () => this.showTravelModeModal());
        document.getElementById('btn-temp-priority').addEventListener('click', () => this.showTempPriorityModal());
        
        // Bottoni della schermata di benvenuto
        document.getElementById('btn-quick-today').addEventListener('click', () => this.showDailyView(new Date()));
        document.getElementById('btn-quick-new').addEventListener('click', () => this.showNewTaskModal());
        
        // Chiusura modali
        const closeButtons = document.querySelectorAll('.close-modal, .cancel-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.closeModal());
        });
        
        // Form nuova attività
        document.getElementById('new-task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewTaskSubmit();
        });
        
        // Listener per eventi del TaskController
        this.taskController.on('tasksLoaded', () => this.refreshCurrentView());
        this.taskController.on('taskCreated', () => this.refreshCurrentView());
        this.taskController.on('taskUpdated', () => this.refreshCurrentView());
        this.taskController.on('taskDeleted', () => this.refreshCurrentView());
        this.taskController.on('taskCompleted', () => this.refreshCurrentView());
        this.taskController.on('taskMoved', () => this.refreshCurrentView());
        this.taskController.on('scheduleRecalculated', () => this.refreshCurrentView());
        this.taskController.on('dataImported', () => this.refreshCurrentView());
    }

    /**
     * Mostra la vista settimanale
     */
    showWeeklyView() {
        // Clona il template
        const weeklyView = this.weeklyViewTemplate.content.cloneNode(true);
        
        // Aggiorna il range della settimana
        const weekRange = weeklyView.querySelector('#week-range');
        const startDate = this.weekStartDate;
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        weekRange.textContent = DateUtils.formatDateRange(startDate, endDate);
        
        // Aggiungi navigazione settimana
        weeklyView.querySelector('#prev-week').addEventListener('click', () => {
            this.weekStartDate.setDate(this.weekStartDate.getDate() - 7);
            this.showWeeklyView();
        });
        
        weeklyView.querySelector('#next-week').addEventListener('click', () => {
            this.weekStartDate.setDate(this.weekStartDate.getDate() + 7);
            this.showWeeklyView();
        });
        
        // Genera la colonna degli orari
        const timeColumn = weeklyView.querySelector('.time-column');
        for (let hour = 8; hour < 20; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = `${hour}:00`;
            timeColumn.appendChild(timeSlot);
        }
        
        // Genera le colonne dei giorni
        const daysContainer = weeklyView.querySelector('.days-container');
        const weekDates = DateUtils.getWeekDates(this.weekStartDate);
        
        for (let i = 0; i < 7; i++) {
            const dayDate = weekDates[i];
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            
            // Intestazione del giorno
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            
            const dayName = document.createElement('div');
            dayName.className = 'day-name';
            dayName.textContent = DateUtils.getDayName(dayDate.getDay());
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = dayDate.getDate();
            
            dayHeader.appendChild(dayName);
            dayHeader.appendChild(dayNumber);
            dayColumn.appendChild(dayHeader);
            
            // Contenuto del giorno
            const dayContent = document.createElement('div');
            dayContent.className = 'day-content';
            
            // Aggiungi slot orari
            for (let hour = 8; hour < 20; hour++) {
                const hourSlot = document.createElement('div');
                hourSlot.className = 'hour-slot';
                hourSlot.dataset.hour = hour;
                
                // Verifica se è un orario protetto
                const isProtected = this._isProtectedTime(dayDate, hour);
                if (isProtected) {
                    hourSlot.classList.add('protected');
                    hourSlot.title = isProtected.name;
                }
                
                dayContent.appendChild(hourSlot);
            }
            
            dayColumn.appendChild(dayContent);
            daysContainer.appendChild(dayColumn);
            
            // Aggiungi evento click per mostrare la vista giornaliera
            dayColumn.addEventListener('click', () => {
                this.showDailyView(dayDate);
            });
        }
        
        // Aggiungi le attività schedulate
        this._populateWeeklyTasks(weeklyView, weekDates);
        
        // Sostituisci la vista corrente
        this._switchView(weeklyView, 'weekly');
        
        // Chiudi il menu
        this.closeMenu();
    }

    /**
     * Popola la vista settimanale con le attività
     * @param {DocumentFragment} weeklyView - Vista settimanale
     * @param {Array} weekDates - Date della settimana
     * @private
     */
    _populateWeeklyTasks(weeklyView, weekDates) {
        // Ottieni le attività per la settimana
        const weekTasks = this.taskController.getTasksForWeek(this.weekStartDate);
        
        // Per ogni giorno
        for (let i = 0; i < 7; i++) {
            const dayDate = weekDates[i];
            const dateKey = DateUtils.formatDateRange(dayDate, dayDate).split(' ')[0];
            const dayTasks = weekTasks[dateKey] || [];
            
            // Colonna del giorno
            const dayColumn = weeklyView.querySelectorAll('.day-column')[i];
            const dayContent = dayColumn.querySelector('.day-content');
            
            // Per ogni attività del giorno
            for (const task of dayTasks) {
                if (!task.scheduledStart) continue;
                
                const taskStart = new Date(task.scheduledStart);
                const startHour = taskStart.getHours() + (taskStart.getMinutes() / 60);
                
                // Calcola posizione e altezza
                const top = (startHour - 8) * 60; // 60px per ora
                const height = task.duration * 60; // 60px per ora
                
                // Crea l'elemento attività
                const taskElement = document.createElement('div');
                taskElement.className = 'week-task';
                taskElement.style.top = `${top}px`;
                taskElement.style.height = `${height}px`;
                taskElement.style.backgroundColor = task.getPriorityColor();
                taskElement.dataset.taskId = task.id;
                
                // Contenuto dell'attività
                const taskContent = document.createElement('div');
                taskContent.className = 'week-task-content';
                
                const taskTitle = document.createElement('div');
                taskTitle.className = 'week-task-title';
                taskTitle.textContent = task.title;
                
                const taskTime = document.createElement('div');
                taskTime.className = 'week-task-time';
                taskTime.textContent = `${DateUtils.formatTime(taskStart)} - ${DateUtils.formatTime(task.getEndTime())}`;
                
                taskContent.appendChild(taskTitle);
                taskContent.appendChild(taskTime);
                taskElement.appendChild(taskContent);
                
                // Aggiungi l'attività al giorno
                dayContent.appendChild(taskElement);
                
                // Aggiungi evento click per modificare l'attività
                taskElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showEditTaskModal(task.id);
                });
            }
        }
    }

    /**
     * Mostra la vista giornaliera
     * @param {Date} date - Data da visualizzare
     */
    showDailyView(date) {
        this.currentDate = date;
        
        // Clona il template
        const dailyView = this.dailyViewTemplate.content.cloneNode(true);
        
        // Aggiorna la data corrente
        const currentDay = dailyView.querySelector('#current-day');
        currentDay.textContent = DateUtils.formatDate(date);
        
        // Aggiungi navigazione giorno
        dailyView.querySelector('#prev-day').addEventListener('click', () => {
            const prevDate = new Date(this.currentDate);
            prevDate.setDate(prevDate.getDate() - 1);
            this.showDailyView(prevDate);
        });
        
        dailyView.querySelector('#next-day').addEventListener('click', () => {
            const nextDate = new Date(this.currentDate);
            nextDate.setDate(nextDate.getDate() + 1);
            this.showDailyView(nextDate);
        });
        
        // Ottieni le attività per il giorno
        const dayTasks = this.taskController.getTasksForDate(date);
        
        // Contenitore delle attività
        const daySchedule = dailyView.querySelector('.day-schedule');
        
        // Se non ci sono attività
        if (dayTasks.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'Nessuna attività programmata per questo giorno';
            daySchedule.appendChild(emptyMessage);
        } else {
            // Aggiungi le attività
            for (const task of dayTasks) {
                const taskElement = this._createTaskElement(task);
                daySchedule.appendChild(taskElement);
            }
        }
        
        // Sostituisci la vista corrente
        this._switchView(dailyView, 'daily');
        
        // Chiudi il menu
        this.closeMenu();
    }

    /**
     * Crea un elemento HTML per un'attività
     * @param {Task} task - Attività
     * @returns {HTMLElement} Elemento HTML
     * @private
     */
    _createTaskElement(task) {
        // Clona il template
        const taskElement = this.taskItemTemplate.content.cloneNode(true);
        
        // Imposta l'ID
        taskElement.querySelector('.task-item').dataset.id = task.id;
        
        // Imposta il titolo
        taskElement.querySelector('.task-title').textContent = task.title;
        
        // Imposta l'orario
        if (task.scheduledStart) {
            const startTime = new Date(task.scheduledStart);
            const endTime = task.getEndTime();
            taskElement.querySelector('.task-time').textContent = `${DateUtils.formatTime(startTime)} - ${DateUtils.formatTime(endTime)}`;
        } else {
            taskElement.querySelector('.task-time').textContent = 'Non schedulata';
        }
        
        // Imposta la priorità
        taskElement.querySelector('.task-priority').textContent = task.getPriorityEmoji();
        
        // Imposta la categoria e la durata
        taskElement.querySelector('.task-category').textContent = task.category;
        taskElement.querySelector('.task-duration').textContent = DateUtils.formatDuration(task.duration);
        
        // Se l'attività è completata
        if (task.completed) {
            taskElement.querySelector('.task-item').classList.add('completed');
            taskElement.querySelector('.task-complete').innerHTML = '<span class="material-icons">check_circle</span>';
            taskElement.querySelector('.task-complete').title = 'Completata';
        }
        
        // Aggiungi eventi ai pulsanti
        taskElement.querySelector('.task-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showEditTaskModal(task.id);
        });
        
        taskElement.querySelector('.task-complete').addEventListener('click', (e) => {
            e.stopPropagation();
            if (!task.completed) {
                this.taskController.completeTask(task.id);
            } else {
                // Annulla completamento
                this.taskController.updateTask(task.id, { completed: false, completedAt: null });
            }
        });
        
        taskElement.querySelector('.task-move').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showMoveTaskModal(task.id);
        });
        
        return taskElement;
    }

    /**
     * Mostra il modale per una nuova attività
     */
    showNewTaskModal() {
        // Mostra il modale
        this.modalContainer.classList.add('active');
        document.getElementById('new-task-modal').classList.add('active');
        
        // Resetta il form
        document.getElementById('new-task-form').reset();
        
        // Imposta la data di scadenza predefinita (domani)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0);
        
        const deadlineInput = document.getElementById('task-deadline');
        deadlineInput.value = tomorrow.toISOString().slice(0, 16);
        
        // Popola le dipendenze
        this._populateDependenciesSelect();
        
        // Chiudi il menu
        this.closeMenu();
    }

    /**
     * Gestisce l'invio del form per una nuova attività
     */
    async handleNewTaskSubmit() {
        try {
            // Raccogli i dati dal form
            const title = document.getElementById('task-title').value;
            const description = document.getElementById('task-description').value;
            const duration = parseFloat(document.getElementById('task-duration').value);
            const deadline = document.getElementById('task-deadline').value;
            const priority = parseInt(document.getElementById('task-priority').value);
            const category = document.getElementById('task-category').value;
            const energy = document.getElementById('task-energy').value;
            const timePreference = document.getElementById('task-time-preference').value;
            
            // Raccogli le dipendenze
            const dependenciesSelect = document.getElementById('task-dependencies');
            const dependencies = Array.from(dependenciesSelect.selectedOptions).map(option => option.value);
            
            // Crea l'attività
            await this.taskController.createTask({
                title,
                description,
                duration,
                deadline: new Date(deadline).toISOString(),
                priority,
                category,
                energy,
                timePreference,
                dependencies
            });
            
            // Chiudi il modale
            this.closeModal();
            
            // Mostra un messaggio di successo
            this._showToast('Attività creata con successo');
            
            // Verifica se ci sono conflitti
            this._checkForConflicts();
        } catch (error) {
            console.error('Errore durante la creazione dell\'attività:', error);
            this._showToast('Errore durante la creazione dell\'attività', 'error');
        }
    }

    /**
     * Mostra il modale per modificare un'attività
     * @param {String} taskId - ID dell'attività da modificare
     */
    showEditTaskModal(taskId) {
        // TODO: Implementare
    }

    /**
     * Mostra il modale per spostare un'attività
     * @param {String} taskId - ID dell'attività da spostare
     */
    showMoveTaskModal(taskId) {
        // TODO: Implementare
    }

    /**
     * Mostra l'analisi del tempo
     */
    showTimeAnalysis() {
        // TODO: Implementare
    }

    /**
     * Esporta il calendario in formato iCalendar
     */
    async exportCalendar() {
        try {
            // Ottieni i dati in formato iCalendar
            const icalData = await this.taskController.exportToICalendar();
            
            // Crea un blob
            const blob = new Blob([icalData], { type: 'text/calendar' });
            
            // Crea un URL per il download
            const url = URL.createObjectURL(blob);
            
            // Crea un link per il download
            const a = document.createElement('a');
            a.href = url;
            a.download = 'taskmaster-calendar.ics';
            
            // Simula il click sul link
            document.body.appendChild(a);
            a.click();
            
            // Rimuovi il link
            document.body.removeChild(a);
            
            // Chiudi il menu
            this.closeMenu();
            
            // Mostra un messaggio di successo
            this._showToast('Calendario esportato con successo');
        } catch (error) {
            console.error('Errore durante l\'esportazione del calendario:', error);
            this._showToast('Errore durante l\'esportazione del calendario', 'error');
        }
    }

    /**
     * Mostra il modale per importare dati
     */
    showImportModal() {
        // TODO: Implementare
    }

    /**
     * Mostra il modale per la modalità viaggio
     */
    showTravelModeModal() {
        // TODO: Implementare
    }

    /**
     * Mostra il modale per la priorità temporanea
     */
    showTempPriorityModal() {
        // TODO: Implementare
    }

    /**
     * Ricalcola la schedulazione
     */
    async recalculateSchedule() {
        try {
            // Mostra un messaggio di caricamento
            this._showToast('Ricalcolo della schedulazione in corso...');
            
            // Ricalcola la schedulazione
            await this.taskController.recalculateSchedule();
            
            // Chiudi il menu
            this.closeMenu();
            
            // Mostra un messaggio di successo
            this._showToast('Schedulazione ricalcolata con successo');
            
            // Verifica se ci sono conflitti
            this._checkForConflicts();
        } catch (error) {
            console.error('Errore durante la ricalcolazione della schedulazione:', error);
            this._showToast('Errore durante la ricalcolazione della schedulazione', 'error');
        }
    }

    /**
     * Verifica se ci sono conflitti nella schedulazione
     * @private
     */
    _checkForConflicts() {
        // Identifica i conflitti
        const conflicts = this.taskController.identifyConflicts();
        
        // Se ci sono conflitti
        if (conflicts.length > 0) {
            // TODO: Mostrare i conflitti e proporre alternative
            console.log('Conflitti trovati:', conflicts);
        }
        
        // Verifica se c'è un sovraccarico
        const overload = this.taskController.checkOverload();
        
        // Se c'è un sovraccarico
        if (overload.isOverloaded) {
            // TODO: Mostrare il sovraccarico e proporre soluzioni
            console.log('Sovraccarico rilevato:', overload);
        }
    }

    /**
     * Popola il select delle dipendenze
     * @private
     */
    _populateDependenciesSelect() {
        const dependenciesSelect = document.getElementById('task-dependencies');
        
        // Svuota il select
        dependenciesSelect.innerHTML = '';
        
        // Ottieni le attività non completate
        const uncompletedTasks = this.taskController.tasks.filter(task => !task.completed);
        
        // Aggiungi le opzioni
        for (const task of uncompletedTasks) {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.title;
            dependenciesSelect.appendChild(option);
        }
    }

    /**
     * Verifica se un orario è protetto dai vincoli di sistema
     * @param {Date} date - Data da verificare
     * @param {Number} hour - Ora da verificare
     * @returns {Object|false} Vincolo che protegge l'orario o false
     * @private
     */
    _isProtectedTime(date, hour) {
        // TODO: Implementare
        return false;
    }

    /**
     * Mostra un messaggio toast
     * @param {String} message - Messaggio da mostrare
     * @param {String} type - Tipo di messaggio (success, error, warning, info)
     * @private
     */
    _showToast(message, type = 'success') {
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
     * Cambia la vista corrente
     * @param {DocumentFragment|HTMLElement} newView - Nuova vista
     * @param {String} viewName - Nome della vista
     * @private
     */
    _switchView(newView, viewName) {
        // Rimuovi la vista corrente
        const currentViewElement = this.viewContainer.querySelector('.view.active');
        if (currentViewElement) {
            currentViewElement.classList.remove('active');
            this.viewContainer.removeChild(currentViewElement);
        }
        
        // Aggiungi la nuova vista
        const newViewElement = newView.querySelector('.view') || newView;
        newViewElement.classList.add('active');
        this.viewContainer.appendChild(newViewElement);
        
        // Aggiorna la vista corrente
        this.currentView = viewName;
    }

    /**
     * Aggiorna la vista corrente
     */
    refreshCurrentView() {
        switch (this.currentView) {
            case 'weekly':
                this.showWeeklyView();
                break;
            case 'daily':
                this.showDailyView(this.currentDate);
                break;
            case 'all-tasks':
                this.showAllTasksView();
                break;
            case 'welcome':
                // Nessuna azione necessaria
                break;
            default:
                // Nessuna azione necessaria
                break;
        }
    }

    /**
     * Apre/chiude il menu
     */
    toggleMenu() {
        this.menuPanel.classList.toggle('active');
    }

    /**
     * Chiude il menu
     */
    closeMenu() {
        this.menuPanel.classList.remove('active');
    }

    /**
     * Chiude il modale corrente
     */
    closeModal() {
        // Rimuovi la classe active dal container
        this.modalContainer.classList.remove('active');
        
        // Rimuovi la classe active da tutti i modali
        const activeModals = this.modalContainer.querySelectorAll('.modal.active');
        activeModals.forEach(modal => {
            modal.classList.remove('active');
        });
    }

    /**
     * Mostra la vista di tutte le attività
     */
    showAllTasksView() {
        // Clona il template
        const allTasksView = this.allTasksViewTemplate.content.cloneNode(true);
        
        // Riferimenti agli elementi della vista
        const filterStatus = allTasksView.querySelector('#filter-status');
        const filterCategory = allTasksView.querySelector('#filter-category');
        const applyFiltersBtn = allTasksView.querySelector('#apply-filters');
        const searchInput = allTasksView.querySelector('#tasks-search-input');
        const searchBtn = allTasksView.querySelector('#tasks-search-btn');
        const tasksList = allTasksView.querySelector('#tasks-list');
        const prevPageBtn = allTasksView.querySelector('#prev-page');
        const nextPageBtn = allTasksView.querySelector('#next-page');
        const pageInfo = allTasksView.querySelector('#page-info');
        const sortableHeaders = allTasksView.querySelectorAll('th.sortable');
        
        // Funzione per filtrare e visualizzare le attività
        const filterAndDisplayTasks = () => {
            // Ottieni tutti i task
            const allTasks = [...this.taskController.tasks];
            
            // Applica i filtri
            let filteredTasks = allTasks;
            
            // Filtro per stato
            if (filterStatus.value !== 'all') {
                const isCompleted = filterStatus.value === 'completed';
                filteredTasks = filteredTasks.filter(task => task.completed === isCompleted);
            }
            
            // Filtro per categoria
            if (filterCategory.value !== 'all') {
                filteredTasks = filteredTasks.filter(task => task.category === filterCategory.value);
            }
            
            // Filtro di ricerca (nel titolo o nella descrizione)
            if (searchInput.value.trim() !== '') {
                const searchQuery = searchInput.value.trim().toLowerCase();
                filteredTasks = filteredTasks.filter(task => 
                    task.title.toLowerCase().includes(searchQuery) || 
                    task.description.toLowerCase().includes(searchQuery)
                );
            }
            
            // Ordinamento
            filteredTasks.sort((a, b) => {
                let aValue, bValue;
                
                switch(this.currentSortField) {
                    case 'title':
                        aValue = a.title;
                        bValue = b.title;
                        break;
                    case 'priority':
                        aValue = a.priority;
                        bValue = b.priority;
                        break;
                    case 'category':
                        aValue = a.category;
                        bValue = b.category;
                        break;
                    case 'deadline':
                        aValue = new Date(a.deadline);
                        bValue = new Date(b.deadline);
                        break;
                    case 'duration':
                        aValue = a.duration;
                        bValue = b.duration;
                        break;
                    case 'status':
                        aValue = a.completed;
                        bValue = b.completed;
                        break;
                    default:
                        aValue = new Date(a.deadline);
                        bValue = new Date(b.deadline);
                }
                
                // Per ordinamento ascendente o discendente
                if (this.currentSortDirection === 'asc') {
                    if (aValue < bValue) return -1;
                    if (aValue > bValue) return 1;
                    return 0;
                } else {
                    if (aValue > bValue) return -1;
                    if (aValue < bValue) return 1;
                    return 0;
                }
            });
            
            // Calcola il totale delle pagine
            const totalPages = Math.ceil(filteredTasks.length / this.tasksPerPage);
            
            // Assicura che la pagina corrente sia valida
            if (this.currentPage > totalPages) {
                this.currentPage = totalPages > 0 ? totalPages : 1;
            }
            
            // Calcola l'indice di inizio e fine per la paginazione
            const startIdx = (this.currentPage - 1) * this.tasksPerPage;
            const endIdx = Math.min(startIdx + this.tasksPerPage, filteredTasks.length);
            
            // Ottieni solo i task per la pagina corrente
            const pagedTasks = filteredTasks.slice(startIdx, endIdx);
            
            // Aggiorna le informazioni sulla paginazione
            pageInfo.textContent = `Pagina ${this.currentPage} di ${totalPages > 0 ? totalPages : 1}`;
            prevPageBtn.disabled = this.currentPage <= 1;
            nextPageBtn.disabled = this.currentPage >= totalPages || totalPages === 0;
            
            // Pulisci la lista precedente
            tasksList.innerHTML = '';
            
            // Se non ci sono attività
            if (pagedTasks.length === 0) {
                const emptyRow = document.createElement('tr');
                const emptyCell = document.createElement('td');
                emptyCell.colSpan = 7;
                emptyCell.textContent = 'Nessuna attività trovata';
                emptyCell.style.textAlign = 'center';
                emptyCell.style.padding = '2rem';
                emptyRow.appendChild(emptyCell);
                tasksList.appendChild(emptyRow);
                return;
            }
            
            // Popola la tabella con le attività
            pagedTasks.forEach(task => {
                const row = document.createElement('tr');
                
                // Titolo
                const titleCell = document.createElement('td');
                titleCell.textContent = task.title;
                if (task.description) {
                    titleCell.title = task.description;
                }
                row.appendChild(titleCell);
                
                // Priorità
                const priorityCell = document.createElement('td');
                priorityCell.textContent = task.getPriorityEmoji();
                priorityCell.title = `Priorità: ${task.priority}`;
                row.appendChild(priorityCell);
                
                // Categoria
                const categoryCell = document.createElement('td');
                categoryCell.textContent = task.category.charAt(0).toUpperCase() + task.category.slice(1);
                row.appendChild(categoryCell);
                
                // Scadenza
                const deadlineCell = document.createElement('td');
                const deadlineDate = new Date(task.deadline);
                deadlineCell.textContent = DateUtils.formatDateTime(deadlineDate);
                if (task.isOverdue()) {
                    deadlineCell.style.color = 'var(--priority-5)';
                    deadlineCell.style.fontWeight = 'bold';
                }
                row.appendChild(deadlineCell);
                
                // Durata
                const durationCell = document.createElement('td');
                durationCell.textContent = `${task.duration}h`;
                row.appendChild(durationCell);
                
                // Stato
                const statusCell = document.createElement('td');
                if (task.completed) {
                    statusCell.textContent = '✓ Completata';
                    statusCell.style.color = 'var(--priority-2)';
                } else if (task.scheduledStart) {
                    statusCell.textContent = '📅 Pianificata';
                    statusCell.title = `Pianificata per: ${DateUtils.formatDateTime(new Date(task.scheduledStart))}`;
                } else {
                    statusCell.textContent = '⏳ Da pianificare';
                }
                row.appendChild(statusCell);
                
                // Azioni
                const actionsCell = document.createElement('td');
                actionsCell.className = 'task-actions';
                
                // Pulsante Modifica
                const editButton = document.createElement('button');
                editButton.innerHTML = '<span class="material-icons">edit</span>';
                editButton.title = 'Modifica';
                editButton.addEventListener('click', () => this.showEditTaskModal(task.id));
                actionsCell.appendChild(editButton);
                
                // Pulsante Completa/Riapri
                const completeButton = document.createElement('button');
                if (task.completed) {
                    completeButton.innerHTML = '<span class="material-icons">refresh</span>';
                    completeButton.title = 'Riapri';
                    completeButton.addEventListener('click', () => this._uncompleteTask(task.id));
                } else {
                    completeButton.innerHTML = '<span class="material-icons">check_circle</span>';
                    completeButton.title = 'Completa';
                    completeButton.addEventListener('click', () => this._completeTask(task.id));
                }
                actionsCell.appendChild(completeButton);
                
                // Pulsante Elimina
                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = '<span class="material-icons">delete</span>';
                deleteButton.title = 'Elimina';
                deleteButton.addEventListener('click', () => this._confirmDeleteTask(task.id));
                actionsCell.appendChild(deleteButton);
                
                row.appendChild(actionsCell);
                
                // Aggiungi la riga alla tabella
                tasksList.appendChild(row);
            });
        };
        
        // Gestione degli eventi di filtro
        applyFiltersBtn.addEventListener('click', () => {
            this.currentPage = 1; // Resetta la paginazione
            filterAndDisplayTasks();
        });
        
        // Gestione della ricerca
        searchBtn.addEventListener('click', () => {
            this.currentPage = 1; // Resetta la paginazione
            filterAndDisplayTasks();
        });
        
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.currentPage = 1; // Resetta la paginazione
                filterAndDisplayTasks();
            }
        });
        
        // Gestione della paginazione
        prevPageBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                filterAndDisplayTasks();
            }
        });
        
        nextPageBtn.addEventListener('click', () => {
            this.currentPage++;
            filterAndDisplayTasks();
        });
        
        // Gestione dell'ordinamento
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const sortField = header.dataset.sort;
                
                // Cambia la direzione se è lo stesso campo
                if (sortField === this.currentSortField) {
                    this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.currentSortField = sortField;
                    this.currentSortDirection = 'asc';
                }
                
                // Aggiorna le classi di ordinamento
                sortableHeaders.forEach(h => {
                    h.classList.remove('sorted-asc', 'sorted-desc');
                });
                
                header.classList.add(`sorted-${this.currentSortDirection}`);
                
                // Ricarica i dati
                filterAndDisplayTasks();
            });
        });
        
        // Esegui il filtro iniziale
        filterAndDisplayTasks();
        
        // Imposta l'ordinamento iniziale
        const deadlineHeader = allTasksView.querySelector('th[data-sort="deadline"]');
        deadlineHeader.classList.add(`sorted-${this.currentSortDirection}`);
        
        // Sostituisci la vista corrente
        this._switchView(allTasksView, 'all-tasks');
        
        // Chiudi il menu
        this.closeMenu();
    }
    
    /**
     * Completa un'attività
     * @param {String} taskId - ID dell'attività da completare
     * @private
     */
    async _completeTask(taskId) {
        try {
            await this.taskController.completeTask(taskId);
            this._showToast('Attività completata con successo', 'success');
        } catch (error) {
            console.error('Errore nel completamento dell\'attività:', error);
            this._showToast('Errore nel completamento dell\'attività', 'error');
        }
    }
    
    /**
     * Riapre un'attività completata
     * @param {String} taskId - ID dell'attività da riaprire
     * @private
     */
    async _uncompleteTask(taskId) {
        try {
            await this.taskController.updateTask(taskId, { completed: false, completedAt: null });
            this._showToast('Attività riaperta con successo', 'success');
        } catch (error) {
            console.error('Errore nella riapertura dell\'attività:', error);
            this._showToast('Errore nella riapertura dell\'attività', 'error');
        }
    }
    
    /**
     * Chiede conferma e poi elimina un'attività
     * @param {String} taskId - ID dell'attività da eliminare
     * @private
     */
    _confirmDeleteTask(taskId) {
        // Trova l'attività
        const task = this.taskController.tasks.find(t => t.id === taskId);
        
        if (!task) return;
        
        // Crea un modale di conferma
        const confirmModal = document.createElement('div');
        confirmModal.className = 'modal';
        
        confirmModal.innerHTML = `
            <div class="modal-header">
                <h2>Conferma eliminazione</h2>
                <button class="close-modal" aria-label="Chiudi">&times;</button>
            </div>
            <div class="modal-content">
                <p>Sei sicuro di voler eliminare l'attività "<strong>${task.title}</strong>"?</p>
                <p>Questa operazione non può essere annullata.</p>
                <div class="form-actions">
                    <button type="button" class="secondary-btn cancel-modal">Annulla</button>
                    <button type="button" class="primary-btn confirm-delete">Elimina</button>
                </div>
            </div>
        `;
        
        // Aggiungi il modale al container
        this.modalContainer.innerHTML = '';
        this.modalContainer.appendChild(confirmModal);
        this.modalContainer.classList.add('active');
        
        // Gestisci gli eventi
        confirmModal.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
        confirmModal.querySelector('.cancel-modal').addEventListener('click', () => this.closeModal());
        confirmModal.querySelector('.confirm-delete').addEventListener('click', async () => {
            try {
                await this.taskController.deleteTask(taskId);
                this.closeModal();
                this._showToast('Attività eliminata con successo', 'success');
            } catch (error) {
                console.error('Errore nell\'eliminazione dell\'attività:', error);
                this._showToast('Errore nell\'eliminazione dell\'attività', 'error');
            }
        });
    }
}
