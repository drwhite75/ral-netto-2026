const { calcolaNetto } = require("./engine");

function assertClose(name, got, expected, tol = 0.02) {
  if (Math.abs(got - expected) > tol) {
    throw new Error(`${name}: atteso ${expected}, ottenuto ${got}`);
  }
  console.log("OK", name, got);
}

const a = calcolaNetto(30000);
assertClose("INPS 30k", a.inps.totale, 30000 * 0.0919);
assertClose("imponibile 30k", a.imponibileFiscale, 30000 - 30000 * 0.0919);

assertClose("no extra sotto soglia", calcolaNetto(50000).inps.extra1pct, 0);
assertClose("extra 80k", calcolaNetto(80000).inps.extra1pct, (80000 - 56224) * 0.01);

const d = calcolaNetto(200000);
assertClose("massimale INPS base", d.inps.baseImponibile, 122295);
assertClose("extra capped", d.inps.extra1pct, (122295 - 56224) * 0.01);

console.log("Tutti i test base ok");
