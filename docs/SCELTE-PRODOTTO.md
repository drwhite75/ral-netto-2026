# Scelte di prodotto

## Il problema da risolvere

Una persona legge una RAL in un'offerta e vuole capire quanto resterà disponibile. Il bisogno principale è una risposta utilizzabile in pochi secondi, ma la fiducia dipende dalla possibilità di ricostruire il numero.

Il prototipo si rivolge a un dipendente o candidato non esperto di paghe. Le formule sono consultabili per chi vuole controllare fonti, logiche e limiti.

**Criterio di successo del prototipo:** inserire una RAL, premere Calcola, vedere netto annuale e mensile medio e spiegare la differenza tra lordo e netto senza consultare il codice.

Non sono state condotte interviste utenti né misurate conversioni. Le decisioni sotto sono ipotesi di prodotto da validare, non risultati di ricerca sul campo.

## Decisioni e compromessi

| Scelta | Motivo | Cosa rinunciamo a coprire |
| --- | --- | --- |
| Un anno fiscale esplicito: 2026 | Evita di mescolare regole 2025 e dichiarazione 730/2026 | Storico e selettore annualità |
| Milano e un profilo lavorativo fisso | Una stima riproducibile senza un lungo questionario | Tutti gli altri domicili e rapporti |
| RAL 20.000–100.000 | Copre un caso standard e soglie interessanti, con un limite onesto | Redditi bassi/altissimi e minimali |
| Solo RAL e mensilità come input | Bastano per il modello scelto; gli altri parametri sono assunzioni visibili | Simulazione paghe individuale |
| Calcolo esplicito, non a ogni tasto | Il numero mostrato corrisponde a un input confermato | Anteprima istantanea durante la digitazione |
| Netto mensile chiamato «medio» | La media non descrive tredicesima, conguagli o cedolino ordinario | Previsione dei singoli bonifici |
| Contributi e imposte distinti | Evita di chiamare «tasse» ogni differenza rispetto alla RAL | Nessuna rinuncia funzionale |
| Detrazioni in un dettaglio apribile | Risposta principale leggibile, ma calcolo ispezionabile | Tutte le formule aperte al primo accesso |
| Riepilogo esportabile, senza account | Utile per conservare una simulazione senza raccogliere dati | Cronologia cloud e condivisione della RAL via URL |
| HTML/CSS/JS e funzione pura | Nessuna build, riproducibilità offline, dipendenze minime | Framework utile a un'app più ampia |

## L'interfaccia

Direzione scelta: sobria e leggibile, fondo carta, verde scuro e tipografia editoriale. «In chiaro» è il nome del simulatore.

La gerarchia segue il compito:

1. Input e ipotesi essenziali.
2. Netto medio e totale annuale.
3. Ripartizione fra netto, contributi e imposte.
4. Ricostruzione delle trattenute e dettagli delle formule.
5. Limiti e fonti.

Su mobile il risultato riceve il focus dopo Calcola. Ci sono label e fieldset, navigazione da tastiera, messaggi di errore, stato del risultato annunciato e rispetto di `prefers-reduced-motion`. I dati non dipendono soltanto dai colori del grafico.

Quando un input cambia, il numero precedente non viene presentato come aggiornato: compare un avviso e vengono disabilitati download/stampa. Il contesto della RAL calcolata resta visibile accanto al risultato.

## Domande sulle scelte di calcolo

### «Come arrivi dal lordo al netto?»

Prima sottraggo i contributi del dipendente. Su quell'imponibile calcolo l'IRPEF progressiva; sottraggo le detrazioni e aggiungo le addizionali. Il netto annuo è la RAL meno contributi e imposte, più l'eventuale bonus non imponibile. Nel modello nessuna voce viene contata due volte.

### «Perché non basta moltiplicare la RAL per una percentuale?»

Scaglioni, detrazioni ed esenzioni dipendono dal reddito. Inoltre molte soglie sono sul reddito fiscale, non sulla RAL. Il peso complessivo cambia lungo l'intervallo.

### «Perché il contributo INPS è una semplificazione?»

Il 9,19% è la quota IVS ipotizzata; altre quote dipendono da settore e dimensioni dell'azienda. Senza CCNL e inquadramento non posso affermare che sia la trattenuta previdenziale completa di un dipendente reale. Ho scelto di dichiarare il limite anziché aggiungere una precisione apparente.

### «Senza agevolazioni, perché hai applicato detrazioni e cuneo?»

Sono regole fiscali ordinarie legate al reddito del dipendente. Escluderle produrrebbe una sovrastima sistematica delle imposte nel caso standard. Ho escluso invece situazioni personali e regimi speciali.

### «Perché il bonus non riduce l'imponibile?»

La norma lo definisce una somma che non concorre al reddito: viene aggiunta al netto. Non autorizza a dedurla dal reddito da lavoro già determinato. È un punto verificato sulla legge e sulle FAQ MEF.

### «Se aumento la RAL, il netto aumenta sempre?»

Non necessariamente per un incremento minimo. Milano esenta fino a 23.000 euro di imponibile; subito sopra applica lo 0,8% all'intero reddito, creando un salto. Anche la maggiorazione della detrazione di 65 euro ha soglie nette. Per questo i test verificano i confini, non impongono una monotonia falsa.

### «13 o 14 mensilità cambiano le tasse?»

Non in questa proiezione annuale con la stessa RAL. Cambia solo la media. Ho evitato di etichettarla come cedolino ordinario perché i prelievi reali sono distribuiti in modo diverso nei mesi.

## Demo suggerita, circa 4 minuti

1. **35.000 €, 13 mensilità:** calcola; mostra 26.032,17 € annui, 2.002,47 € medi e 5.751,33 € di imposte. Apri l'IRPEF e ricostruisci il risultato.
2. **Passa a 14 mensilità:** indica l'avviso di input modificati, ricalcola e verifica l'annuale invariato.
3. **20.000 €:** mostra il bonus di 871,78 €, l'esenzione comunale e la separazione fra bonus e detrazioni.
4. **60.000 €:** mostra l'1% INPS solo sui 3.776 € eccedenti la soglia e la fine delle detrazioni.
5. **Input non valido:** dimostra che l'interfaccia rifiuta la RAL fuori perimetro senza inventare un risultato.
6. Apri fonti, metodologia e test. Concludi con il limite principale: non è un motore paghe multi-CCNL.

## Il passo successivo che consiglierei

**Validare questo stesso perimetro con un consulente del lavoro e casi campione di cedolini anonimizzati**, prima di aggiungere altre città o opzioni.

Verificherei gli scostamenti annuali, isolando contributi non modellati, arrotondamenti e calendario delle addizionali. Poi chiederei a pochi candidati di spiegare il risultato con parole proprie: capiscono la differenza fra media e cedolino? Sanno distinguere tasse da contributi?

Per una versione destinata alla produzione servirebbero regole fiscali versionate con decorrenze, una matrice contributiva per inquadramento e una suite di casi validati professionalmente. Aggiungere semplicemente più campi non renderebbe affidabile il modello.

## Checklist di pubblicazione

- Provare il calcolo e leggere la metodologia, non soltanto la schermata finale.
- Eseguire `npm test` e controllare i risultati effettivi in `docs/VERIFICA.md`.
- Pubblicare su un account personale autorizzato, non su infrastruttura aziendale.
- Verificare il link pubblico in una finestra senza autenticazione.
- Verificare che la demo corrisponda alla versione pubblicata nel repository.
