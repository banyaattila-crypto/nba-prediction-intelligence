# NBA Prediction & Betting Intelligence — Állapotjelentés

**Dátum:** 2026. november 12.
**Kiadás:** 1.2.0 + az audit F1–F8 javításai (a csomagok verziószáma nem változott)
**Repozitórium:** https://github.com/banyaattila-crypto/nba-prediction-intelligence
**Státusz:** működő prototípus papírkereskedési (paper trading) használatra. **Valódi pénzes döntéshez nem használható**: a szezon 170 meccsén végzett visszamérés szerint a modell nem ad hozzá információt a záró vonalhoz, ezért a jelzések a piaci valószínűséghez igazodnak, és jelenleg nem készül jelzett tipp (lásd 2. és 5. szakasz, F7).

---

## 1. Összefoglaló

Az alkalmazás az ESPN publikus adataiból összeveti a modell és a piac valószínűségeit, és a különbséget (eltérés, százalékpont) mutatja meg. Az eltérés nem bizonyított előny. Ezt kizárólag a Napló fül lezárt tippjei mérik. A napló üresen indul, értelmezhető értékeléshez legalább 50 lezárt tipp kell.

Egy független szoftveraudit (2026-11-12) 13 leletet talált. Ebből az F1–F8 javítva van, a többi nyitott (5. szakasz).

---

## 2. Az audit alapján elvégzett javítások

| Lelet | Súlyosság | Javítás |
|---|---|---|
| **F1** path traversal | Kritikus | A SPA-kiszolgáló a kért útvonalat `realpath`-szal oldja fel, és csak a `frontend/dist` mappán belüli fájlt adja ki. A `/../../backend/run.py` típusú kérések már az `index.html`-t kapják. |
| **F2** a napló felülírása | Kritikus | Sérült vagy olvashatatlan naplófájlnál a szerver 503-at ad, és nem írja felül a fájlt (korábban 12 sorból 1 lett). Az írás atomi (ideiglenes fájl, `fsync`, `os.replace`), a módosítás zár alatt fut. |
| **F3** kitalált adat és hamis feliratok | Kritikus | A kitalált mintatippek törölve, a napló üresen indul. Üres naplónál nincs alapértelmezett Brier/CLV érték. A placeholder CLV megszűnt, a CLV nincs mérve. A „zéró look-ahead bias" és a „jó kalibráció" feliratok megszűntek, a felület szövegei az adatból épülnek. |
| **F8** nyitott írás | Közepes | A tipp rögzítésekor a kliens csak azonosítót és tétet küld, az árat, valószínűséget és időpontot a szerver számolja újra (a kliens hamis `odds`/`ev` értéke hatástalan). `units`: 0 < tét ≤ 5, véges szám. Az írás (rögzítés, elszámolás) alapból csak a helyi gépről, idegen eredet és DNS-rebinding nélkül lehetséges; `API_WRITE_TOKEN`-nel bárhonnan tokenes. CORS: csak a megadott eredetek, süti nélkül, csak GET/POST. A szerver alapból `127.0.0.1`-en figyel. `?date=` csak `YYYYMMDD`. |
| **F4** kitalált szorzók | Magas | Az adapter az ESPN strukturált árait (`moneyline`, `pointSpread`, `total`) olvassa mind a scoreboardról, mind a részletes végpontról; ami hiányzik vagy nem fogadható (`OFF`), az `None`, nincs alapérték. Csak teljes ár- és vonaladatú piac kap tippet. **Az audit alulbecsülte a hibát:** a kártyákon látható moneyline is hamis alapérték volt (1,77/2,10 minden meccsre), és ha a részletes lekérés elbukott, a rendszer csendben ezekkel számolt tovább. |
| **F7** a modell érvényessége | Kritikus | A szezon 170 lejátszott meccsén (záró vonalakkal, 2026-10-20 – 11-12) megmértük: a tényleges különbség szórása a vonal körül **14,4**, az összponté **17,7** (a kódban 16,2 és 16,5 volt; a korábbi „12–13" feltevésem tévedés volt). Pontbeli csapatértékeléssel (92 meccs) a modell pontatlanabb a piacnál (RMSE 15,4–16,2 vs 14,3), a piachoz keverés optimális súlya ≈ 0 (95% CI −0,3 … +0,4), a nyers modell jelzett tippjeinek hozama −8,9% (a vig: −7,8%), az eltérések mediánja 13,7 pp. Ezért: kalibrált szórások a szimulációban; a valószínűség a piaci és a nyers modell keveréke, **a modell súlya 0**; a nyers modell külön látszik (`raw_model_prob`); 8 pp feletti eltérés sosem jelzés (hihetőségi védelem). A paraméterek az `app/quant/calibration.py`-ban vannak, az újramérés a `backend/calibration/` szkriptjeivel történik. |
| **F5** kitalált tartalék adat | Magas | A kitalált tartalék meccsek (csapatok, szorzók, sérültek) megszűntek. ESPN-hiba esetén az API 503-at ad érthető üzenettel (a felület hibaállapotot és újrapróbálást mutat), üres nap esetén üres listát; a hiba nem kerül a gyorsítótárba. A tabella hibája esetén a legutóbbi sikeres változat marad használatban (a csapatmutatók lassan változnak), ennek hiányában a tabella nélküli csapat `has_ratings=false`, nincs kitalált mérleg vagy mutató, és a meccs nem értékelhető (503). A sérüléslistának `injuries_known` jelzője van: ha a részletes lekérés elbukik, a felület és az elemzés kimondja, hogy a lista nem elérhető, nem állítja, hogy nincs hiányzó. A sikertelen részletes lekérés nem kerül a gyorsítótárba. |
| **F6** hibás Shin, nem bekötött modulok | Magas | A Shin-függvény hibás célfüggvényt használt (`sum(p)` a teljes tartományon > 1, így a gyökkeresés sosem konvergált, és csendben az arányos módszerre esett vissza); javítva, és független megoldóval ellenőrzött teszt védi. A vig-mentesítés módszerét **adat döntötte el** (170 meccs moneyline, páros bootstrap): hatványos log-loss 0,5351, Shin 0,5373, arányos 0,5413, a különbségek kimutathatók, a hatványos a Shinnél is jobb (Δ −0,0022 [−0,0032; −0,0012]) ⇒ a produkció a **hatványos** módszert használja (`calibration.DEVIG_METHOD`, a Shin és az arányos kiválasztható). Az Elo/Four Factors és a player props modul nincs bekötve: adatforrás nincs hozzájuk, ezért az `app/quant/experimental/` mappába kerültek, jelöléssel és tesztekkel, és egy teszt őrzi, hogy a produkciós kód ne importálja őket. A `/api/health` már a ténylegesen használt módszert írja. |

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
| `ev_calculator.py` (vig-mentesítés, edge, EV, Kelly) | Bekötve; a vig-mentesítés hatványos módszerrel, a képletek tesztelve |
| `monte_carlo.py` (10 000 szimuláció) | Bekötve; a szórás a szezon valós eredményeiből kalibrált (különbség 14,4, összpont 17,7) |
| `calibration.py` (súly, szórások, hihetőségi védelem) | Bekötve; a modell súlya 0, mert a visszamérés nem mutat hozzáadott információt |
| `ratings.py` (csapat- és sérüléshatás) | Bekötve; a B2B/pihenőnap nincs számolva, a sztárlista statikus; a visszamérés szerint a csapatértékelés nem ad információt a piachoz (F7b) |
| `shin.py` | Javítva és tesztelve; kiválasztható (`DEVIG_METHOD="shin"`), de a mérés szerint a hatványos módszer jobb, ezért nem az alapértelmezett |
| `experimental/elo.py` (Elo, MOV, Four Factors) | **Nincs bekötve** (nincs hozzá adatforrás); tesztelt, kísérleti |
| `experimental/player_props.py` | **Nincs bekötve** (nincs prop-szorzó forrás); tesztelt, kísérleti |

A korábbi jelentések állításai a Shin-modellről, az Elo-ról és a játékos-propokról nem a működő alkalmazásra vonatkoztak; ez javítva.

---

## 5. Nyitott leletek (prioritási sorrendben)

| ID | Súlyosság | Tartalom |
|---|---|---|
| F7b | Magas | A modell nem ad hozzá információt a záró vonalhoz. A súly emelése csak jobb modell és újramérés után indokolt: pihenő/back-to-back az ütemezésből, forma, aktuális sérülésadat, több meccs (a CI széles, kis pozitív súly nem zárható ki). |
| F9 | Közepes | A gyorsítótárazott `Game` objektumot a részletes lekérés módosítja; szekvenciális ESPN-hívások. |
| F10 | Közepes | Nincs `requirements.txt`/`pyproject.toml`, nincs CI. |
| F11 | Közepes | Nincs frontend-teszt, nincs lint. |
| F12 | Alacsony | Verziószám-eltérés (`main.py` 1.0.0, `package.json` 1.0.0); az ismeretlen `/api/*` útvonal 200-zal `index.html`-t ad. |
| — | Nincs megvalósítva | A záró vonal (CLV) rögzítése. |

---

## 6. Tesztek

```
backend/tests: 163 passed
  test_api.py       6  (végpontok, offline)
  test_quant.py    13  (képletek, szimuláció, Shin/Elo/props önállóan)
  test_tracker.py  26  (napló, elszámolás, csak induló meccsek)
  test_security.py 23  (szerveroldali újraszámolás, tét-validáció, írásvédelem, CORS, dátum)
  test_odds.py     37  (valós ESPN-mintán: árak, vonalak, OFF, hibaág, csak teljes adatú piac)
  test_calibration.py 11 (keverés, mért szórások, horgonyzás, hihetőségi védelem)
  test_failures.py 20  (ESPN-kiesés, üres nap, elavult tabella, ismeretlen csapat, sérüléslista, 503-ak)
  test_devig.py    22  (Shin és hatványos független ellenőrzése, bekötés, módszerváltás)
  test_experimental.py 5 (kísérleti modulok; a produkciós kód nem importálja őket)
```

A tesztek offline futnak (kitalált szolgáltató, rögzített valós ESPN-minták), nem függnek az élő ESPN-től. A frontendnek nincs automatikus tesztje; a felületet böngészőben, élő és kitalált (jövőbeli) adaton kézzel ellenőriztem.

---

## 7. Futtatás

```bash
cd frontend && npm install && npm run build   # a backend a frontend/dist mappát szolgálja ki
cd ../backend
./venv/bin/python run.py                      # http://127.0.0.1:8000 (csak helyi gép; HOST, PORT, API_WRITE_TOKEN: lásd README)
```

Fejlesztői módban: `cd frontend && npm run dev` (http://localhost:3000, `/api` proxy a 8000-es portra).

Papírkereskedés: az **Eltérések** fülön a „Rögzítés papírkereskedésként" gombbal vehető fel tipp (csak induló meccsre; a rögzített szorzó a szerver aktuális értéke), a meccs után a **Napló** fül „Eredmények frissítése" gombja számolja el.
