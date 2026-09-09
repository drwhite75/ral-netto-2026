# Registro delle verifiche

Data: **9 settembre 2026**. Questo registro descrive verifiche realmente eseguite, non una certificazione fiscale o di accessibilità.

## Motore: 21 test superati, 0 falliti

Test automatici riproducibili con il comando:

```sh
node --test tests/calc.test.cjs
```

I test includono:

- Fixture complete e parziali per RAL 20.000, 35.000, 40.000 e 60.000 euro.
- Ricalcolo indipendente degli esempi con Python `Decimal`, senza richiamare il motore JS.
- Soglie dei benefici, maggiorazione di 65 euro, esenzione Milano e aliquote progressive.
- Soglia INPS sulla **RAL**, distinta dalle soglie fiscali sull'**imponibile**.
- Effetto delle 12/13/14 mensilità, che non modificano il risultato annuale.
- Input invalidi, valori non finiti, formato italiano e centesimi.
- Invarianti contabili su **8.001 RAL**, da 20.000 a 100.000 euro a passi di 10 euro.
- Assenza di mutazioni condivise tra calcoli.

### Errore trovato e corretto durante i test

Un valore atteso del test sulla soglia 25.000 euro era errato di un centesimo: `1.910 + 1.190 × 0,2307 = 2.184,533`, arrotondato **2.184,53**, non 2.184,52. È stata corretta la fixture dopo verifica indipendente con Decimal; non è stata alterata la formula per far passare il test.

## Browser: 66 controlli superati, 0 falliti

Test end-to-end in un browser Chromium isolato, con riduzione del movimento attivata. Comando:

```sh
node tests/browser.test.cjs
```

La suite usa Playwright solo per i test: il sito non ha dipendenze di produzione. Il risultato esportato è in [browser-summary.json](browser-summary.json).

Verificati:

- Stato iniziale e calcolo con il pulsante.
- Importi formattati in italiano e scaglioni visibili.
- Cambio mensilità, avviso di risultati precedenti ed export disabilitato fino al ricalcolo.
- Errori per input vuoti, testo, negativi, fuori perimetro, formati ambigui e stringa HTML, senza esecuzione dell'input.
- Invio da tastiera, preset e input con centesimi.
- Bonus cuneo rappresentato correttamente nella barra e nel riepilogo.
- Download TXT effettivo con importi e fonti.
- Stampa/PDF generato, con scenario e risultati mantenuti e form escluso.
- Layout a **320, 375, 390, 560, 768, 860, 900, 1.024 e 1.440 pixel**, con tabelle aperte: nessun overflow orizzontale della pagina. Le tabelle larghe scorrono nel proprio contenitore.
- RAL massima 100.000 euro su mobile e focus sul risultato.
- Apertura `file://` con contesto browser offline e calcolo funzionante.
- **Zero errori JavaScript e zero richieste a domini terzi** durante l'uso del calcolatore.

Screenshot desktop e mobile e PDF sono stati anche ispezionati visivamente. L'estrazione testuale del PDF non rendeva alcune cifre del font; il PDF renderizzato mostra gli importi corretti. Il riepilogo stampato può occupare più di una pagina, in base alle opzioni di stampa.

### Difetto trovato e corretto durante i test

Con le tabelle aperte, a 320 pixel il contenuto minimo della griglia allargava la pagina. Correzione: `min-width: 0` sul pannello risultati e larghezza massima del contenitore delle tabelle. La suite completa successiva ha superato tutti i 66 controlli.

## Fonti e revisione

Una revisione separata delle fonti ha confermato i parametri su TUIR, L. 207/2024, INPS e fonti locali. Anche la metodologia è stata riletta separatamente e l'esempio 35.000 euro è stato ricalcolato al centesimo.

Il testo primario del D.L. 3/2020 art. 1 è stato verificato per motivare l'esclusione del trattamento integrativo nel perimetro scelto.

Una seconda revisione indipendente del codice ha rieseguito i 21 test con Node.js e confrontato il motore con una reimplementazione Python/Decimal su **718.551 punti**: tutti gli euro del range, finestre al centesimo attorno alle soglie e una scansione densa del segmento 20.000–26.000 euro. **Zero differenze campo per campo e zero violazioni delle invarianti**. Nessun difetto di codice P1/P2 rilevato. La revisione ha confermato parser, assenza di doppio conteggio, rendering senza HTML dell'utente e coerenza delle formule con la metodologia.

Note non bloccanti: i testi di servizio più piccoli restano a 10 pixel; la fascia bonus al 4,8% è valida solo entro il perimetro dichiarato e va estesa esplicitamente se cambia la RAL minima.

## Cosa non è stato verificato

- Certificazione professionale di correttezza paghe, calcolo multi-CCNL o corrispondenza a cedolini individuali.
- Safari e Firefox: i test automatici eseguiti sono su Chromium.
- Audit WCAG completo o test assistivi con screen reader reale; sono state controllate semantica, etichette, tastiera e focus nell'ambito del prototipo.
- Interviste utenti e metriche reali di comprensione/usabilità.
