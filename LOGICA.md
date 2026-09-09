# Logica del prototipo — RAL → netto 2026

Il codice in `engine.js` implementa esattamente quanto descritto qui. Se una regola è semplificata, è scritta in chiaro.

## Caso coperto

- Dipendente impiegato, tempo indeterminato, anno intero
- Residenza Milano (addizionale comunale Milano + addizionale regionale Lombardia)
- Nessuna agevolazione: no carichi di famiglia, no oneri deducibili, no welfare, no sgravi, no premio di risultato
- Iscrizione previdenziale dopo il 31/12/1995 (si applica il massimale INPS)
- La RAL include la tredicesima. Il TFR non entra nel calcolo: è accantonamento del datore, non una trattenuta dal lordo.

## Pipeline

RAL → INPS dipendente → imponibile = RAL − INPS → IRPEF lorda per scaglioni → meno detrazioni → IRPEF netta → più addizionale regionale → più addizionale comunale → più TI / somma esente → netto annuale → mensile /13 e /12

## 1. INPS a carico del dipendente

- IVS dipendente: **9,19 %** sulla retribuzione imponibile (FPLD impiegati)
- Contributo aggiuntivo **1 %** sulla quota oltre **56.224 €** (circolare INPS n. 6/2026)
- Massimale contributivo: **122.295 €** (art. 2 c. 18 L. 335/1995)

Semplificazione: non applico CIGS 0,30 %, fondi di solidarietà di categoria né contribuzioni minori da CCNL. L’INPS del datore (~23–24 %) non entra nel netto del dipendente.

## 2. Imponibile fiscale

imponibile = RAL − INPS dipendente. Se la RAL supera il massimale, l’INPS si ferma e l’IRPEF continua sull’eccedenza.

## 3. IRPEF 2026

L. 199/2025, art. 11 TUIR:

- fino a 28.000 € → 23 %
- 28.001–50.000 € → **33 %** (era 35 % nel 2025)
- oltre 50.000 € → 43 %

Progressiva, non sul totale.

## 4. Detrazione lavoro dipendente (art. 13 TUIR)

Anno intero, 365 giorni.

- ≤ 15.000: 1.955 € (minimo 690 € TI)
- 15.001–28.000: 1.910 + 1.190 × (28.000 − RC) / 13.000
- 28.001–50.000: 1.910 × (50.000 − RC) / 22.000
- oltre 50.000: 0

Più +65 € se RC tra 25.001 e 35.000.
Più ulteriore detrazione cuneo (L. 207/2024):
- 1.000 € se 20.000 < RC ≤ 32.000
- 1.000 × (40.000 − RC) / 8.000 se 32.000 < RC ≤ 40.000

IRPEF netta = max(0, lorda − detrazioni).

## 5. Addizionale regionale Lombardia

Art. 72 l.r. 10/2003:
- 0–15.000 → 1,23 %
- 15.001–28.000 → 1,58 %
- 28.001–50.000 → 1,72 %
- oltre 50.000 → 1,73 %

## 6. Addizionale comunale Milano

0,80 % sull’intero imponibile se supera 23.000 €; altrimenti esente.

## 7. Trattamento integrativo

- RC ≤ 15.000 e IRPEF lorda > detrazione lavoro − 75 € → 1.200 €
- RC > 15.000 → 0 in questo prototipo (nella fascia 15–28k il TI dipende da un paniere di detrazioni assenti nel caso standard)

## 8. Somma esente taglio cuneo

Solo se RC ≤ 20.000:
- ≤ 8.500 → 7,1 %
- 8.501–15.000 → 5,3 %
- 15.001–20.000 → 4,8 %

## 9. Mensile

/13 = 12 mensilità + tredicesima. /12 = cassa annuale divisa 12. Niente simulazione mese per mese.

## Cosa manca di proposito

Carichi familiari, AUU, oneri, altri comuni, CCNL, straordinari, fringe, TFR, costo azienda, part-time, esoneri territoriali. Prima estensione naturale: parametro regione/comune + checkbox agevolazioni.
