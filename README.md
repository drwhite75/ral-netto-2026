# In chiaro · RAL → netto 2026

Una pagina web in italiano che calcola il netto annuale, la media mensile e ogni trattenuta del caso standard.

**[Apri il calcolatore online](https://drwhite75.github.io/ral-netto-2026/)** oppure apri `index.html` nel browser e premi «Calcola il netto». Non servono account, chiavi API o un backend. La copia locale funziona anche offline.

## Cosa puoi fare

- Inserire una RAL tra **20.000 e 100.000 €**, anche con centesimi in formato italiano.
- Scegliere 12, 13 o 14 mensilità.
- Leggere netto annuo, netto medio per mensilità e imposte annue, separati dai contributi INPS.
- Ricostruire il calcolo: imponibile, scaglioni IRPEF, detrazioni, cuneo fiscale, addizionali Lombardia/Milano.
- Consultare le ipotesi e le fonti normative direttamente nella pagina.
- Scaricare un riepilogo TXT con le fonti oppure stampare/salvare in PDF dal browser.

Il risultato si aggiorna **solo al clic su Calcola** o con Invio. Se modifichi un input, un avviso segnala che il risultato è da ricalcolare; l'esportazione rimane disabilitata per evitare riepiloghi incoerenti.

## Scenario e limiti

Anno fiscale **2026**, impiegato privato a tempo indeterminato per 365 giorni, domicilio fiscale a Milano al 1° gennaio, nessun altro reddito, familiare a carico o onere detraibile.

- INPS dipendente semplificata: **9,19% IVS + 1% sulla quota di RAL oltre 56.224 €**. Esclusi FIS/CIGS e fondi contrattuali: non è un'aliquota universale per qualunque CCNL.
- IRPEF progressiva **23% / 33% / 43%**, detrazione lavoro e misure generali del cuneo fiscale incluse.
- Regione Lombardia progressiva **1,23% / 1,58% / 1,72% / 1,73%**.
- Milano **0,8% dell'intero imponibile** sopra 23.000 €, esenzione fino a tale soglia inclusa.
- Netto mensile = **media**, non importo esatto di ogni cedolino.
- Esclusi TFR, costo azienda, premi, benefit, regimi speciali e imposte sostitutive 2026 sui rinnovi CCNL e su turni/straordinari.
- Addizionali per competenza annuale, non calendario di acconti e saldi.

Non elabora cedolini e non sostituisce una consulenza fiscale.

## Esempio: RAL 35.000 €, 13 mensilità

| Voce | Stima annuale |
| --- | ---: |
| RAL | 35.000,00 € |
| Contributi INPS dipendente | 3.216,50 € |
| Imponibile fiscale | 31.783,50 € |
| IRPEF lorda | 7.688,56 € |
| Detrazione lavoro | 1.646,48 € |
| Ulteriore detrazione cuneo | 1.000,00 € |
| IRPEF netta | 5.042,08 € |
| Addizionale Lombardia | 454,98 € |
| Addizionale Milano | 254,27 € |
| **Totale imposte** | **5.751,33 €** |
| **Netto annuale** | **26.032,17 €** |
| **Media su 13 mensilità** | **2.002,47 €** |

La RAL comprende già tutte le mensilità. Su 14 mensilità il netto annuo resta uguale; la media diventa 1.859,44 €.

## Architettura

```text
index.html                 Pagina, input, ipotesi e fonti
styles.css                 Layout responsive, focus, stampa e reduced motion
calc.js                    Motore puro, regole 2026 e validazione
app.js                     Presentazione, stato del form ed esportazione
favicon.svg                Icona locale
package.json               Comandi test, nessuna dipendenza di produzione
tests/calc.test.cjs         Test automatici del motore, senza librerie esterne
tests/browser.test.cjs      Test end-to-end opzionali con Playwright
docs/METODOLOGIA.md         Formule, convenzioni, fonti e limiti
docs/SCELTE-PRODOTTO.md     Decisioni di prodotto e guida alla discussione
docs/VERIFICA.md            Registro delle verifiche effettivamente svolte
```

**Perché HTML/CSS/JavaScript senza framework:** una sola pagina, calcolo sincrono, stato ridotto. Separare una funzione pura dal DOM rende il dominio verificabile senza aggiungere dipendenze o un processo di build. `calc.js` funziona sia nel browser sia via CommonJS nei test.

Gli importi sono interi in centesimi, le aliquote in punti base. Le righe arrotondate quadrano esattamente con il totale. Il motore non usa rete, DOM o data corrente. I risultati dipendono soltanto dagli input e dalla versione delle regole.

Nessun cookie, analytics, localStorage, font/CDN esterno o trasmissione della RAL. Il salvataggio di un riepilogo avviene solo su richiesta. Un eventuale hosting può registrare le normali richieste HTTP, ma la RAL non viene aggiunta a URL o richieste.

## Avvio facoltativo tramite server locale

Dalla cartella del progetto, con Python 3:

```sh
python -m http.server 8791 --bind 127.0.0.1
```

Poi apri `http://127.0.0.1:8791/`. In alternativa basta il doppio clic su `index.html`.

## Test del motore

Richiedono **Node.js 20 o superiore**, senza `npm install`:

```sh
npm test
# oppure
node --test tests/calc.test.cjs
```

Copertura: esempi numerici indipendenti; soglie di imponibile 20.000, 23.000, 25.000, 28.000, 32.000, 35.000, 40.000 e 50.000; soglia contributiva 56.224 di RAL; parser italiano; limiti input; invarianti contabili su 8.001 RAL; invariabilità dell'annuale al cambio mensilità.

Non assumiamo che il netto sia strettamente crescente: l'esenzione comunale genera un salto reale sopra 23.000 € di imponibile.

## Test browser opzionali

Il sito non necessita di Playwright. Serve solo per eseguire questo test di sviluppo:

```sh
npm install --no-save --package-lock=false playwright@1.47.2
npx playwright install chromium
```

Con il server locale avviato in un altro terminale:

```sh
node tests/browser.test.cjs
```

Variabili facoltative: `TEST_URL`, `TEST_OUTPUT`, `PLAYWRIGHT_MODULE` (per un'installazione già esistente) e `BROWSER_EXECUTABLE`. I test generano screenshot, riepilogo TXT/PDF e `browser-summary.json` in `test-results/`, esclusa da Git. Lo script usa un browser isolato.

## Documentazione

- [Metodologia, formule e fonti](docs/METODOLOGIA.md)
- [Scelte di prodotto](docs/SCELTE-PRODOTTO.md)
- [Verifiche eseguite](docs/VERIFICA.md)

## Sito e repository

- **Calcolatore online:** https://drwhite75.github.io/ral-netto-2026/
- **Codice, fonti e test:** https://github.com/drwhite75/ral-netto-2026

GitHub Pages pubblica il sito statico dal branch `main`, cartella principale. I cambiamenti caricati su `main` vengono pubblicati dopo il completamento del deployment. Lo stato delle pubblicazioni è consultabile nella scheda Actions del repository.

Il calcolatore elabora la RAL nel browser. Non include credenziali, servizi di raccolta dati o richieste contenenti la retribuzione. Gli indirizzi `localhost` indicati per lo sviluppo sono indirizzi standard della macchina di chi esegue il progetto, non indirizzi del computer dell'autore.
