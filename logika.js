// Računanje blokova od po N kola, bodova u bloku i pobednika.
// Isti fajl koristi stranica (u pregledaču) i testovi (u Node-u).

export function opseg(od, do_) {
  const niz = [];
  for (let i = od; i <= do_; i++) niz.push(i);
  return niz;
}

// Deli sezonu na blokove. poslednji: "spojen" | "kraci" | "nema"
export function napraviBlokove(ukupnoKola, velicina = 6, poslednji = "spojen") {
  const blokovi = [];
  const punih = Math.floor(ukupnoKola / velicina);
  const ostatak = ukupnoKola % velicina;

  for (let i = 0; i < punih; i++) {
    blokovi.push({ od: i * velicina + 1, do: (i + 1) * velicina });
  }
  if (ostatak > 0) {
    if (poslednji === "kraci" || punih === 0) {
      blokovi.push({ od: punih * velicina + 1, do: ukupnoKola });
    } else if (poslednji === "spojen") {
      blokovi[blokovi.length - 1].do = ukupnoKola;
    }
    // "nema": ostatak kola ne ulazi ni u jedan blok
  }
  blokovi.forEach((b, i) => (b.broj = i + 1));
  return blokovi;
}

export function izracunaj(data) {
  const p = data.podesavanja;
  const zavrsena = new Set(data.zavrsenaKola);
  const blokovi = napraviBlokove(data.ukupnoKola, p.velicinaBloka, p.poslednjiBlok);
  let trenutniNadjen = false;

  const rezultat = blokovi.map((b) => {
    const kola = opseg(b.od, b.do);
    const zavrsenaUBloku = kola.filter((k) => zavrsena.has(k));

    const redovi = data.igraci.map((ig) => ({
      igrac: ig,
      bodovi: zavrsenaUBloku.reduce((s, k) => s + (ig.kola[k]?.bodovi ?? 0), 0),
    }));
    redovi.sort((a, b2) => b2.bodovi - a.bodovi || a.igrac.ime.localeCompare(b2.igrac.ime, "sr"));

    // Mesto: isti bodovi = isto mesto
    redovi.forEach((r, i) => {
      r.mesto = i > 0 && r.bodovi === redovi[i - 1].bodovi ? redovi[i - 1].mesto : i + 1;
    });

    const gotov = zavrsenaUBloku.length === kola.length;
    let status;
    if (gotov) status = "zavrsen";
    else if (!trenutniNadjen) {
      status = "u_toku";
      trenutniNadjen = true;
    } else status = "uskoro";

    const najvise = redovi.length ? redovi[0].bodovi : 0;
    const imaBodova = zavrsenaUBloku.length > 0;
    const lideri = imaBodova ? redovi.filter((r) => r.bodovi === najvise).map((r) => r.igrac) : [];

    return {
      ...b,
      kola,
      zavrsenaKola: zavrsenaUBloku,
      preostalo: kola.length - zavrsenaUBloku.length,
      status,
      redovi,
      lideri,
      najvise,
      // pobednik postoji samo kad je blok gotov i niko nema isto
      pobednik: gotov && lideri.length === 1 ? lideri[0] : null,
      izjednaceno: gotov && lideri.length > 1,
    };
  });

  // Koliko je ko dresova osvojio (samo jasne pobede)
  const brojDresova = new Map();
  for (const b of rezultat) {
    if (b.pobednik) brojDresova.set(b.pobednik.id, (brojDresova.get(b.pobednik.id) || 0) + 1);
  }

  return {
    blokovi: rezultat,
    trenutni: rezultat.find((b) => b.status === "u_toku") || null,
    brojDresova,
  };
}
