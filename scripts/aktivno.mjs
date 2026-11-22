// Odgovara na pitanje: "ima li sada smisla često proveravati bodove?"
// Izlazni kod 0 = da, 1 = ne. Koristi ga workflow da ne troši pokretanja kad nema utakmica.
//
// Aktivno je ako je kolo u toku i neka utakmica počinje u narednih 30 minuta,
// ili je počela u poslednja 3 i po sata (traje oko 2 sata, plus vreme za bonus bodove).
// Ako raspored nije poznat, a kolo je u toku, smatramo da je aktivno (bezbednija strana).

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const koren = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(await readFile(path.join(koren, "data.json"), "utf8"));
const sada = process.env.SADA ? Date.parse(process.env.SADA) : Date.now(); // SADA služi samo za probu

let aktivno;
if (!data.tekuceKolo) {
  aktivno = false;
} else if (!Array.isArray(data.utakmice) || data.utakmice.length === 0) {
  aktivno = true;
} else {
  const SAT = 3600 * 1000;
  aktivno = data.utakmice.some((t) => {
    const pocetak = Date.parse(t);
    return pocetak >= sada - 3.5 * SAT && pocetak <= sada + 0.5 * SAT;
  });
}

console.log(aktivno ? "Utakmice su u toku ili skoro počinju." : "Nema utakmica u toku.");
process.exit(aktivno ? 0 : 1);
