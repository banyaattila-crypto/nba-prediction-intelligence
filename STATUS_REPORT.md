# NBA Prediction & Betting Intelligence — Állapotjelentés

**Dátum:** 2026. november 12.
**Kiadás:** 1.2.0 + az audit F1–F3 és F8 javításai (a csomagok verziószáma nem változott)
**Repozitórium:** https://github.com/banyaattila-crypto/nba-prediction-intelligence
**Státusz:** működő prototípus papírkereskedési (paper trading) használatra. **Valódi pénzes döntéshez nem használható**: a modell előnye nem bizonyított, és a hendikep- és total-szorzók becsültek (lásd 4. és 5. szakasz).

---

## 1. Összefoglaló

Az alkalmazás az ESPN publikus adataiból összeveti a modell és a piac valószínűségeit, és a különbséget (eltérés, százalékpont) mutatja meg. Az eltérés nem bizonyított előny. Ezt kizárólag a Napló fül lezárt tippjei mérik. A napló üresen indul, értelmezhető értékeléshez legalább 50 lezárt tipp kell.

Egy független szoftveraudit (2026-11-12) 13 leletet talált. Ebből az F1, F2, F3 és F8 javítva van, a többi nyitott (5. szakasz).

---

## 2. Az audit alapján elvégzett javítások

| Lelet | Súlyosság | Javítás |
|---|---|---|
| **F1** path traversal | Kritikus | A SPA-kiszolgáló a kért útvonalat `realpath`-szal oldja fel, és csak a `frontend/dist` mappán belüli fájlt adja ki. A `/../../backend/run.py` típusú kérések már az `index.html`-t kapják. |
| **F2** a napló felülírása | Kritikus | Sérült vagy olvashatatlan naplófájlnál a szerver 503-at ad, és nem írja felül a fájlt (korábban 12 sorból 1 lett). Az írás atomi (ideiglenes fájl, `fsync`, `os.replace`), a módosítás zár alatt fut. |
| **F3** kitalált adat és hamis feliratok | Kritikus | A kitalált mintatippek törölve, a napló üresen indul. Üres naplónál nincs alapértelmezett Brier/CLV érték. A placeholder CLV megszűnt, a CLV nincs mérve. A „zéró look-ahead bias" és a „jó kalibráció" feliratok megszűntek, a felület szövegei az adatból épülnek. |
| **F8** nyitott írás | Közepes | A tipp rögzítésekor a kliens csak azonosítót és tétet küld, az árat, valószínűséget és időpontot a szerver számolja újra (a kliens hamis `odds`/`ev` értéke hatástalan). `units`: 0 < tét ≤ 5, véges szám. Az írás (rögzítés, elszámolás) alapból csak a helyi gépről, idegen eredet és DNS-rebinding nélkül lehetséges; `API_WRITE_TOKEN`-nel bárhonnan tokenes. CORS: csak a megadott eredetek, süti nélkül, csak GET/POST. A szerver alapból `127.0.0.1`-en figyel. `?date=` csak `YYYYMMDD`. |

**Kapcsolódó változások az F3-hoz**
- **Elszámolás:** `POST /api/history/settle` az ESPN végeredményéből lezárja a függő tippeket (győztes, hendikep, total; döntetlen esetén visszajár).
- **Look-ahead védelem:** az `/api/picks` és `/api/picks/top` csak induló meccset értékel. Az `/api/picks/track` az indulás után 409-et, értelmezhetetlen dátumra 422-t ad.
- **Kalibráció és Brier:** a döntetlenre végződő (PUSH) tipp nem számít bele, mert nincs bináris kimenete.

---

## 3. Felület („Tábla")

A felületet teljesen újraterveztem. Az előző cyberpunk/glassmorphism megjelenést felváltotta egy taktikatábla-világ.

- **Téma:** világos (taktikatábla) és sötét (krétatábla) a rendszerbeállítás szerint.
- **Eredetjelölők:** kék ◆ a modell, narancs ■ a piaci ár, fekete ● a forrásadat, szürke szaggatott ○ a becsült alapérték. Az **ár–modell sáv** egy tengelyen mutatja a piac és a modell valószínűségét.
- **Fülek:** Mérkőzések, Eltérések, Napló, Tabella. Ezen kívül Módszertan ablak az ismert korlátok listájával.
- **Működés:** hiba- és üres állapotok újrapróbálással; a „Rögzítve" jelzés csak szerveroldali siker után jelenik meg; az elemzés minden szimulált összpontszám-sávot mutat; a meccslista nem vár a lassú modellre.
- **Elérhetőség:** párbeszédablakban Esc és fókuszcsapda, `aria-*` jelölések, vissza nem térő mozgás csökkentése (`prefers-reduced-motion`).
- **Technika:** React 18, Vite 6, Tailwind 3 (színek CSS-változókból), JSX (nincs TypeScript).

---

## 4. A kvantmodulok tényleges állapota

| Modul | Állapot |
|---|---|
| `ev_calculator.py` (vig-mentesítés, edge, EV, Kelly) | Bekötve, a képletek tesztelve |
| `monte_carlo.py` (10 000 szimuláció) | Bekötve; a szórás (σ = 11,5) fix, valós eredményeken nincs hitelesítve (audit F7) |
| `ratings.py` (csapat- és sérüléshatás) | Bekötve; a B2B/pihenőnap nincs számolva, a sztárlista statikus |
| `shin.py` | **Hibás és nincs bekötve:** a gyökkeresés nem konvergál, az eredmény mindig megegyezik a multiplikatív vig-mentesítéssel (F6) |
| `elo.py` (Elo, MOV, Four Factors) | Nincs bekötve, csak a tesztek használják (F6) |
| `player_props.py` | Nincs bekötve, csak a tesztek használják (F6) |

A korábbi jelentések állításai a Shin-modellről, az Elo-ról és a játékos-propokról tehát nem a működő alkalmazásra vonatkoztak.

---

## 5. Nyitott leletek (prioritási sorrendben)

| ID | Súlyosság | Tartalom |
|---|---|---|
| F4 | Magas | A hendikep- és total-szorzó mindig 1,91 (az ESPN nem ad árat); hiányzó vonalnál kitalált alapértékek. A felület ezt jelöli, de az EV tájékoztató jellegű marad. |
| F5 | Magas | ESPN-hiba vagy üres lista esetén kitalált fallback-meccsek jelennek meg valósként. |
| F6 | Magas | Shin hibás, az Elo, a Four Factors és a player props nincs bekötve; a `/health` „Power Devigging"-et állít, ilyen nincs. |
| F7 | Magas | A modell szórása nincs hitelesítve; a mért különbségszórás (16,2) a szokásos NBA-értéknél (~12–13) feltehetően nagyobb `[FELTÉTELEZÉS]`. |
| F9 | Közepes | A gyorsítótárazott `Game` objektumot a részletes lekérés módosítja; szekvenciális ESPN-hívások. |
| F10 | Közepes | Nincs `requirements.txt`/`pyproject.toml`, nincs CI. |
| F11 | Közepes | Nincs frontend-teszt, nincs lint. |
| F12 | Alacsony | Verziószám-eltérés (`main.py` 1.0.0, `package.json` 1.0.0); az ismeretlen `/api/*` útvonal 200-zal `index.html`-t ad. |
| — | Nincs megvalósítva | A záró vonal (CLV) rögzítése. |

---

## 6. Tesztek

```
backend/tests: 66 passed
  test_api.py       4  (végpontok)
  test_quant.py    13  (képletek, szimuláció, Shin/Elo/props önállóan)
  test_tracker.py  26  (napló, elszámolás, csak induló meccsek)
  test_security.py 23  (szerveroldali újraszámolás, tét-validáció, írásvédelem, CORS, dátum)
```

A `test_api.py` az élő ESPN-hívás hibája esetén a fallback-ágon is zöld, tehát nem bizonyítja az élő működést. A frontendnek nincs automatikus tesztje; a felületet böngészőben, élő és kitalált (jövőbeli) adaton kézzel ellenőriztem.

---

## 7. Futtatás

```bash
cd frontend && npm install && npm run build   # a backend a frontend/dist mappát szolgálja ki
cd ../backend
./venv/bin/python run.py                      # http://127.0.0.1:8000 (csak helyi gép; HOST, PORT, API_WRITE_TOKEN: lásd README)
```

Fejlesztői módban: `cd frontend && npm run dev` (http://localhost:3000, `/api` proxy a 8000-es portra).

Papírkereskedés: az **Eltérések** fülön a „Rögzítés papírkereskedésként" gombbal vehető fel tipp (csak induló meccsre; a rögzített szorzó a szerver aktuális értéke), a meccs után a **Napló** fül „Eredmények frissítése" gombja számolja el.
