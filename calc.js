/*
 * Motore RAL -> netto, scenario Milano 2026.
 * Nessuna dipendenza dal DOM, dalla rete o dall'orologio.
 * Importi interni e output in centesimi; aliquote in punti base.
 * Fonti, perimetro e arrotondamenti: docs/METODOLOGIA.md.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NettoCalculator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RULES = Object.freeze({
    year: 2026,
    minRal: 20000,
    maxRal: 100000,
    months: Object.freeze([12, 13, 14]),
    employeeInpsBps: 919,
    extraInpsBps: 100,
    extraInpsThreshold: 5622400,
    municipalBps: 80,
    municipalExemption: 2300000,
    irpef: Object.freeze([
      Object.freeze({ upTo: 2800000, bps: 2300 }),
      Object.freeze({ upTo: 5000000, bps: 3300 }),
      Object.freeze({ upTo: Infinity, bps: 4300 })
    ]),
    regional: Object.freeze([
      Object.freeze({ upTo: 1500000, bps: 123 }),
      Object.freeze({ upTo: 2800000, bps: 158 }),
      Object.freeze({ upTo: 5000000, bps: 172 }),
      Object.freeze({ upTo: Infinity, bps: 173 })
    ])
  });

  // Round half up, using integers only. All values in this model are positive.
  function roundRatio(numerator, denominator) {
    return Math.floor((numerator + denominator / 2) / denominator);
  }

  function percentage(cents, bps) {
    return roundRatio(cents * bps, 10000);
  }

  function parseRal(text) {
    if (typeof text !== 'string' || text.trim() === '') {
      throw new Error('Inserisci la tua RAL annuale.');
    }
    const input = text.trim();
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(input)) {
      throw new Error('Usa il formato italiano, per esempio 35.000 oppure 35000,50.');
    }
    const value = Number(input.replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(value)) throw new Error('Inserisci un importo valido.');
    return value;
  }

  function validateInput(ral, months) {
    if (typeof ral !== 'number' || !Number.isFinite(ral)) {
      throw new TypeError('La RAL deve essere un numero finito.');
    }
    if (ral < RULES.minRal || ral > RULES.maxRal) {
      throw new RangeError('Questo prototipo supporta RAL da 20.000 a 100.000 euro.');
    }
    if (Math.abs(ral * 100 - Math.round(ral * 100)) > 0.000001) {
      throw new RangeError('Inserisci al massimo due cifre decimali.');
    }
    if (!RULES.months.includes(months)) {
      throw new RangeError('Scegli 12, 13 oppure 14 mensilità.');
    }
  }

  function progressiveTax(income, brackets) {
    let lower = 0;
    const rows = brackets.map(function (bracket) {
      const taxable = Math.max(0, Math.min(income, bracket.upTo) - lower);
      const row = {
        from: lower,
        upTo: bracket.upTo,
        bps: bracket.bps,
        taxable: taxable,
        tax: percentage(taxable, bracket.bps)
      };
      lower = bracket.upTo;
      return row;
    });
    return { total: rows.reduce(function (sum, row) { return sum + row.tax; }, 0), rows: rows };
  }

  function employmentDeduction(income) {
    let deduction = 0;
    if (income <= 1500000) deduction = 195500;
    else if (income <= 2800000) {
      const ratio = Math.floor((2800000 - income) * 10000 / 1300000);
      deduction = 191000 + roundRatio(119000 * ratio, 10000);
    } else if (income <= 5000000) {
      const ratio = Math.floor((5000000 - income) * 10000 / 2200000);
      deduction = roundRatio(191000 * ratio, 10000);
    }
    if (income > 2500000 && income <= 3500000) deduction += 6500;
    return deduction;
  }

  function fiscalWedge(income) {
    // RAL minima 20k => reddito fiscale minimo 18.162 euro: solo fascia bonus 4,8%.
    if (income <= 2000000) return { bonus: percentage(income, 480), deduction: 0 };
    if (income <= 3200000) return { bonus: 0, deduction: 100000 };
    if (income < 4000000) {
      return { bonus: 0, deduction: roundRatio(100000 * (4000000 - income), 800000) };
    }
    return { bonus: 0, deduction: 0 };
  }

  function calculateSalary(options) {
    if (!options || typeof options !== 'object') throw new TypeError('Inserisci RAL e mensilità.');
    const ral = options.ral;
    const months = options.months === undefined ? 13 : options.months;
    validateInput(ral, months);
    const grossAnnual = Math.round(ral * 100);
    const inpsOrdinary = percentage(grossAnnual, RULES.employeeInpsBps);
    const inpsAdditionalBase = Math.max(0, grossAnnual - RULES.extraInpsThreshold);
    const inpsAdditional = percentage(inpsAdditionalBase, RULES.extraInpsBps);
    const inpsTotal = inpsOrdinary + inpsAdditional;
    const taxableIncome = grossAnnual - inpsTotal;
    const irpef = progressiveTax(taxableIncome, RULES.irpef);
    const employeeDeductionAllowed = employmentDeduction(taxableIncome);
    const employeeDeductionApplied = Math.min(irpef.total, employeeDeductionAllowed);
    const wedge = fiscalWedge(taxableIncome);
    const wedgeDeductionApplied = Math.min(irpef.total - employeeDeductionApplied, wedge.deduction);
    const netIrpef = Math.max(0, irpef.total - employeeDeductionApplied - wedgeDeductionApplied);
    const regional = progressiveTax(taxableIncome, RULES.regional);
    const regionalTax = netIrpef > 0 ? regional.total : 0;
    const municipalExempt = taxableIncome <= RULES.municipalExemption || netIrpef === 0;
    // La soglia comunale e' una esenzione, non una franchigia.
    const municipalTax = municipalExempt ? 0 : percentage(taxableIncome, RULES.municipalBps);
    const taxTotal = netIrpef + regionalTax + municipalTax;
    const withholdingTotal = inpsTotal + taxTotal;
    // Il bonus non riduce l'imponibile: e' una somma non imponibile aggiunta al netto.
    const netAnnual = grossAnnual - withholdingTotal + wedge.bonus;

    return {
      year: RULES.year,
      months: months,
      amounts: {
        grossAnnual: grossAnnual,
        inpsOrdinary: inpsOrdinary,
        inpsAdditionalBase: inpsAdditionalBase,
        inpsAdditional: inpsAdditional,
        inpsTotal: inpsTotal,
        taxableIncome: taxableIncome,
        grossIrpef: irpef.total,
        employeeDeductionAllowed: employeeDeductionAllowed,
        employeeDeductionApplied: employeeDeductionApplied,
        wedgeDeductionAllowed: wedge.deduction,
        wedgeDeductionApplied: wedgeDeductionApplied,
        netIrpef: netIrpef,
        regionalTax: regionalTax,
        municipalTax: municipalTax,
        taxTotal: taxTotal,
        withholdingTotal: withholdingTotal,
        wedgeBonus: wedge.bonus,
        netAnnual: netAnnual,
        netMonthly: roundRatio(netAnnual, months),
        calendarMonthly: roundRatio(netAnnual, 12)
      },
      municipalExempt: municipalExempt,
      irpefBrackets: irpef.rows,
      regionalBrackets: regional.rows,
      effectiveTaxRate: taxTotal / grossAnnual,
      effectiveWithholdingRate: withholdingTotal / grossAnnual
    };
  }

  return Object.freeze({ RULES: RULES, parseRal: parseRal, calculateSalary: calculateSalary });
});
