'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateSalary: calculate, parseRal, RULES } = require('../calc.js');
const calc = (ral, months = 13) => calculate({ ral, months });

// Full fixtures also verified independently with Python Decimal, not obtained
// by importing helper functions from the engine. Amounts are integer cents.
test('RAL 35.000: esempio completo, scaglione 33%, detrazioni e Milano', () => {
  const a = calc(35000).amounts;
  assert.deepEqual(a, {
    grossAnnual: 3500000,
    inpsOrdinary: 321650,
    inpsAdditionalBase: 0,
    inpsAdditional: 0,
    inpsTotal: 321650,
    taxableIncome: 3178350,
    grossIrpef: 768856,
    employeeDeductionAllowed: 164648,
    employeeDeductionApplied: 164648,
    wedgeDeductionAllowed: 100000,
    wedgeDeductionApplied: 100000,
    netIrpef: 504208,
    regionalTax: 45498,
    municipalTax: 25427,
    taxTotal: 575133,
    withholdingTotal: 896783,
    wedgeBonus: 0,
    netAnnual: 2603217,
    netMonthly: 200247,
    calendarMonthly: 216935
  });
});

test('RAL 20.000: bonus 4,8% del reddito fiscale, non della RAL', () => {
  const a = calc(20000).amounts;
  assert.equal(a.taxableIncome, 1816200);
  assert.equal(a.grossIrpef, 417726);
  assert.equal(a.employeeDeductionApplied, 281047);
  assert.equal(a.wedgeBonus, 87178);
  assert.equal(a.wedgeDeductionApplied, 0);
  assert.equal(a.municipalTax, 0);
  assert.equal(a.taxTotal, 160125);
  assert.equal(a.netAnnual, 1743253);
  assert.equal(a.netMonthly, 134096);
});

test('RAL 40.000: ulteriore detrazione decrescente e niente maggiorazione 65', () => {
  const a = calc(40000).amounts;
  assert.equal(a.taxableIncome, 3632400);
  assert.equal(a.employeeDeductionApplied, 118726);
  assert.equal(a.wedgeDeductionApplied, 45950);
  assert.equal(a.netIrpef, 754016);
  assert.equal(a.regionalTax, 53307);
  assert.equal(a.municipalTax, 29059);
  assert.equal(a.netAnnual, 2796018);
});

test('RAL 60.000: contributo INPS aggiuntivo e scaglione IRPEF 43%', () => {
  const result = calc(60000);
  const a = result.amounts;
  assert.equal(a.inpsAdditional, 3776);
  assert.equal(a.inpsTotal, 555176);
  assert.equal(a.taxableIncome, 5444824);
  assert.equal(a.grossIrpef, 1561274);
  assert.equal(a.employeeDeductionApplied, 0);
  assert.equal(a.wedgeDeductionApplied, 0);
  assert.equal(result.irpefBrackets[2].bps, 4300);
  assert.equal(result.irpefBrackets[2].taxable, 444824);
  assert.equal(a.netAnnual, 3755466);
});

test('12, 13, 14 mensilità: le imposte e il netto annuale non cambiano', () => {
  const a = calc(35000, 12).amounts;
  const b = calc(35000, 13).amounts;
  const c = calc(35000, 14).amounts;
  assert.equal(a.netAnnual, b.netAnnual);
  assert.equal(b.netAnnual, c.netAnnual);
  assert.equal(a.taxTotal, c.taxTotal);
  assert.equal(a.netMonthly, 216935);
  assert.equal(b.netMonthly, 200247);
  assert.equal(c.netMonthly, 185944);
  assert.equal(c.calendarMonthly, a.netMonthly);
});

test('il default è 13 mensilità', () => assert.equal(calculate({ ral: 35000 }).months, 13));

// Invert only the observed public taxableIncome output. This is a binary search
// over valid cent RALs, not a copy of the threshold logic under test.
function atIncome(targetCents) {
  let low = RULES.minRal * 100;
  let high = RULES.maxRal * 100;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (calc(mid / 100).amounts.taxableIncome < targetCents) low = mid + 1;
    else high = mid;
  }
  const result = calc(low / 100);
  assert.equal(result.amounts.taxableIncome, targetCents, 'target taxable income must be exact');
  return result;
}

test('imponibile 20.000: bonus incluso alla soglia, detrazione dal centesimo dopo', () => {
  const before = atIncome(1999999).amounts;
  const at = atIncome(2000000).amounts;
  const after = atIncome(2000001).amounts;
  assert.ok(before.wedgeBonus > 0);
  assert.equal(at.wedgeBonus, 96000);
  assert.equal(at.wedgeDeductionApplied, 0);
  assert.equal(after.wedgeBonus, 0);
  assert.equal(after.wedgeDeductionApplied, 100000);
});

test('Milano 23.000: esenzione inclusiva; sopra si tassa l’intero imponibile', () => {
  const before = atIncome(2299999);
  const at = atIncome(2300000);
  const after = atIncome(2300001);
  assert.equal(before.amounts.municipalTax, 0);
  assert.equal(at.amounts.municipalTax, 0);
  assert.equal(at.municipalExempt, true);
  assert.equal(after.municipalExempt, false);
  assert.equal(after.amounts.municipalTax, 18400);
  assert.ok(after.amounts.netAnnual < at.amounts.netAnnual, 'real exemption cliff, not monotonicity bug');
});

test('25.000 e 35.000: limiti stretti della maggiorazione detrazione di 65 euro', () => {
  const at25 = atIncome(2500000).amounts;
  const over25 = atIncome(2500001).amounts;
  assert.equal(at25.employeeDeductionApplied, 218453);
  assert.equal(over25.employeeDeductionApplied, 224953);
  const at35 = atIncome(3500000).amounts;
  const over35 = atIncome(3500001).amounts;
  assert.equal(at35.employeeDeductionApplied, 136724);
  assert.equal(over35.employeeDeductionApplied, 130224);
});

test('28.000: primo scaglione IRPEF e passaggio formula detrazione', () => {
  const at = atIncome(2800000);
  const above = atIncome(2800100);
  assert.equal(at.amounts.grossIrpef, 644000);
  assert.equal(at.amounts.employeeDeductionApplied, 197500);
  assert.equal(at.irpefBrackets[1].taxable, 0);
  assert.equal(above.irpefBrackets[1].taxable, 100);
  assert.equal(above.irpefBrackets[1].tax, 33);
  assert.equal(above.amounts.grossIrpef, 644033);
});

test('32.000: intera detrazione, poi decremento lineare senza troncamento art.13', () => {
  assert.equal(atIncome(3199999).amounts.wedgeDeductionAllowed, 100000);
  assert.equal(atIncome(3200000).amounts.wedgeDeductionAllowed, 100000);
  assert.equal(atIncome(3200010).amounts.wedgeDeductionAllowed, 99999);
  assert.equal(atIncome(3600000).amounts.wedgeDeductionAllowed, 50000);
});

test('40.000: detrazione cuneo si azzera; la detrazione lavoro resta', () => {
  assert.equal(atIncome(3999990).amounts.wedgeDeductionApplied, 1);
  const at = atIncome(4000000).amounts;
  assert.equal(at.wedgeDeductionApplied, 0);
  assert.equal(at.wedgeBonus, 0);
  assert.ok(at.employeeDeductionApplied > 0);
  assert.equal(atIncome(4000001).amounts.wedgeDeductionApplied, 0);
});

test('50.000: fine detrazione lavoro e cambio scaglioni nazionale/regionale', () => {
  const at = atIncome(5000000);
  const above = atIncome(5000100);
  assert.equal(at.amounts.employeeDeductionApplied, 0);
  assert.equal(at.amounts.grossIrpef, 1370000);
  assert.equal(at.amounts.regionalTax, 76830);
  assert.equal(above.irpefBrackets[2].tax, 43);
  assert.equal(above.regionalBrackets[3].bps, 173);
  assert.equal(above.regionalBrackets[3].taxable, 100);
});

test('INPS 56.224: 1% solo sulla quota eccedente, mai su tutta la RAL', () => {
  assert.equal(calc(56223.99).amounts.inpsAdditional, 0);
  assert.equal(calc(56224).amounts.inpsAdditional, 0);
  assert.equal(calc(56225).amounts.inpsAdditional, 1);
  assert.equal(calc(57224).amounts.inpsAdditional, 1000);
});

test('le aliquote IRPEF sono progressive, non la massima su tutto il reddito', () => {
  const result = atIncome(4000000);
  assert.equal(result.amounts.grossIrpef, 1040000);
  assert.equal(result.irpefBrackets[0].tax, 644000);
  assert.equal(result.irpefBrackets[1].tax, 396000);
  assert.equal(result.irpefBrackets[2].tax, 0);
});

test('centesimi e estremi intervallo accettati', () => {
  assert.equal(calc(35000.50).amounts.grossAnnual, 3500050);
  assert.equal(calc(20000).amounts.grossAnnual, 2000000);
  assert.equal(calc(100000).amounts.grossAnnual, 10000000);
});

test('validazione input numerici, mancanti, non finiti, limiti e mensilità', () => {
  [undefined, null, '35000', NaN, Infinity, -Infinity, {}, true].forEach(ral => assert.throws(() => calc(ral)));
  [-1, 0, 19999.99, 100000.01, 35000.001].forEach(ral => assert.throws(() => calc(ral), RangeError));
  [0, -1, 11, 15, 12.5, '13', null].forEach(months => assert.throws(() => calc(35000, months), RangeError));
  assert.throws(() => calculate(), TypeError);
  assert.throws(() => calculate(null), TypeError);
});

test('parser italiano accetta separatori espliciti e centesimi', () => {
  assert.equal(parseRal('35.000'), 35000);
  assert.equal(parseRal('35000'), 35000);
  assert.equal(parseRal(' 35.000,50 '), 35000.5);
  assert.equal(parseRal('35000,5'), 35000.5);
  assert.equal(parseRal('100.000,00'), 100000);
});

test('parser rifiuta input ambigui, HTML, notazione scientifica e più di 2 decimali', () => {
  ['', ' ', 'abc', '<img src=x onerror=alert(1)>', '35k', '3e4', '35,000', '35000.50', '35.00', '35.000,501', '-35000', 'Infinity', '35 000', '€35000'].forEach(input => assert.throws(() => parseRal(input)));
});

test('invarianti per 8.001 RAL: quadratura al centesimo e nessun importo non finito', () => {
  for (let ral = 20000; ral <= 100000; ral += 10) {
    const result = calc(ral);
    const a = result.amounts;
    for (const value of Object.values(a)) {
      assert.ok(Number.isSafeInteger(value));
      assert.ok(value >= 0);
    }
    assert.equal(a.taxableIncome, a.grossAnnual - a.inpsTotal);
    assert.equal(a.inpsTotal, a.inpsOrdinary + a.inpsAdditional);
    assert.equal(a.netIrpef, a.grossIrpef - a.employeeDeductionApplied - a.wedgeDeductionApplied);
    assert.equal(a.taxTotal, a.netIrpef + a.regionalTax + a.municipalTax);
    assert.equal(a.withholdingTotal, a.inpsTotal + a.taxTotal);
    assert.equal(a.netAnnual, a.grossAnnual - a.withholdingTotal + a.wedgeBonus);
    assert.equal(a.grossIrpef, result.irpefBrackets.reduce((sum, band) => sum + band.tax, 0));
    assert.equal(a.regionalTax, result.regionalBrackets.reduce((sum, band) => sum + band.tax, 0));
    assert.ok(!(a.wedgeBonus > 0 && a.wedgeDeductionApplied > 0));
    assert.ok(a.netAnnual > 0 && a.netAnnual < a.grossAnnual);
  }
});

test('nessuna mutazione tra calcoli e regole non modificabili', () => {
  const options = Object.freeze({ ral: 35000, months: 13 });
  const first = calculate(options);
  first.amounts.netAnnual = 1;
  assert.equal(calculate(options).amounts.netAnnual, 2603217);
  assert.throws(() => { RULES.irpef[1].bps = 3500; }, TypeError);
});
