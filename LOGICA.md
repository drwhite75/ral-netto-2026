# Logica del calcolatore RAL → netto 2026

La metodologia della versione attuale è in [docs/METODOLOGIA.md](docs/METODOLOGIA.md): formule, fonti primarie, arrotondamenti, esempi e limiti.

Il motore attuale è [`calc.js`](calc.js), separato dall'interfaccia [`app.js`](app.js). I test sono in [`tests/calc.test.cjs`](tests/calc.test.cjs) e [`tests/browser.test.cjs`](tests/browser.test.cjs).

## Perimetro attuale

Milano, anno dei redditi 2026, impiegato privato a tempo indeterminato per 365 giorni, senza altri redditi o oneri personali. RAL tra **20.000 e 100.000 €**, con **12, 13 o 14 mensilità**. Il netto mensile è una media, non un cedolino.

Questa versione sostituisce il precedente `engine.js` e i test di base `test.js`; la versione precedente resta nella cronologia Git. Il range esplicito evita di promettere copertura dei redditi bassi, dei minimali e del massimale INPS.

- [Guida al progetto](README.md)
- [Scelte di prodotto](docs/SCELTE-PRODOTTO.md)
- [Verifiche eseguite](docs/VERIFICA.md)
