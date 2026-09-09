'use strict';
/* Optional E2E tests. See README. Only the test runner needs Playwright;
 * the website itself has no dependencies. An isolated browser is used.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:8791/';
const output = process.env.TEST_OUTPUT || path.join(__dirname, '..', 'test-results');
const launchOptions = { headless: true };
if (process.env.BROWSER_EXECUTABLE) launchOptions.executablePath = process.env.BROWSER_EXECUTABLE;
const normalize = value => value.replace(/[\s\u00a0\u202f]/g, '');

(async function () {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch(launchOptions);
  const errors = [];
  const externalRequests = [];
  const checks = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, reducedMotion: 'reduce', acceptDownloads: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(base).origin) externalRequests.push(request.url());
  });
  const check = (name, predicate) => { assert.ok(predicate, name); checks.push(name); };
  const moneyText = async selector => normalize(await page.locator(selector).innerText());
  async function calculate(ral) {
    await page.locator('#ral').fill(ral);
    await page.getByRole('button', { name: 'Calcola il netto', exact: true }).click();
  }
  try {
    await page.goto(base, { waitUntil: 'networkidle' });
    check('stato iniziale senza risultati fittizi', await page.locator('#empty-state').isVisible() && !(await page.locator('#result-content').isVisible()));
    await page.screenshot({ path: path.join(output, 'desktop-iniziale.png'), fullPage: false });
    await page.getByRole('button', { name: 'Calcola il netto', exact: true }).click();
    check('netto annuale RAL35000', await moneyText('#net-annual') === '26.032,17€');
    check('netto mensile su13', await moneyText('#net-monthly') === '2.002,47€');
    check('nessun avviso obsoleto al primo calcolo', !(await page.locator('#stale-warning').isVisible()));
    check('10 righe lordo-netto renderizzate', await page.locator('#ledger .ledger-row').count() === 10);
    await page.locator('.results-panel').screenshot({ path: path.join(output, 'desktop-risultato.png') });
    await page.screenshot({ path: path.join(output, 'desktop-pagina.png'), fullPage: true });
    await page.locator('.irpef-details summary').click();
    check('dettaglio IRPEF con33%', (await page.locator('#irpef-brackets').innerText()).includes('33%'));
    check('detrazione ordinaria visibile', (await page.locator('#deductions').innerText()).includes('1.646,48'));
    await page.locator('.regional-details summary').click();
    check('quattro scaglioni Lombardia', await page.locator('#regional-brackets tr').count() === 4);

    await page.locator('input[name="months"][value="14"]').check();
    check('modifica mensilità marca il risultato obsoleto', await page.locator('#stale-warning').isVisible());
    check('export disabilitato con input modificati', await page.locator('#download-result').isDisabled());
    await page.getByRole('button', { name: 'Calcola il netto', exact: true }).click();
    check('netto annuale invariato con14', await moneyText('#net-annual') === '26.032,17€');
    check('mensile su14', await moneyText('#net-monthly') === '1.859,44€');
    await page.locator('input[name="months"][value="12"]').check();
    await page.getByRole('button', { name: 'Calcola il netto', exact: true }).click();
    check('mensile su12', await moneyText('#net-monthly') === '2.169,35€');

    for (const input of ['', 'testo', '-1', '19.999', '100.001', '35,000', '<img src=x onerror=alert(1)>']) {
      await calculate(input);
      check('errore visibile per ' + JSON.stringify(input), await page.locator('#ral-error').isVisible());
      check('aria-invalid per ' + JSON.stringify(input), await page.locator('#ral').getAttribute('aria-invalid') === 'true');
      check('nessun NaN nel risultato dopo input invalido', !(await page.locator('#result-content').innerText()).includes('NaN'));
    }
    await calculate('35.000,50');
    check('centesimi accettati e vecchio errore cancellato', !(await page.locator('#ral-error').isVisible()));
    await page.getByRole('button', { name: '25.000 €', exact: true }).click();
    check('preset modifica input senza calcolare di nascosto', await page.locator('#ral').inputValue() === '25.000' && await page.locator('#stale-warning').isVisible());
    await page.locator('#ral').press('Enter');
    check('invio da tastiera calcola', await moneyText('#net-annual') === '20.569,65€');
    await calculate('20.000');
    check('bonus monetario esposto', (await page.locator('#ledger').innerText()).includes('871,78'));
    check('barra normalizzata su RAL più bonus', (await page.locator('#allocation-note').innerText()).includes('RAL + bonus'));
    const bonusDownload = page.waitForEvent('download');
    await page.locator('#download-result').click();
    const download = await bonusDownload;
    const downloadPath = path.join(output, download.suggestedFilename());
    await download.saveAs(downloadPath);
    const exported = fs.readFileSync(downloadPath, 'utf8');
    check('export TXT include bonus e fonti', exported.includes('871,78') && exported.includes('FONTI') && exported.includes('17.432,53'));
    await page.emulateMedia({ media: 'print' });
    check('stampa nasconde il form', !(await page.locator('#salary-form').isVisible()));
    check('stampa conserva netto e scenario', await page.locator('#net-annual').isVisible() && await page.locator('#calculated-for').isVisible());
    await page.pdf({ path: path.join(output, 'riepilogo.pdf'), format: 'A4', printBackground: true });
    await page.emulateMedia({ media: 'screen' });

    await page.locator('input[name="months"][value="13"]').check();
    await calculate('35.000');
    for (const width of [320, 375, 390, 560, 768, 860, 900, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      check('nessun overflow orizzontale viewport ' + width, !overflow);
      check('risultato visibile viewport ' + width, await page.locator('#net-monthly').isVisible());
      if ([375, 390, 1024].includes(width)) {
        await page.locator('.results-panel').screenshot({ path: path.join(output, 'risultato-' + width + '.png') });
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.irpef-details summary').click();
    await page.locator('.regional-details summary').click();
    await calculate('100.000');
    check('RAL massima su mobile', await moneyText('#net-annual') === '57.122,46€');
    check('focus sul risultato mobile', await page.evaluate(() => document.activeElement.classList.contains('metric-label')));
    check('nessun overflow con RAL massima', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator('.results-panel').screenshot({ path: path.join(output, 'mobile-risultato.png') });

    const offline = await browser.newContext({ offline: true });
    const offlinePage = await offline.newPage();
    await offlinePage.goto(pathToFileURL(path.join(__dirname, '..', 'index.html')).href);
    await offlinePage.getByRole('button', { name: 'Calcola il netto', exact: true }).click();
    check('funziona da file locale e senza rete', normalize(await offlinePage.locator('#net-annual').innerText()) === '26.032,17€');
    await offline.close();
    check('nessuna richiesta a domini terzi durante il calcolo', externalRequests.length === 0);
    check('nessun errore JavaScript', errors.length === 0);
    const summary = { passed: checks.length, failed: 0, checks, errors, externalRequests };
    fs.writeFileSync(path.join(output, 'browser-summary.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
