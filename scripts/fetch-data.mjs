// Povlači podatke iz javnog FPL API-ja i upisuje ih u data.json.
// Pokretanje:  node scripts/fetch-data.mjs
// Potreban je Node 18 ili noviji (nema dodatnih paketa).

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const koren = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.FPL_BASE || "https://fantasy.premierleague.com/api";
const HEADERS = { "User-Agent": "fpl-dres-tabela" };

const config = JSON.parse(await readFile(path.join(koren, "config.json"), "utf8"));
const leagueId = Number(process.env.FPL_LEAGUE_ID || config.leagueId);

if (!leagueId) {
  console.error("Upiši ID lige u config.json (polje leagueId).");
  process.exit(1);
}

const pauza = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, pokusaji = 4) {
  for (let i = 1; i <= pokusaji; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.ok) return await res.json();
      if (res.status === 404) throw new Error(`404 za ${url}`);
      // 503 se javlja dok FPL osvežava bodove posle kola
      if (i === pokusaji) throw new Error(`HTTP ${res.status} za ${url}`);
    } catch (e) {
      if (i === pokusaji || String(e.message).startsWith("404")) throw e;
    }
    await pauza(1500 * i);
  }
}

// 1. Opšti podaci o sezoni (spisak kola i koja su završena)
const opste = await get(`${BASE}/bootstrap-static/`);
const kola = opste.events.map((k) => ({
  id: k.id,
  naziv: k.name,
  zavrseno: Boolean(k.finished),
  rok: k.deadline_time,
}));
const ukupnoKola = kola.length;
// Kolo koje je trenutno u toku (počelo je, a FPL ga još nije završio)
const tekuceKolo = opste.events.find((k) => k.is_current && !k.finished)?.id ?? null;
const zavrsenaKola = kola.filter((k) => k.zavrseno).map((k) => k.id);

// 2. Svi igrači u ligi (strane po 50)
let strana = 1;
let nazivLige = "";
const clanovi = [];
while (true) {
  const odgovor = await get(`${BASE}/leagues-classic/${leagueId}/standings/?page_standings=${strana}`);
  nazivLige = odgovor.league?.name || nazivLige;
  for (const r of odgovor.standings.results) {
    clanovi.push({ id: r.entry, ime: r.player_name, tim: r.entry_name });
  }
  if (!odgovor.standings.has_next) break;
  strana++;
}

if (clanovi.length === 0) {
  console.error("Liga nema nijednog člana. Proveri ID lige.");
  process.exit(1);
}

// 3. Istorija svakog igrača po kolima
const igraci = [];
for (const c of clanovi) {
  const istorija = await get(`${BASE}/entry/${c.id}/history/`);
  // Zvanični bodovi kola = razlika zvaničnog ukupnog zbira (minusi za transfere su već uračunati)
  const poKolu = {};
  let prethodno = 0;
  for (const k of [...istorija.current].sort((a, b) => a.event - b.event)) {
    poKolu[k.event] = {
      bodovi: k.total_points - prethodno,
      minus: k.event_transfers_cost || 0,
      ukupno: k.total_points,
    };
    prethodno = k.total_points;
  }
  igraci.push({ ...c, kola: poKolu });
  await pauza(250); // ne opterećujemo FPL
}

const izlaz = {
  azurirano: new Date().toISOString(),
  demo: false,
  liga: { id: leagueId, naziv: config.nazivLige || nazivLige },
  podesavanja: {
    nagrada: config.nagrada ?? "Dres",
    velicinaBloka: config.velicinaBloka ?? 6,
    poslednjiBlok: config.poslednjiBlok ?? "spojen",
  },
  ukupnoKola,
  zavrsenaKola,
  tekuceKolo,
  kola,
  igraci,
};

await writeFile(path.join(koren, "data.json"), JSON.stringify(izlaz, null, 1) + "\n");
console.log(`Gotovo: ${igraci.length} igrača, završeno kola: ${zavrsenaKola.length}/${ukupnoKola}.`);
