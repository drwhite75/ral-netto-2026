function eur(n) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function pct(rate) {
  return (rate * 100).toLocaleString("it-IT", { maximumFractionDigits: 2 }) + " %";
}

function row(label, value, note, strong) {
  return `<tr class="${strong ? "strong" : ""}">
    <td>${label}${note ? `<span class="note">${note}</span>` : ""}</td>
    <td class="num">${eur(value)}</td>
  </tr>`;
}

function partsTable(parts) {
  if (!parts.length) return "<tr><td colspan='3'>Nessuno scaglione</td></tr>";
  return parts.map((p) => `<tr>
    <td>${eur(p.from)} – ${eur(p.to)}</td>
    <td>${pct(p.rate)}</td>
    <td class="num">${eur(p.tax)}</td>
  </tr>`).join("");
}

function render(r) {
  document.getElementById("results").hidden = false;
  document.getElementById("netto-anno").textContent = eur(r.nettoAnnuo);
  document.getElementById("netto-13").textContent = eur(r.nettoMensile13);
  document.getElementById("netto-12").textContent = eur(r.nettoMensile12) + " se diviso in 12 mensilità";
  document.getElementById("tasse").textContent = eur(r.tasseImposte);

  const extraNote = r.inps.extra1pct
    ? `1 % sulla quota oltre ${eur(56224)} (fino al massimale)`
    : "non scatta sotto 56.224 €";

  const comNote = r.addizionaleComunale > 0
    ? "0,80 % sull’intero imponibile (soglia Milano 23.000 € superata)"
    : "esente: imponibile ≤ 23.000 €";

  document.getElementById("breakdown").innerHTML = `
    <thead><tr><th>Voce</th><th>Importo</th></tr></thead>
    <tbody>
      ${row("RAL (lordo annuo)", r.ral, "include la 13ª", true)}
      ${row("INPS IVS a carico dipendente 9,19 %", r.inps.ivs, "su " + eur(r.inps.baseImponibile))}
      ${row("INPS contributo aggiuntivo 1 %", r.inps.extra1pct, extraNote)}
      ${row("Imponibile fiscale", r.imponibileFiscale, "RAL − INPS dipendente", true)}
      ${row("IRPEF lorda", r.irpefLorda)}
      ${row("Detrazione lavoro dipendente", -r.detrazioni.base, r.detrazioni.fascia)}
      ${row("Maggiorazione 65 €", -r.detrazioni.extra65, "solo se imponibile tra 25.001 e 35.000")}
      ${row("Ulteriore detrazione cuneo fiscale", -r.detrazioni.extraCuneo, r.detrazioni.fasciaCuneo)}
      ${row("IRPEF netta", r.irpefNetta, "lorda − detrazioni, minimo 0", true)}
      ${row("Addizionale regionale Lombardia", r.addizionaleRegionale)}
      ${row("Addizionale comunale Milano", r.addizionaleComunale, comNote)}
      ${row("Trattamento integrativo", r.trattamentoIntegrativo.importo, r.trattamentoIntegrativo.nota)}
      ${row("Somma esente taglio cuneo", r.sommaEsenteCuneo.importo, r.sommaEsenteCuneo.fascia)}
      ${row("Totale trattenute (INPS + imposte − bonus)", r.trattenuteTotali - r.trattamentoIntegrativo.importo - r.sommaEsenteCuneo.importo)}
      ${row("Netto annuale", r.nettoAnnuo, "", true)}
    </tbody>`;

  document.getElementById("irpef-parts").innerHTML =
    "<thead><tr><th>Scaglione</th><th>Aliquota</th><th>Imposta</th></tr></thead><tbody>" +
    partsTable(r.irpefScaglioni) + "</tbody>";
  document.getElementById("reg-parts").innerHTML =
    "<thead><tr><th>Scaglione</th><th>Aliquota</th><th>Imposta</th></tr></thead><tbody>" +
    partsTable(r.addizionaleRegionaleScaglioni) + "</tbody>";

  document.getElementById("formula").textContent =
    `Netto = RAL − INPS − IRPEF netta − add. regionale − add. comunale + trattamento integrativo + somma esente cuneo  →  ${eur(r.ral)} − ${eur(r.inps.totale)} − ${eur(r.irpefNetta)} − ${eur(r.addizionaleRegionale)} − ${eur(r.addizionaleComunale)} + ${eur(r.trattamentoIntegrativo.importo)} + ${eur(r.sommaEsenteCuneo.importo)} = ${eur(r.nettoAnnuo)}`;
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const ral = Number(document.getElementById("ral").value);
  try {
    render(calcolaNetto(ral));
    document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    alert(err.message);
  }
});

render(calcolaNetto(35000));
