# Manuale Utente - TaskMaster

## Introduzione

TaskMaster è un'applicazione web progressiva (PWA) per la schedulazione intelligente delle attività, progettata per aiutarti a organizzare le tue attività professionali e personali in modo ottimale. L'applicazione assegna priorità alle tue attività e le colloca strategicamente durante la settimana in base a una serie di parametri e vincoli.

Questo manuale ti guiderà attraverso tutte le funzionalità dell'applicazione e ti mostrerà come utilizzarla al meglio per ottimizzare la tua produttività.

## Installazione

TaskMaster è una Progressive Web App (PWA), il che significa che può essere utilizzata direttamente dal browser o installata sul tuo dispositivo per un accesso più rapido e funzionalità offline.

### Utilizzo dal browser

1. Apri il tuo browser preferito (Chrome, Safari, Firefox, Edge)
2. Visita l'URL dell'applicazione
3. Inizia a utilizzare TaskMaster immediatamente

### Installazione sul dispositivo

#### Su dispositivi iOS (iPhone/iPad):
1. Apri Safari e visita l'URL dell'applicazione
2. Tocca l'icona di condivisione (rettangolo con freccia verso l'alto)
3. Scorri verso il basso e tocca "Aggiungi a Home"
4. Conferma toccando "Aggiungi"

#### Su dispositivi Android:
1. Apri Chrome e visita l'URL dell'applicazione
2. Tocca i tre puntini in alto a destra
3. Seleziona "Installa app" o "Aggiungi a schermata Home"
4. Conferma l'installazione

#### Su desktop (Windows, macOS, Linux):
1. Apri Chrome, Edge o un altro browser compatibile
2. Visita l'URL dell'applicazione
3. Clicca sull'icona di installazione nella barra degli indirizzi (simile a un piccolo "+"
4. Conferma l'installazione

## Interfaccia principale

L'interfaccia di TaskMaster è stata progettata per essere intuitiva e facile da usare. Ecco una panoramica delle principali aree dell'interfaccia:

### Barra superiore
- **Logo TaskMaster**: Torna alla schermata principale
- **Pulsante modalità offline**: Attiva/disattiva la modalità offline forzata
- **Pulsante nuova attività**: Crea una nuova attività
- **Pulsante menu**: Apre il menu principale

### Menu principale
- **Mostra settimana**: Visualizza la pianificazione settimanale
- **Mostra oggi**: Visualizza le attività del giorno corrente
- **Ricalcola**: Ottimizza la pianificazione delle attività
- **Analisi tempo**: Mostra statistiche sull'utilizzo del tempo
- **Esporta calendario**: Esporta le attività in formato iCalendar
- **Importa dati**: Importa attività da altre fonti
- **Modalità viaggio**: Adatta la schedulazione per giorni di viaggio
- **Priorità temporanea**: Modifica temporaneamente le priorità

### Vista settimanale
La vista settimanale mostra una panoramica delle tue attività pianificate per l'intera settimana, con giorni sulle colonne e fasce orarie sulle righe.

### Vista giornaliera
La vista giornaliera mostra un elenco dettagliato delle attività pianificate per un giorno specifico, con orari precisi e priorità.

## Gestione delle attività

### Creazione di una nuova attività

Per creare una nuova attività:

1. Clicca sul pulsante "Nuova attività" nella barra superiore
2. Compila il form con i seguenti dettagli:
   - **Titolo dell'attività**: Una descrizione concisa
   - **Descrizione dettagliata**: Cosa comporta esattamente l'attività
   - **Durata stimata**: In ore o frazioni di ora
   - **Scadenza**: Data e ora entro cui l'attività deve essere completata
   - **Livello di priorità**: Scala 1-5 (dove 5 è massima priorità)
   - **Dipendenze**: Attività che devono essere completate prima di questa
   - **Categoria**: Professionale, personale, formazione, amministrativa, ecc.
   - **Energia richiesta**: Alta/Media/Bassa
   - **Preferenze di fascia oraria**: Mattina/Pomeriggio/Sera/Indifferente
3. Clicca su "Salva attività"

L'attività verrà automaticamente schedulata in base ai parametri forniti e ai vincoli di sistema.

### Modifica di un'attività esistente

Per modificare un'attività:

1. Trova l'attività nella vista settimanale o giornaliera
2. Clicca sull'attività per aprire i dettagli
3. Clicca sul pulsante "Modifica" (icona a forma di matita)
4. Aggiorna i dettagli dell'attività
5. Clicca su "Salva modifiche"

### Completamento di un'attività

Per marcare un'attività come completata:

1. Trova l'attività nella vista settimanale o giornaliera
2. Clicca sul pulsante "Completa" (icona a forma di spunta)

L'attività verrà marcata come completata e rimossa dalla pianificazione attiva.

### Spostamento di un'attività

Per spostare manualmente un'attività:

1. Trova l'attività nella vista settimanale o giornaliera
2. Clicca sul pulsante "Sposta" (icona a forma di orologio)
3. Seleziona la nuova data e ora
4. Clicca su "Conferma"

## Visualizzazione e pianificazione

### Vista settimanale

La vista settimanale ti offre una panoramica completa della tua settimana:

1. Clicca su "Mostra settimana" nel menu
2. Naviga tra le settimane usando i pulsanti freccia
3. Clicca su un giorno specifico per passare alla vista giornaliera
4. Le attività sono colorate in base alla priorità:
   - Priorità 5: 🔴
   - Priorità 4: 🟠
   - Priorità 3: 🟡
   - Priorità 2: 🟢
   - Priorità 1: 🔵

### Vista giornaliera

La vista giornaliera mostra i dettagli delle attività per un giorno specifico:

1. Clicca su "Mostra oggi" nel menu o seleziona un giorno dalla vista settimanale
2. Naviga tra i giorni usando i pulsanti freccia
3. Visualizza i dettagli completi di ogni attività
4. Interagisci direttamente con le attività (modifica, completa, sposta)

### Ricalcolo della schedulazione

Per ottimizzare la pianificazione delle tue attività:

1. Clicca su "Ricalcola" nel menu
2. L'algoritmo di schedulazione riallocherà le attività in modo ottimale
3. Se vengono rilevati conflitti, ti verranno proposte soluzioni alternative

## Gestione dei conflitti

TaskMaster gestisce automaticamente i conflitti tra attività:

1. Quando una nuova attività crea conflitti con quelle già pianificate, il sistema identifica quali attività possono essere spostate con il minor impatto
2. Ti viene proposta automaticamente una riallocazione
3. Le modifiche alla pianificazione precedente vengono evidenziate chiaramente
4. Se non ci sono slot disponibili, viene segnalato immediatamente il conflitto

## Funzionalità offline

TaskMaster funziona anche senza connessione internet:

### Modalità offline automatica

Quando perdi la connessione internet:
1. L'app passa automaticamente in modalità offline
2. Puoi continuare a utilizzare tutte le funzionalità
3. Le modifiche vengono salvate localmente
4. Quando torni online, i dati vengono sincronizzati automaticamente

### Modalità offline forzata

Puoi attivare manualmente la modalità offline:
1. Clicca sul pulsante modalità offline nella barra superiore
2. L'app rimarrà in modalità offline anche con connessione internet
3. Utile per risparmiare dati o quando hai una connessione instabile

## Backup e ripristino

### Generazione di un backup

Per creare un backup dei tuoi dati:
1. Clicca su "Esporta dati" nel menu
2. Verrà generato un codice di backup
3. Copia e salva questo codice in un luogo sicuro

### Ripristino da backup

Per ripristinare i tuoi dati da un backup:
1. Clicca su "Importa dati" nel menu
2. Inserisci il codice di backup
3. Clicca su "Ripristina"

## Esportazione e importazione

### Esportazione in formato iCalendar

Per esportare le tue attività in formato iCalendar:
1. Clicca su "Esporta calendario" nel menu
2. Verrà scaricato un file .ics
3. Questo file può essere importato in altre applicazioni di calendario come Google Calendar, Apple Calendar, Outlook, ecc.

### Importazione da altre fonti

Per importare attività da altre fonti:
1. Clicca su "Importa dati" nel menu
2. Seleziona il formato di importazione (JSON, CSV, iCal)
3. Carica il file
4. Conferma l'importazione

## Analisi del tempo

Per visualizzare statistiche sull'utilizzo del tuo tempo:
1. Clicca su "Analisi tempo" nel menu
2. Visualizza grafici e statistiche su:
   - Distribuzione per categoria
   - Distribuzione per priorità
   - Distribuzione per livello di energia
   - Attività completate vs. pianificate
   - Tempo totale allocato

## Modalità viaggio

Per adattare la schedulazione durante i viaggi:
1. Clicca su "Modalità viaggio" nel menu
2. Seleziona le date del viaggio
3. Imposta le ore disponibili durante il viaggio
4. Le attività verranno ripianificate tenendo conto di questi vincoli

## Priorità temporanea

Per modificare temporaneamente le priorità:
1. Clicca su "Priorità temporanea" nel menu
2. Seleziona la categoria o il tipo di attività
3. Imposta la nuova priorità temporanea
4. Seleziona il periodo di validità
5. Le attività verranno ripianificate di conseguenza

## Notifiche

TaskMaster ti invia notifiche per:
- Attività imminenti (15-30-60 minuti prima, in base alla priorità)
- Attività in ritardo
- Conflitti nella schedulazione
- Sovraccarico di attività

Per gestire le notifiche:
1. Clicca sull'icona delle impostazioni
2. Seleziona "Notifiche"
3. Personalizza le impostazioni delle notifiche

## Risoluzione dei problemi

### L'app non si carica

1. Verifica la tua connessione internet
2. Prova a ricaricare la pagina
3. Cancella la cache del browser
4. Se hai installato l'app, prova a disinstallarla e reinstallarla

### Problemi di sincronizzazione

1. Verifica la tua connessione internet
2. Attiva e disattiva la modalità offline
3. Riavvia l'applicazione
4. Se il problema persiste, utilizza la funzione di backup per salvare i tuoi dati

### Attività non visualizzate correttamente

1. Prova a cambiare vista (settimanale/giornaliera)
2. Utilizza la funzione "Ricalcola"
3. Verifica che non ci siano filtri attivi
4. Riavvia l'applicazione

## Supporto

Per ulteriore assistenza o per segnalare problemi, contatta il supporto all'indirizzo support@taskmaster.app o utilizza il modulo di contatto all'interno dell'applicazione.

---

Grazie per aver scelto TaskMaster! Speriamo che questa applicazione ti aiuti a organizzare al meglio il tuo tempo e a migliorare la tua produttività.
