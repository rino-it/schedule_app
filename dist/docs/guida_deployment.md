# Guida al Deployment - TaskMaster PWA

Questa guida fornisce istruzioni dettagliate per distribuire l'applicazione TaskMaster PWA su vari ambienti di hosting.

## Requisiti

TaskMaster è una Progressive Web App (PWA) che può essere ospitata su qualsiasi server web statico. Non richiede un backend server-side, poiché tutte le funzionalità sono implementate lato client.

## Opzioni di Deployment

### 1. Hosting Web Statico

#### Netlify
1. Crea un account su [Netlify](https://www.netlify.com/)
2. Trascina e rilascia la cartella `dist` nell'interfaccia di Netlify
3. L'app sarà immediatamente disponibile a un URL generato automaticamente
4. Configura un dominio personalizzato nelle impostazioni del sito

#### GitHub Pages
1. Crea un repository su GitHub
2. Carica i contenuti della cartella `dist` nel repository
3. Vai su Settings > Pages
4. Seleziona il branch principale come source
5. L'app sarà disponibile all'URL `https://[username].github.io/[repository]`

#### Firebase Hosting
1. Installa Firebase CLI: `npm install -g firebase-tools`
2. Accedi a Firebase: `firebase login`
3. Inizializza il progetto: `firebase init hosting`
4. Specifica `dist` come directory pubblica
5. Distribuisci l'app: `firebase deploy`

### 2. Server Web Tradizionale

#### Apache
1. Copia i contenuti della cartella `dist` nella directory principale del server web (es. `/var/www/html/`)
2. Assicurati che il file `.htaccess` contenga:
   ```
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```
3. Riavvia Apache: `sudo service apache2 restart`

#### Nginx
1. Copia i contenuti della cartella `dist` nella directory principale del server web (es. `/usr/share/nginx/html/`)
2. Configura Nginx aggiungendo al file di configurazione:
   ```
   server {
     listen 80;
     server_name yourdomain.com;
     root /usr/share/nginx/html;
     index index.html;
     
     location / {
       try_files $uri $uri/ /index.html;
     }
     
     # Configurazione MIME per il manifest
     location /manifest.json {
       add_header Content-Type application/manifest+json;
     }
     
     # Configurazione per il Service Worker
     location /service-worker.js {
       add_header Cache-Control "no-cache";
     }
   }
   ```
3. Riavvia Nginx: `sudo service nginx restart`

### 3. Contenitori Docker

1. Crea un Dockerfile nella directory principale:
   ```
   FROM nginx:alpine
   COPY dist/ /usr/share/nginx/html/
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. Crea un file nginx.conf:
   ```
   server {
     listen 80;
     root /usr/share/nginx/html;
     index index.html;
     
     location / {
       try_files $uri $uri/ /index.html;
     }
     
     location /manifest.json {
       add_header Content-Type application/manifest+json;
     }
     
     location /service-worker.js {
       add_header Cache-Control "no-cache";
     }
   }
   ```

3. Costruisci l'immagine Docker:
   ```
   docker build -t taskmaster-pwa .
   ```

4. Esegui il container:
   ```
   docker run -p 80:80 taskmaster-pwa
   ```

## Configurazioni Aggiuntive

### HTTPS

Per una PWA è fondamentale utilizzare HTTPS. La maggior parte dei servizi di hosting moderni (Netlify, GitHub Pages, Firebase) lo forniscono automaticamente.

Se utilizzi un server tradizionale, configura HTTPS con Let's Encrypt:

```
sudo apt-get install certbot
sudo certbot --nginx -d yourdomain.com
```

### Headers

Assicurati che il server invii i seguenti headers:

```
Content-Type: application/manifest+json
```
per il file manifest.json

```
Cache-Control: no-cache
```
per il file service-worker.js

### Compressione

Abilita la compressione gzip o brotli per migliorare le prestazioni:

Apache:
```
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json
</IfModule>
```

Nginx:
```
gzip on;
gzip_types text/plain text/css application/javascript application/json;
```

## Verifica dell'Installazione

Dopo il deployment, verifica che:

1. L'applicazione si carichi correttamente
2. Il manifest.json sia accessibile
3. Il service worker si registri correttamente
4. L'app funzioni offline
5. L'app possa essere installata come PWA

Puoi utilizzare lo strumento Lighthouse di Chrome DevTools per verificare che tutte le funzionalità PWA siano configurate correttamente.

## Aggiornamenti

Per aggiornare l'applicazione:

1. Modifica i file sorgente
2. Ricostruisci la cartella dist
3. Ridistribuisci seguendo le stesse istruzioni

Il service worker gestirà automaticamente l'aggiornamento della cache e notificherà gli utenti della disponibilità di una nuova versione.

## Risoluzione dei Problemi

### Service Worker non registrato
- Verifica che il file service-worker.js sia nella root del sito
- Controlla che il sito utilizzi HTTPS
- Verifica che non ci siano errori nella console del browser

### Manifest non riconosciuto
- Verifica che il file manifest.json sia nella root del sito
- Controlla che il Content-Type sia corretto
- Verifica che tutte le icone siano accessibili

### App non installabile
- Verifica che tutti i requisiti PWA siano soddisfatti
- Controlla Lighthouse per eventuali problemi
- Assicurati che il manifest contenga tutte le informazioni necessarie

## Supporto

Per ulteriore assistenza, contatta il supporto all'indirizzo support@taskmaster.app.
