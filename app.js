(function () {
  'use strict';
  const calculator = window.NettoCalculator;
  const byId = function (id) { return document.getElementById(id); };
  const form = byId('salary-form');
  const ralInput = byId('ral');
  const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', useGrouping: 'always' });
  const integer = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 });
  const percent = new Intl.NumberFormat('it-IT', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const money = function (cents) { return euro.format(cents / 100); };
  let currentResult = null;
  let dirty = false;

  function text(id, value) { byId(id).textContent = value; }
  function selectedMonths() { return Number(form.querySelector('input[name="months"]:checked').value); }

  function clearError() {
    byId('ral-error').hidden = true;
    text('ral-error', '');
    ralInput.removeAttribute('aria-invalid');
  }

  function markDirty() {
    if (!currentResult) return;
    try {
      dirty = Math.round(calculator.parseRal(ralInput.value) * 100) !== currentResult.amounts.grossAnnual || selectedMonths() !== currentResult.months;
    } catch (_) { dirty = true; }
    byId('stale-warning').hidden = !dirty;
    byId('download-result').disabled = dirty;
    byId('print-result').disabled = dirty;
  }

  // No HTML strings: labels, notes and values are inserted as text nodes.
  function row(label, value, note, className) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ledger-row' + (className ? ' ' + className : '');
    const term = document.createElement('dt');
    term.textContent = label;
    if (note) {
      const small = document.createElement('small');
      small.textContent = note;
      term.appendChild(small);
    }
    const amount = document.createElement('dd');
    amount.textContent = value;
    wrapper.append(term, amount);
    return wrapper;
  }

  function bandLabel(band) {
    if (band.from === 0) return 'Fino a ' + integer.format(band.upTo / 100) + ' €';
    if (!Number.isFinite(band.upTo)) return 'Oltre ' + integer.format(band.from / 100) + ' €';
    return 'Oltre ' + integer.format(band.from / 100) + ' e fino a ' + integer.format(band.upTo / 100) + ' €';
  }

  function renderBands(id, bands) {
    byId(id).replaceChildren.apply(byId(id), bands.map(function (band) {
      const tr = document.createElement('tr');
      [bandLabel(band), decimal.format(band.bps / 100) + '%', money(band.taxable), money(band.tax)].forEach(function (value) {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });
      return tr;
    }));
  }

  function render(result) {
    const a = result.amounts;
    text('calculated-for', 'RAL ' + money(a.grossAnnual) + ' · ' + result.months + ' mensilità · Milano');
    text('net-monthly', money(a.netMonthly));
    text('monthly-context', money(a.netAnnual) + ' ÷ ' + result.months + ' mensilità');
    text('net-annual', money(a.netAnnual));
    text('legend-net', money(a.netAnnual));
    text('legend-inps', money(a.inpsTotal));
    text('legend-tax', money(a.taxTotal));
    const resources = a.grossAnnual + a.wedgeBonus;
    [['bar-net', a.netAnnual], ['bar-inps', a.inpsTotal], ['bar-tax', a.taxTotal]].forEach(function (item) {
      byId(item[0]).style.flex = String(item[1] / resources) + ' 1 0';
    });
    text('allocation-note', a.wedgeBonus > 0
      ? 'La barra ripartisce RAL + bonus non imponibile (' + money(resources) + '), non la sola RAL.'
      : 'La barra ripartisce l’intera RAL tra netto, contributi e imposte.');

    const ledgerRows = [
      row('Retribuzione annua lorda', money(a.grossAnnual), 'Incluse le mensilità aggiuntive'),
      row('Contributi INPS, quota IVS', '− ' + money(a.inpsOrdinary), '9,19% della RAL, ipotesi semplificata'),
      row('Contributo aggiuntivo INPS', '− ' + money(a.inpsAdditional), a.inpsAdditionalBase > 0 ? '1% su ' + money(a.inpsAdditionalBase) + ' oltre la soglia' : '1% sulla parte di RAL oltre 56.224 €'),
      row('Imponibile fiscale', money(a.taxableIncome), 'Subtotale: RAL meno contributi, non un’altra trattenuta', 'subtotal'),
      row('IRPEF netta', '− ' + money(a.netIrpef), 'Imposta lorda meno le detrazioni applicate'),
      row('Addizionale Lombardia', '− ' + money(a.regionalTax), 'Aliquote progressive dall’1,23% all’1,73%'),
      row('Addizionale Milano', '− ' + money(a.municipalTax), result.municipalExempt ? 'Esente: imponibile non superiore a 23.000 €' : '0,8% sull’intero imponibile fiscale'),
      row('Totale trattenute', '− ' + money(a.withholdingTotal), 'Riepilogo contributi + imposte, già sottratti sopra', 'subtotal'),
      row('Bonus cuneo fiscale', '+ ' + money(a.wedgeBonus), a.wedgeBonus > 0 ? '4,8% dell’imponibile: somma aggiunta, non tassata' : 'Nessun bonus in denaro sopra 20.000 € di imponibile', 'benefit'),
      row('Netto annuale', money(a.netAnnual), 'RAL − trattenute + eventuale bonus', 'net-row')
    ];
    byId('ledger').replaceChildren.apply(byId('ledger'), ledgerRows);
    text('tax-total', money(a.taxTotal));
    text('tax-rate', percent.format(result.effectiveTaxRate) + ' della RAL, esclusi i contributi');
    text('taxable-note', 'Le aliquote si applicano a ' + money(a.taxableIncome) + ' di imponibile, non alla RAL. Ogni aliquota tassa solo la propria fascia.');
    renderBands('irpef-brackets', result.irpefBrackets);
    renderBands('regional-brackets', result.regionalBrackets);
    byId('deductions').replaceChildren(
      row('IRPEF lorda', money(a.grossIrpef)),
      row('Detrazione lavoro dipendente', '− ' + money(a.employeeDeductionApplied)),
      row('Ulteriore detrazione cuneo fiscale', '− ' + money(a.wedgeDeductionApplied)),
      row('IRPEF netta dovuta', money(a.netIrpef), '', 'net-row')
    );
    text('deduction-note', 'Le detrazioni riducono l’imposta e sono già comprese nell’IRPEF netta. Non vanno sottratte una seconda volta. L’eventuale maggiorazione di 65 € è inclusa nella detrazione da lavoro.');
    text('municipal-note', result.municipalExempt
      ? 'Milano: nessuna addizionale comunale fino a 23.000 € di imponibile, inclusi. La regionale resta dovuta.'
      : 'Milano: ' + money(a.taxableIncome) + ' × 0,8% = ' + money(a.municipalTax) + '. Superati 23.000 €, si tassa l’intero imponibile, non soltanto l’eccedenza.');
    byId('empty-state').hidden = true;
    byId('result-content').hidden = false;
    byId('stale-warning').hidden = true;
    byId('download-result').disabled = false;
    byId('print-result').disabled = false;
    document.querySelector('.results-panel').setAttribute('aria-label', 'Risultato della proiezione annuale');
    document.querySelector('.results-panel').removeAttribute('aria-labelledby');
    text('announcer', 'Calcolo completato. Netto annuale ' + money(a.netAnnual) + '. Media su ' + result.months + ' mensilità: ' + money(a.netMonthly) + '. Imposte annue: ' + money(a.taxTotal) + '.');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearError();
    try {
      currentResult = calculator.calculateSalary({ ral: calculator.parseRal(ralInput.value), months: selectedMonths() });
      dirty = false;
      render(currentResult);
      if (window.matchMedia('(max-width: 860px)').matches) {
        const heading = document.querySelector('.metric-label');
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
        document.querySelector('.results-panel').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      }
    } catch (error) {
      text('ral-error', error.message);
      byId('ral-error').hidden = false;
      ralInput.setAttribute('aria-invalid', 'true');
      markDirty();
      ralInput.focus();
    }
  });

  ralInput.addEventListener('input', function () { clearError(); markDirty(); });
  form.querySelectorAll('input[name="months"]').forEach(function (input) { input.addEventListener('change', markDirty); });
  document.querySelectorAll('[data-ral]').forEach(function (button) {
    button.addEventListener('click', function () {
      ralInput.value = integer.format(Number(button.dataset.ral));
      clearError();
      markDirty();
    });
  });

  function report(result) {
    const a = result.amounts;
    const lines = [
      'IN CHIARO | Proiezione RAL -> netto 2026',
      'Milano, Lombardia | Tempo indeterminato | 365 giorni',
      'Mensilità: ' + result.months,
      '',
      'RAL: ' + money(a.grossAnnual),
      '- INPS ordinaria (9,19%): ' + money(a.inpsOrdinary),
      '- INPS aggiuntiva (1% oltre 56.224 euro): ' + money(a.inpsAdditional),
      '= Imponibile fiscale: ' + money(a.taxableIncome),
      '',
      'IRPEF lorda: ' + money(a.grossIrpef),
      '- Detrazione lavoro dipendente: ' + money(a.employeeDeductionApplied),
      '- Ulteriore detrazione cuneo fiscale: ' + money(a.wedgeDeductionApplied),
      '= IRPEF netta: ' + money(a.netIrpef),
      '+ Addizionale Lombardia: ' + money(a.regionalTax),
      '+ Addizionale Milano: ' + money(a.municipalTax),
      '= Totale imposte: ' + money(a.taxTotal),
      'Totale trattenute (INPS + imposte): ' + money(a.withholdingTotal),
      'Bonus non imponibile cuneo fiscale: ' + money(a.wedgeBonus),
      '',
      'NETTO ANNUALE: ' + money(a.netAnnual),
      'NETTO MEDIO SU ' + result.months + ' MENSILITÀ: ' + money(a.netMonthly),
      'RAL - contributi - imposte + bonus = netto annuale.',
      '',
      'IRPEF PER SCAGLIONE'
    ];
    result.irpefBrackets.forEach(function (band) { lines.push(bandLabel(band) + ': ' + money(band.taxable) + ' × ' + decimal.format(band.bps / 100) + '% = ' + money(band.tax)); });
    lines.push('', 'ADDIZIONALE LOMBARDIA PER SCAGLIONE');
    result.regionalBrackets.forEach(function (band) { lines.push(bandLabel(band) + ': ' + money(band.taxable) + ' × ' + decimal.format(band.bps / 100) + '% = ' + money(band.tax)); });
    lines.push('', 'LIMITI',
      'Stima annuale, non cedolino né consulenza fiscale. Nessun altro reddito, familiare a carico o onere detraibile.',
      'INPS semplificata: non include FIS/CIGS/fondi contrattuali. Esclusi TFR, premi, benefit e costo datore.',
      'RAL supportata: 20.000-100.000 euro. Addizionali per competenza, non calendario di acconti e saldi.',
      'Netto mensile = media: tredicesima, quattordicesima e singoli cedolini possono differire.',
      'Arrotondamenti al centesimo per voce; rapporti art. 13 TUIR troncati alla quarta cifra decimale.',
      '', 'FONTI (ricerca 9 settembre 2026)');
    document.querySelectorAll('.source-list a').forEach(function (link) { lines.push(link.querySelector('strong').textContent + ': ' + link.href); });
    lines.push('', 'Proiezione semplificata della retribuzione netta. Non sostituisce una consulenza fiscale.');
    return lines.join('\r\n');
  }

  byId('download-result').addEventListener('click', function () {
    if (!currentResult || dirty) return;
    const blob = new Blob(['\uFEFF', report(currentResult)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'in-chiaro-2026-ral-' + String(currentResult.amounts.grossAnnual / 100).replace('.', '-') + '.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Let the browser consume the Blob before releasing it.
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });
  byId('print-result').addEventListener('click', function () { if (currentResult && !dirty) window.print(); });
})();
