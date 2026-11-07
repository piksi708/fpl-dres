# FPL dres

Mala stranica koja prati ko vodi u borbi za dres. Na svakih 6 završenih kola, dres dobija onaj ko ima najviše bodova u tom bloku. Podatke sama povlači iz FPL-a jednom dnevno.

Šta stranica prikazuje:
- trenutni blok, koliko je kola završeno i koliko ih je ostalo
- ko vodi i koliko ostali zaostaju
- ko je do sada osvojio dres
- bodove svakog igrača po kolima

## Podešavanje (config.json)

| Polje | Značenje |
|---|---|
| `leagueId` | ID vaše lige (već upisan: 1528780) |
| `nazivLige` | Naziv koji se prikazuje na vrhu stranice (Ernest Hemingway) |
| `nagrada` | Šta se dobija, prikazuje se na stranici |
| `velicinaBloka` | Koliko kola traje blok (6) |
| `poslednjiBlok` | Šta sa kolima koja ne popune blok: `spojen` (poslednji blok traje 8 kola, 31 do 38), `kraci` (kola 37 i 38 su poseban blok) ili `nema` (bez nagrade) |

Bodovi su zvanični bodovi sa FPL-a, sa minusima za transfere. Ako dvojica imaju isti broj bodova u bloku, stranica samo napiše da je izjednačeno.

## Objavljivanje (GitHub Pages, besplatno)

1. Napravi **javni** repozitorijum na GitHub-u, na primer `fpl-dres`. Javni je potreban da bi Pages radio besplatno.
2. Otpremi sve iz ovog foldera (obavezno i skriveni folder `.github`):
   ```
   git init
   git add .
   git commit -m "Prva verzija"
   git branch -M main
   git remote add origin https://github.com/TVOJE-IME/fpl-dres.git
   git push -u origin main
   ```
3. Na GitHub-u: **Settings, Pages**, izaberi *Deploy from a branch*, grana `main`, folder `/ (root)`.
4. **Settings, Actions, General**, pod *Workflow permissions* izaberi *Read and write permissions*.
5. Otvori karticu **Actions**, izaberi *Osveži podatke* i klikni **Run workflow**. Ovo prvi put zameni probne podatke pravim.
6. Stranica je na adresi `https://TVOJE-IME.github.io/fpl-dres/`. Pošalji je drugarima.

Posle toga se podaci sami osvežavaju svako jutro (vreme se menja u `.github/workflows/osvezi.yml`, a dugme *Run workflow* uvek osvežava odmah).

## Probno pokretanje na računaru

Potreban je Node 18 ili noviji.

```
node scripts/fetch-data.mjs        # povuče prave podatke u data.json
python3 -m http.server 8000        # pa otvori http://localhost:8000
```

Stranica se ne može otvoriti dvoklikom na `index.html`, jer pregledač tada ne dozvoljava učitavanje `data.json`.

## Napomene

- Kolo ulazi u zbir tek kad ga FPL označi kao završeno (posle konačnih bonus bodova), pa kolo koje je u toku još ne menja poredak.
- Ako FPL u toku osvežavanja bodova privremeno ne odgovara, skripta pokuša ponovo nekoliko puta. Ako ipak ne uspe, ostaju stari podaci do sledećeg pokretanja.
- Dok se osvežavanje prvi put ne pokrene, `data.json` je prazan i stranica to napiše.
