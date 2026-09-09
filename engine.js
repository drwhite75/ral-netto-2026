/**
 * Motore di calcolo netto da RAL — caso standard 2026
 * Impiegato TI, Milano, nessuna agevolazione particolare.
 *
 * Tutte le soglie e le formule sono documentate in LOGICA.md.
 */

const RULES_2026 = {
  inpsDipendente: 0.0919,
  inpsExtraSoglia: 56224,
  inpsExtraAliquota: 0.01,
  inpsMassimale: 122295,
  irpef: [
    { upTo: 28000, rate: 0.23 },
    { upTo: 50000, rate: 0.33 },
    { upTo: Infinity, rate: 0.43 },
  ],
  lombardia: [
    { upTo: 15000, rate: 0.0123 },
    { upTo: 28000, rate: 0.0158 },
    { upTo: 50000, rate: 0.0172 },
    { upTo: Infinity, rate: 0.0173 },
  ],
  milanoComunale: 0.008,
  milanoEsenzione: 23000,
};

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function progressiveTax(taxable, brackets) {
  const parts = [];
  let remaining = taxable;
  let prev = 0;
  let total = 0;
  for (const b of brackets) {
    if (remaining <= 0) break;
    const width = Math.min(remaining, b.upTo - prev);
    const amount = width * b.rate;
    if (width > 0) {
      parts.push({
        from: prev,
        to: prev + width,
        rate: b.rate,
        base: round2(width),
        tax: round2(amount),
      });
      total += amount;
      remaining -= width;
    }
    prev = b.upTo;
  }
  return { total: round2(total), parts };
}

function detrazioneLavoroDipendente(rc) {
  let base = 0;
  let fascia = "";
  if (rc <= 0) return { base: 0, extra65: 0, extraCuneo: 0, totale: 0, fascia: "zero" };
  if (rc <= 15000) {
    base = 1955;
    fascia = "fino a 15.000";
  } else if (rc <= 28000) {
    base = 1910 + 1190 * ((28000 - rc) / 13000);
    fascia = "15.001 – 28.000";
  } else if (rc <= 50000) {
    base = 1910 * ((50000 - rc) / 22000);
    fascia = "28.001 – 50.000";
  } else {
    base = 0;
    fascia = "oltre 50.000";
  }
  if (rc <= 15000 && base < 690) base = 690;

  const extra65 = rc > 25000 && rc <= 35000 ? 65 : 0;

  let extraCuneo = 0;
  let fasciaCuneo = "non spettante";
  if (rc > 20000 && rc <= 32000) {
    extraCuneo = 1000;
    fasciaCuneo = "ulteriore detrazione 1.000 € (20.001–32.000)";
  } else if (rc > 32000 && rc <= 40000) {
    extraCuneo = 1000 * ((40000 - rc) / 8000);
    fasciaCuneo = "ulteriore detrazione decrescente (32.001–40.000)";
  }

  return {
    base: round2(base),
    extra65: round2(extra65),
    extraCuneo: round2(extraCuneo),
    totale: round2(base + extra65 + extraCuneo),
    fascia,
    fasciaCuneo,
  };
}

function sommaEsenteCuneo(rc) {
  if (rc <= 0 || rc > 20000) return { importo: 0, fascia: "non spettante" };
  let pct;
  let fascia;
  if (rc <= 8500) {
    pct = 0.071;
    fascia = "7,1% fino a 8.500";
  } else if (rc <= 15000) {
    pct = 0.053;
    fascia = "5,3% da 8.501 a 15.000";
  } else {
    pct = 0.048;
    fascia = "4,8% da 15.001 a 20.000";
  }
  return { importo: round2(rc * pct), fascia, pct };
}

function trattamentoIntegrativo(rc, irpefLorda, detrazioneBase) {
  if (rc > 15000) {
    return {
      importo: 0,
      nota: "Semplificazione: TI nella fascia 15.001–28.000 richiede il confronto con un paniere di detrazioni (art. 12 e 15 TUIR) che nel caso standard senza carichi/oneri è in genere nullo. Non lo stimiamo.",
    };
  }
  if (rc <= 0) return { importo: 0, nota: "Reddito nullo." };
  const capiente = irpefLorda > detrazioneBase - 75;
  if (capiente) {
    return { importo: 1200, nota: "TI pieno 1.200 €: reddito ≤ 15.000 e IRPEF lorda capiente." };
  }
  return { importo: 0, nota: "TI non spettante: IRPEF lorda incapiente rispetto alla detrazione lavoro − 75 €." };
}

function calcolaNetto(ral) {
  if (!Number.isFinite(ral) || ral < 0) throw new Error("RAL non valida");

  const baseInps = Math.min(ral, RULES_2026.inpsMassimale);
  const inpsBase = round2(baseInps * RULES_2026.inpsDipendente);
  const extraBase = Math.max(0, Math.min(baseInps, RULES_2026.inpsMassimale) - RULES_2026.inpsExtraSoglia);
  const inpsExtra = round2(extraBase * RULES_2026.inpsExtraAliquota);
  const inpsTotale = round2(inpsBase + inpsExtra);

  const imponibile = round2(Math.max(0, ral - inpsTotale));

  const irpef = progressiveTax(imponibile, RULES_2026.irpef);
  const det = detrazioneLavoroDipendente(imponibile);
  const irpefNetta = round2(Math.max(0, irpef.total - det.totale));

  const addReg = progressiveTax(imponibile, RULES_2026.lombardia);
  const addCom = imponibile > RULES_2026.milanoEsenzione
    ? round2(imponibile * RULES_2026.milanoComunale)
    : 0;

  const ti = trattamentoIntegrativo(imponibile, irpef.total, det.base);
  const cuneoSomma = sommaEsenteCuneo(imponibile);

  const tasseImposte = round2(irpefNetta + addReg.total + addCom);
  const trattenute = round2(inpsTotale + tasseImposte);
  const nettoAnnuo = round2(ral - trattenute + ti.importo + cuneoSomma.importo);

  return {
    ral: round2(ral),
    inps: {
      baseImponibile: round2(baseInps),
      ivs: inpsBase,
      extra1pct: inpsExtra,
      extraBase: round2(extraBase),
      totale: inpsTotale,
    },
    imponibileFiscale: imponibile,
    irpefLorda: irpef.total,
    irpefScaglioni: irpef.parts,
    detrazioni: det,
    irpefNetta,
    addizionaleRegionale: addReg.total,
    addizionaleRegionaleScaglioni: addReg.parts,
    addizionaleComunale: addCom,
    trattamentoIntegrativo: ti,
    sommaEsenteCuneo: cuneoSomma,
    tasseImposte,
    trattenuteTotali: trattenute,
    nettoAnnuo,
    nettoMensile12: round2(nettoAnnuo / 12),
    nettoMensile13: round2(nettoAnnuo / 13),
  };
}

if (typeof module !== "undefined") module.exports = { calcolaNetto, RULES_2026 };
