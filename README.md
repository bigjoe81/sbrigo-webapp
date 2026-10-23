# Sbrigo

Frontend Angular per Sbrigo, realizzato con Tailwind CSS 4 e daisyUI 5. Il
backend Laravel si trova nel repository adiacente `../sbrigo-api`.

Il logo e l'icona del brand sono in `public/brand/`. L'interfaccia usa la palette
Slate Blue `#834EDB`, Bubblegum Pink `#FF4F79`, Baltic Blue `#33658A`,
Emerald `#23CE6B` e Porcelain `#FFFCF9`.

## Avvio

```bash
npm install
npm start
```

Apri `http://localhost:4200`. In locale l'API usa automaticamente la stessa
macchina sulla porta `8000`. Per un deploy, configura `SBRIGO_API_URL` in
`public/runtime-config.js` con l'URL HTTPS dell'API; fuori da localhost il
frontend rifiuta configurazioni HTTP o mancanti.

## API Laravel: stato dell'integrazione

L'API Laravel implementa OTP via email e sessioni cookie Sanctum:

| Metodo | Endpoint | Payload / risposta |
| --- | --- | --- |
| GET | `/sanctum/csrf-cookie` | Imposta cookie di sessione e CSRF |
| POST | `/api/register` | Nome ed email; crea account non verificato o invia un OTP se esiste già |
| POST | `/api/otp/send` | Email; invia OTP senza rivelare se l'account esiste |
| POST | `/api/otp/verify` | Email e codice di 6 cifre; verifica l'email e apre la sessione |
| GET | `/api/user` | Richiede sessione; restituisce `{ "user": { ... } }` |
| POST | `/api/logout` | Richiede sessione e la invalida |
| GET | `/api/admin/users` | Richiede sessione e permesso `manage-users` |
| GET / POST | `/api/contacts` | Elenco paginato con ricerca/filtro e creazione anagrafiche |
| GET / PUT / PATCH / DELETE | `/api/contacts/{id}` | Lettura, modifica ed eliminazione delle proprie anagrafiche |

Il client richiede il cookie CSRF prima delle richieste che modificano dati e
invia cookie e header XSRF con credenziali. Il backend limita le origini CORS a
`FRONTEND_URL`; configura `FRONTEND_URL` e `SANCTUM_STATEFUL_DOMAINS` in
produzione con i domini reali. Il servizio email del backend deve essere
configurato: il mailer `log` è solo per lo sviluppo locale.

## Build e test

```bash
npm run build
npm test
```

## Privacy e sicurezza: stato verificato e gate per la beta

La verifica ha incluso questo frontend e il backend Laravel presente in
`../sbrigo-api`. Non comprende l'ambiente di produzione, l'infrastruttura, i
contratti con i fornitori o i documenti legali. Build e test superati non
dimostrano la conformità GDPR né la sicurezza del servizio: **Sbrigo non è
pronto per dati operativi reali**.

Stato verificabile nel codice esaminato:

- Il backend gestisce account con OTP e sessioni cookie, oltre a un elenco
  amministrativo di utenti. Non contiene ancora modelli, endpoint o policy per
  aziende, clienti, fatture, incassi, caricamento documenti o importazione AI;
  non c'è quindi ancora isolamento tra aziende da verificare.
- La dashboard mostra contenuti dimostrativi, non dati letti dal backend.
- La registrazione richiede solo nome ed email; per indirizzi già registrati
  risponde nello stesso modo e invia un OTP. Un nuovo account resta non
  verificato e non autenticato finché il codice email non viene verificato. Il codice ha
  scadenza di 5 minuti, è conservato in cache come HMAC e i tentativi di invio
  e verifica sono limitati per email e IP. La verifica apre una sessione e
  abilita l'accesso solo all'indirizzo verificato.
- Il cookie è `HttpOnly` e `SameSite=Lax`; il codice forza cifratura sessione e
  cookie `Secure` quando `APP_ENV=production`. La configurazione locale
  effettiva risolve `SESSION_ENCRYPT=false` e cookie non `Secure`, correttamente
  per HTTP locale. In produzione verifica comunque gli header del browser.
- Il file `.env.example` è per sviluppo locale (debug attivo, URL HTTP, storage
  locale e posta su log). Non usarlo tal quale in produzione. L'OTP via email
  è il solo fattore di autenticazione: MFA amministrativa distinta non è
  implementata.
- Nel frontend non risultano analytics o altri strumenti di tracciamento.
  L'eventuale uso di cookie e tecnologie di tracciamento da parte del backend
  o dei fornitori va verificato separatamente.
- Non sono presenti nei due repository informativa privacy, condizioni d'uso,
  DPA, registro dei trattamenti, elenco dei sub-responsabili né procedure
  documentate di conservazione, cancellazione o gestione degli incidenti.

**Non caricare né trattare dati operativi reali nella beta finché ogni punto
seguente non è stato verificato e documentato:**

1. Definire i ruoli di titolare e responsabile per ciascun trattamento;
   predisporre informativa, condizioni d'uso, DPA ex art. 28, registro e
   informativa cookie con un professionista privacy.
2. Inventariare hosting, database, storage, email, assistenza e AI; verificare
   accordi, sub-responsabili, localizzazione/accessi, trasferimenti extra SEE,
   conservazione e uso dei documenti per addestramento.
3. Implementare e testare nel **backend** isolamento tra aziende a ogni
   richiesta, autorizzazioni per ruolo e accesso amministrativo limitato. I
   controlli Angular e le guardie di route non sostituiscono l'autorizzazione
   server-side.
4. Per il deploy, impostare URL API HTTPS nel runtime config, origini reali in
   `FRONTEND_URL` e `SANCTUM_STATEFUL_DOMAINS`, mailer di produzione e cookie
   HTTPS e `SESSION_DOMAIN` se sono usati sottodomini distinti; testare CORS e
   CSRF sul dominio pubblico. Valutare MFA distinta per gli amministratori.
5. Tenere i documenti in storage privato, autorizzare i download lato server
   e usare link a scadenza; predisporre backup protetti e provare il ripristino.
   Non registrare nei log documenti, credenziali o dati personali non necessari.
6. Definire ed esercitare esportazione/restituzione, cancellazione e tempi di
   eliminazione dai backup, assistenza alle richieste degli interessati e
   procedura di data breach con comunicazione tempestiva ai clienti.
7. Verificare cookie e tracker effettivi prima del rilascio e impedire
   l'attivazione di quelli non necessari prima del consenso, se richiesto.

DPO e DPIA non sono presunti automaticamente: valutarne l'obbligo sui trattamenti
effettivi. La valutazione finale di documenti e obblighi va fatta con un
professionista; la verifica tecnica deve includere backend, configurazione di
deploy e fornitori, non solo questo repository.
