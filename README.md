# Calcolatore netto da RAL 2026

Pagina web che, data una **RAL**, stima **netto annuale**, **netto mensile** e le **voci trattenute dal lordo**.

## Sito e codice

- Repo: https://github.com/drwhite75/ral-netto-2026
- Pagina live (GitHub Pages, se attiva): https://drwhite75.github.io/ral-netto-2026/
- Logica: https://github.com/drwhite75/ral-netto-2026/blob/main/LOGICA.md

## Perché esiste

Simulatore per un caso semplice e standard, con formule e semplificazioni documentate.

Caso standard:
- impiegato a tempo indeterminato
- vive a Milano
- nessuna agevolazione particolare

## Come è fatto

| File | Ruolo |
|---|---|
| `engine.js` | Motore puro: RAL → risultato |
| `app.js` | Form e tabelle |
| `index.html` / `styles.css` | Interfaccia |
| `LOGICA.md` | Regole 2026, fonti, semplificazioni |
| `test.js` | Controlli numerici |

1. Togliere l’INPS del dipendente dalla RAL
2. IRPEF 2026 per scaglioni (23 / 33 / 43)
3. Detrazioni lavoro + cuneo
4. Addizionale Lombardia + addizionale Milano
5. Eventuale trattamento integrativo / somma esente
6. Netto /13 e /12

