# Metodologia e fonti

**Versione del modello:** 2026.1

**Anno dei redditi simulati:** 2026

**Data della ricerca:** 9 settembre 2026

Questa è una proiezione semplificata, non un cedolino, un modello 730 o una consulenza fiscale. Le assunzioni sono parte del risultato, non note da ignorare. Il 730/2026 riguarda i redditi 2025: non è il riferimento per scegliere le aliquote sui redditi 2026.

## 1. Perimetro scelto

- Impiegato privato a tempo indeterminato, un datore di lavoro per l'intero anno: 365 giorni di diritto alle detrazioni.
- Domicilio fiscale a Milano, Lombardia, al 1° gennaio 2026, senza trasferimenti.
- Retribuzione ordinaria costante. La RAL include tredicesima ed eventuale quattordicesima e coincide con l'imponibile previdenziale.
- RAL tra **20.000 e 100.000 euro**, estremi inclusi; al massimo due decimali. Input in formato italiano.
- 12, 13 o 14 mensilità: scelta di ripartizione della media, non simulazione di un CCNL.
- Nessun altro reddito, familiare a carico, spesa detraibile, onere deducibile ulteriore o beneficio personale.
- Si applicano **le detrazioni ordinarie e le misure fiscali generali del cuneo**, che non sono agevolazioni personali opzionali.
- INPS dipendente semplificata alla quota pensionistica IVS del 9,19%, con l'1% aggiuntivo sopra la prima fascia pensionabile. Questa non è una pretesa di riprodurre tutti i contributi di un contratto reale.

### Perché limitare la RAL

Il limite inferiore tiene il reddito fiscale sopra 15.000 euro ed evita di simulare la no-tax area, le fasce più basse del bonus e i minimali previdenziali. Non certifica che 20.000 euro rispettino i minimi di qualunque CCNL.

Il limite superiore è sotto il massimale previdenziale 2026 di 122.295 euro. Non servono così anzianità contributiva pre/post 1996 o regole sui redditi oltre 200.000 euro. Nel range restano comunque rappresentati tutti gli scaglioni IRPEF, l'esenzione comunale e il contributo aggiuntivo INPS.

Il trattamento integrativo del D.L. 3/2020 non viene erogato: il reddito minimo del modello è 18.162 euro e, nella fascia 15.000–28.000, senza ulteriori detrazioni/oneri qualificati, la detrazione da lavoro da sola non supera l'IRPEF lorda. L'ulteriore detrazione del cuneo non rende spettante quel trattamento: non è fra le detrazioni elencate dall'art. 1, comma 1, secondo periodo, del D.L. 3/2020. [[10]](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2020-02-05;3~art1!vig=)

### Esclusioni rilevanti

FIS, CIGS, fondi sanitari/contrattuali e altre quote contributive; minimali; part-time; rapporti iniziati/cessati nell'anno; assenze e più datori; premi; fringe benefit; TFR; contributi del datore; pensione complementare; regimi impatriati e altre agevolazioni personali. Escluse le imposte sostitutive 2026 sui rinnovi CCNL e su turni/notturni/festivi/straordinari. Una RAL non descrive da sola queste componenti.

Il TFR non è una trattenuta dalla RAL mensilmente disponibile. Il costo azienda non si ottiene da questo modello, perché la contribuzione datoriale resta fuori.

## 2. Flusso del calcolo

Le formule qui sono in euro. Nel codice gli importi sono **interi in centesimi** e le aliquote in punti base (9,19% = 919 punti base).

```text
contributi = quota IVS ordinaria + quota IVS aggiuntiva
R = RAL − contributi
IRPEF netta = max(0, IRPEF lorda − detrazione lavoro − ulteriore detrazione)
imposte = IRPEF netta + addizionale regionale + addizionale comunale
trattenute = contributi + imposte
netto annuo = RAL − trattenute + bonus non imponibile
netto medio per mensilità = netto annuo / numero di mensilità
```

**R** è il reddito da lavoro dipendente fiscalmente rilevante. Solo in questo scenario coincide sia con il reddito complessivo di riferimento per i benefici, sia con l'imponibile IRPEF. La coincidenza non è generale: ulteriori redditi e oneri la modificherebbero.

Le detrazioni riducono l'imposta, non la RAL. L'eventuale bonus in denaro è un'aggiunta al netto, non una deduzione dall'imponibile. Ogni riga di subtotale nell'interfaccia è esplicitamente segnalata per evitare di sottrarre due volte lo stesso importo.

## 3. Contributi a carico del dipendente

```text
IVS ordinaria = RAL × 9,19%
IVS aggiuntiva = max(0, RAL − 56.224) × 1%
R = RAL − IVS ordinaria − IVS aggiuntiva
```

**9,19% è un'ipotesi dichiarata del prototipo.** Non presentiamo questa percentuale come aliquota INPS complessiva universale. Settore, dimensione aziendale e inquadramento possono comportare ulteriori quote.

La soglia annuale di **56.224 euro** è quella della circolare INPS 6/2026. Nell'elaborazione effettiva il contributo aggiuntivo segue mensilizzazione e conguaglio. Qui si stima il saldo dell'intero anno, non il singolo prelievo mensile. Il tetto contributivo 2026 è 122.295 euro, non raggiungibile nel range ammesso. [[6]](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-6-del-30-01-2026_15151.html) [[7]](https://www.inps.it/it/it/inps-comunica/diritti-e-obblighi-in-materia-di-sicurezza-sociale-nell-unione-e/per-le-imprese/aliquote-contributive.html)

## 4. IRPEF lorda 2026

| Quota di imponibile R | Aliquota |
| --- | ---: |
| Fino a 28.000 € | 23% |
| Oltre 28.000 e fino a 50.000 € | 33% |
| Oltre 50.000 € | 43% |

```text
IRPEF lorda = min(R, 28.000) × 23%
            + max(0, min(R − 28.000, 22.000)) × 33%
            + max(0, R − 50.000) × 43%
```

La seconda aliquota è **33% per i redditi 2026**, non il 35% del 2025. A 40.000 euro di imponibile, l'IRPEF lorda è 10.400 euro, non 13.200: il 33% si applica soltanto alla quota oltre 28.000. Fonte: TUIR art. 11 vigente, modificato dalla L. 199/2025. [[1]](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917~art11!vig=)

## 5. Detrazione da lavoro dipendente

365 giorni di lavoro, nessun ragguaglio infrannuale:

| Reddito R | Detrazione teorica |
| --- | --- |
| Fino a 15.000 € | 1.955 €, ramo non raggiungibile dalla UI |
| 15.000 < R ≤ 28.000 € | 1.910 + 1.190 × t4((28.000 − R) / 13.000) |
| 28.000 < R ≤ 50.000 € | 1.910 × t4((50.000 − R) / 22.000) |
| R > 50.000 € | 0 € |

**t4(x)** tronca un rapporto non negativo a quattro decimali, senza arrotondare. È la regola dell'art. 13, comma 6. Alla detrazione aggiungiamo **65 euro quando 25.000 < R ≤ 35.000** (comma 1.1). La maggiorazione non viene ripartita in proporzione alle mensilità. La detrazione applicata non supera l'imposta disponibile. [[2]](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917~art13!vig=)

## 6. Taglio del cuneo fiscale

Misure della L. 207/2024, art. 1, commi 4–9, strutturali e valide nel 2026. Il vecchio esonero contributivo 6/7% del 2024 **non** si applica. [[3]](https://noipa.mef.gov.it/cl/en/taglio-del-cuneo-fiscale) [[8]](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2024-12-30;207!vig=)

### R ≤ 20.000: bonus non imponibile

Nel range del prototipo il reddito fiscale minimo è 18.162 euro. L'unica fascia raggiunta è quindi quella con bonus al **4,8% di R**:

```text
bonus = R × 4,8%
ulteriore detrazione = 0
```

Per esempio, RAL 20.000 meno INPS 1.838 = R 18.162; bonus 871,78 euro. Non 960 euro (4,8% della RAL). Il bonus non viene tassato e non riduce R.

Le fasce 7,1% e 5,3% della norma non sono implementate perché non raggiungibili dagli input ammessi. La scelta non estende il calcolo a redditi inferiori.

### R > 20.000: ulteriore detrazione

| Reddito R | Detrazione teorica |
| --- | --- |
| 20.000 < R ≤ 32.000 | 1.000 € |
| 32.000 < R < 40.000 | 1.000 × (40.000 − R) / 8.000 |
| R ≥ 40.000 | 0 € |

La detrazione si applica fino alla capienza dell'IRPEF residua dopo la detrazione da lavoro. Non coesiste con il bonus monetario. A **R = 20.000 esatti** spetta ancora il bonus. A 40.000 la detrazione è zero.

Per questo rapporto la L. 207/2024 non ripete il troncamento dell'art. 13: il modello conserva il rapporto esatto e arrotonda l'importo finale al centesimo. È una convenzione documentata, non l'affermazione che ogni software paghe la implementi identicamente.

## 7. Addizionali

Si calcolano su **R**, non sulla RAL e non sull'IRPEF netta. La disponibilità di detrazioni IRPEF non riduce direttamente la loro base. Il codice prevede l'azzeramento se l'IRPEF netta è zero; nell'intervallo supportato questa condizione non è raggiunta.

### Regione Lombardia

| Quota di R | Aliquota |
| --- | ---: |
| Fino a 15.000 € | 1,23% |
| Oltre 15.000 e fino a 28.000 € | 1,58% |
| Oltre 28.000 e fino a 50.000 € | 1,72% |
| Oltre 50.000 € | 1,73% |

Applicazione **progressiva per quota**, senza sostituire questi scaglioni con quelli nazionali a tre fasce. [[4]](https://www.regione.lombardia.it/bollo-auto-e-tributi-regionali/red-addizionale-regionale-irpef)

### Comune di Milano

```text
se R ≤ 23.000: addizionale = 0
se R > 23.000: addizionale = R × 0,8%
```

La soglia è un'esenzione, non una franchigia. A 23.000,01 euro l'addizionale annua è circa 184 euro. Può quindi esserci una diminuzione locale del netto quando il reddito supera la soglia: imporre al test una crescita monotona del netto sarebbe errato. Fonte: Comune di Milano, aliquote e soglia vigenti riportate nella pagina consultata. La pagina non riporta una nuova delibera specifica per il 2026. [[5]](https://www.comune.milano.it/argomenti/tributi/addizionale-comunale-irpef)

### Competenza e cassa

Si sottraggono le addizionali riferite al reddito annuale simulato. Non si ricostruiscono i mesi di acconto, saldo e recupero dell'anno successivo. Il risultato è una **stima annuale per competenza**, non la somma certa dei bonifici ricevuti nel 2026.

## 8. Netto mensile

```text
media = netto annuo / 12, 13 o 14
```

La RAL include già tutte le mensilità. Cambiare 13 in 14 **non cambia** né il reddito annuo né le imposte. Cambia soltanto il denominatore della media.

Tredicesima e quattordicesima possono avere trattamenti mensili differenti; la media non pretende di determinarne gli importi individuali. L'arrotondamento della media può produrre pochi centesimi di differenza se la si moltiplica nuovamente per le mensilità: fa fede il totale annuo.

## 9. Arrotondamenti e quadratura

- RAL convertita in centesimi interi, senza calcoli monetari cumulativi in virgola mobile.
- Contributi ordinari e aggiuntivi arrotondati separatamente al centesimo, metà verso l'alto.
- Imposta di ciascuno scaglione arrotondata al centesimo; totale pari alla somma delle righe mostrate.
- Rapporti della detrazione lavoro troncati a quattro decimali; detrazione finale arrotondata al centesimo.
- Ulteriore detrazione e bonus arrotondati al centesimo sull'importo finale.
- Tutti i totali sommano/sottraggono gli importi delle voci arrotondate; quadratura esatta al centesimo.
- Nessuna simulazione degli arrotondamenti mensili INPS o all'euro dei modelli dichiarativi.

Questa scelta privilegia la ricostruibilità delle voci. Un software paghe può differire di centesimi/euro per prassi di arrotondamento e conguagli, anche a parità di regole principali.

## 10. Esempio ricostruibile: RAL 35.000, 13 mensilità

| Passaggio | Importo |
| --- | ---: |
| RAL | 35.000,00 € |
| INPS 9,19% | −3.216,50 € |
| INPS aggiuntiva | 0,00 € |
| Imponibile fiscale R | 31.783,50 € |
| IRPEF primo scaglione: 28.000 × 23% | 6.440,00 € |
| IRPEF secondo scaglione: 3.783,50 × 33% | 1.248,56 € |
| IRPEF lorda | 7.688,56 € |
| Detrazione lavoro: 1.910 × 0,8280 + 65 | −1.646,48 € |
| Ulteriore detrazione cuneo | −1.000,00 € |
| IRPEF netta | 5.042,08 € |
| Addizionale Lombardia | 454,98 € |
| Addizionale Milano | 254,27 € |
| **Totale imposte** | **5.751,33 €** |
| Totale trattenute (INPS + imposte) | 8.967,83 € |
| Bonus non imponibile | 0,00 € |
| **Netto annuo** | **26.032,17 €** |
| **Media su 13 mensilità** | **2.002,47 €** |

Controllo indipendente dell'esempio effettuato con aritmetica decimale in Python, separata dal motore JavaScript.

## 11. Registro delle fonti e decisioni di ricerca

| # | Fonte | Uso e stato della verifica |
| --- | --- | --- |
| 1 | [TUIR art. 11, Normattiva](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917~art11!vig=) | Testo vigente: scaglioni nazionali 2026 23/33/43, verificato nel testo. |
| 2 | [TUIR art. 13, Normattiva](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917~art13!vig=) | Formule, maggiorazione 65 €, rapporti a quattro decimali. |
| 3 | [FAQ taglio cuneo, NoiPA/MEF](https://noipa.mef.gov.it/cl/en/taglio-del-cuneo-fiscale) | FAQ del 16 maggio 2025; spiegazione della misura strutturale, non fonte del nuovo 33% 2026. |
| 4 | [Regione Lombardia](https://www.regione.lombardia.it/bollo-auto-e-tributi-regionali/red-addizionale-regionale-irpef) | Aliquote regionali, base e progressività lette nella pagina ufficiale. |
| 5 | [Comune di Milano](https://www.comune.milano.it/argomenti/tributi/addizionale-comunale-irpef) | 0,8%, esenzione ≤23.000 €, domicilio al 1° gennaio. Accesso testuale 403; contenuto verificato nel browser. |
| 6 | [INPS, circolare 6 del 30/01/2026](https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa/dettaglio.circolari-e-messaggi.2026.01.circolare-numero-6-del-30-01-2026_15151.html) | Pagina ufficiale esistente ma testo dinamico non estratto; soglia 56.224 e massimale 122.295 verificati nel PDF integrale della circolare [ospitato da Redigo](https://www.redigo.info/wp-content/uploads/2026/02/Circolare-numero-6-del-30-01-2026-_-Dettaglio-di-Circolari-Messaggi-e-Normativa-_-INPS-1.pdf) e riscontrati su EC News. |
| 7 | [INPS, aliquote contributive](https://www.inps.it/it/it/inps-comunica/diritti-e-obblighi-in-materia-di-sicurezza-sociale-nell-unione-e/per-le-imprese/aliquote-contributive.html) | Evidenzia che aliquote effettive dipendono dall'inquadramento. Il 9,19% resta una scelta semplificativa, non una certificazione per CCNL. |
| 8 | [Legge 207/2024, art. 1, Normattiva](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2024-12-30;207!vig=) | Commi 4–9: bonus, detrazione, redditi di riferimento e riconoscimento automatico. |
| 9 | [Legge 199/2025, Normattiva](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2025-12-30;199) | Legge di bilancio 2026. Il testo vigente del TUIR è stato preferito per leggere l'aliquota. Nuove imposte sostitutive esplicitamente escluse. |

[10. D.L. 3/2020, art. 1 vigente](https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2020-02-05;3~art1!vig=): verificato l'elenco delle detrazioni che rendono spettante il trattamento integrativo nella fascia 15.000–28.000 euro.

Le pagine secondarie sono state usate per orientare la ricerca, non per copiare ciecamente formule. Per esempio, una guida secondaria descriveva la somma non imponibile del cuneo come riduzione della base IRPEF: il testo della legge e le FAQ MEF chiariscono che si tratta di una somma aggiuntiva. Il prototipo segue le fonti primarie.

## 12. Come aggiornare il modello

1. Scegliere esplicitamente un nuovo anno dei redditi.
2. Verificare leggi, circolari INPS e delibere locali effettivamente applicabili.
3. Modificare `RULES` in `calc.js`; per detrazioni/cuneo aggiornare anche le funzioni dedicate.
4. Aggiornare questa metodologia e le spiegazioni nella pagina, senza dichiararle automaticamente aggiornate.
5. Aggiungere fixture indipendenti e test su soglie nuove o modificate.
6. Eseguire test motore e browser, verificare la quadratura e documentare i risultati.

La pagina non scarica aliquote da Internet e non si aggiorna silenziosamente quando cambia il calendario.
