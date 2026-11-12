# NBA Prediction & Betting Intelligence App

Mobilbarát, valós idejű és statisztikailag megalapozott NBA döntéstámogató és sportfogadási intelligencia rendszer. Nem véletlenszerű tippeket gyárt, hanem valós adatokból, matematikai modellezésből, bukmékeri odds-elemzésből és 10 000 futásos Monte Carlo szimulációból számítja ki a pozitív várható értékű (+EV) lehetőségeket.

---

## Főbb Jellemzők

1. **Valós Idejű NBA Játéknap (Scoreboard & Standings):**
   - Helyi időzónában megjelenített mérkőzéskezdések.
   - Élő eredmények, negyedek és óraállás.
   - Mind a 30 csapat aktuális mérlege, támadó- (ORtg) és védőhatékonysága (DRtg), valamint tempója (Pace).
   - Hivatalos sérülésjelentések (Out, Questionable, Day-to-Day) és egymást követő meccsnapok (Back-to-Back fáradtság).

2. **Kvantitatív Elemző Motor (Quant Engine):**
   - **Vig-mentesítés (Devigging):** hatványos módszer a tiszta fair valószínűségek kinyeréséhez ($p_i = q_i^k$, ahol $\sum p_i = 1$). A módszert a szezon 170 meccsének moneyline-ján mért log-loss alapján választottuk (hatványos 0,5351, Shin 0,5373, arányos 0,5413); lásd `backend/calibration/analyze.py`.
   - **Monte Carlo Szimuláció:** Meccsenként 10 000 független vektorizált szimuláció (NumPy) normál ponteloszlással és tempókorrelációval.
   - **Él (Edge) és Várható Érték (EV):**
     $$\text{Edge} = P_{\text{modell}} - P_{\text{fair}}$$
     $$\text{EV} = [P_{\text{modell}} \cdot (\text{Odds} - 1) - (1 - P_{\text{modell}})] \cdot 100$$
   - **Bankroll-védelem:** 0.25x Fractional Kelly kritérium javaslat a tőke megőrzésére.
   - **Szigorú szűrés és "PASS" logika:** Ha nincs elegendő matematikai előny ($\text{Edge} < +2.0\%$ vagy magas a rotációs bizonytalanság), a rendszer jelzi: *"Nincs ajánlható tipp"*.

3. **Papírkereskedési napló (teljesítménymérés):**
   - A tippek a rögzítés pillanatában kerülnek a naplóba, **csak induló meccsre** (az indulás után a szerver elutasítja). A napló üresen indul, nincs benne mintaadat.
   - Az eredményt az *Eredmények frissítése* gomb számolja el az ESPN végeredményéből (győztes, hendikep, total; döntetlen esetén visszajár).
   - Mutatók: találati arány, kumulált egység és ROI, **Brier-pontszám**, **kalibráció** sávonként. Üres naplónál ezek nem jelennek meg érték nélkül, 50 lezárt tipp alatt a felület „kis minta" jelzést ad.
   - **Nincs CLV (záró vonal) mérés:** a záró szorzó rögzítése még nincs megvalósítva, ezért a mutató nem szerepel.
   - A napló fájl-alapú (`backend/app/data/historical_picks.json`), hitelesítés nélkül írható: nem tekinthető manipulációbiztosnak.

4. **Felület ("Tábla"):**
   - React + Vite + Tailwind CSS + Lucide Icons; világos (taktikatábla) és sötét (krétatábla) téma a rendszerbeállítás szerint.
   - Minden szám eredete jelölt: forrásadat (ESPN), piaci ár, modell, becsült alapérték. Az ár–modell sáv egy tengelyen mutatja a piac és a modell valószínűségét.
   - Részletes mérkőzéselemzés összpontszám-eloszlással, sérülésekkel és az összes értékelt piaccal.

---

## Telepítés és Futtatás

### 1. Előfeltételek
- Python 3.12
- Node.js 20 vagy újabb (a `frontend/.nvmrc` a 22-es verziót jelöli) és npm

### 2. Telepítés (reprodukálható)
```bash
# Backend: friss virtuális környezet a rögzített készletből (futásidő + teszt)
cd backend
python3.12 -m venv venv
./venv/bin/pip install -r requirements.lock

# Frontend: a package-lock.json szerint
cd ../frontend
npm ci && npm run build
```

Függőségek: `backend/requirements.txt` (közvetlenek, pontos verzióval), `backend/requirements-dev.txt` (+ pytest), `backend/requirements.lock` (a teljes, tranzitív készlet; a CI ezt telepíti). Frissítés után a lockfájl újragenerálása: friss venv-ben `pip install -r requirements-dev.txt`, majd `pip freeze | grep -v "^pip==" > requirements.lock`.

**Tesztek:** `cd backend && ./venv/bin/python -m pytest -q`. Hálózat nélkül futnak (rögzített ESPN-minták). A GitHub Actions (`.github/workflows/ci.yml`) minden push-ra és pull requestre lefuttatja a backend teszteket és a frontend buildet.

### 3. Backend Futtatása
```bash
cd backend
./venv/bin/python run.py
```
A backend alapértelmezetten a `http://127.0.0.1:8000` címen indul el (csak a helyi gépről érhető el), és kiszolgálja mind a REST API-t (`/api/...`), mind az elkészült frontend felületet (`cd frontend && npm run build`).

**Konfiguráció (környezeti változók)**

| Változó | Alapérték | Jelentés |
|---|---|---|
| `HOST` | `127.0.0.1` | Figyelt cím. Hálózatra nyitás: `0.0.0.0` |
| `PORT` | `8000` | Figyelt port |
| `API_WRITE_TOKEN` | nincs | Ha be van állítva, az írás (tipp rögzítése, elszámolás) `Authorization: Bearer <token>` fejlécet kér, bárhonnan. A webfelület nem küld tokent, ezért token módban az írás csak szkriptből (pl. `curl`) használható. |
| `CORS_ORIGINS` | `localhost` / `127.0.0.1` a 3000-es és 8000-es porton | Engedélyezett böngészős eredetek, vesszővel elválasztva |

**Írásvédelem:** token nélkül írni csak a helyi gépről lehet, és csak olyan kérésből, amely nem idegen weboldalról (cross-origin) és nem DNS-rebinding úton érkezik. Fordított proxy mögött a kliens címe a proxy címe, ilyenkor mindenképp állítsd be az `API_WRITE_TOKEN`-t. Az olvasó végpontok nyitottak.

**Kalibráció és visszamérés** (`backend/calibration/`, a backend mappából futtatva)

```bash
./venv/bin/python -B calibration/collect.py     # a szezon lejátszott meccsei + záró vonalak az ESPN-ről (~5 perc)
./venv/bin/python -B calibration/analyze.py     # szórások, a modell pontossága, optimális piacsúly (bootstrap CI)
./venv/bin/python -B calibration/backtest.py    # az éles tippgenerálás visszamérése (--weight W: más súllyal)
```

A modell súlyát (`app/quant/calibration.py`, `MODEL_WEIGHT`) csak olyan újramérés emelheti, amely a súlyt a nullától megkülönböztethetően pozitívnak mutatja. A 2026-11-12-i mérés (170 meccs) szerint a súly 0 körüli.

### 4. Frontend Fejlesztői Mód (Opcionális)
Ha a frontend forráskódját módosítani szeretnéd:
```bash
cd frontend
npm ci
npm run dev
```
A Vite fejlesztői szerver a `http://localhost:3000` címen érhető el, automatikus API proxyval a 8000-es portra.

### 5. Automatizált tesztek
```bash
cd backend
./venv/bin/python -m pytest -q
```
Lefedett területek: vig-mentesítés (hatványos, Shin, arányos), EV és Kelly, Monte Carlo és kalibráció, ESPN-árak feldolgozása rögzített mintán, hibaágak (ESPN-kiesés, hiányzó tabella és sérüléslista), a tippnapló és az elszámolás, az írásvédelem és a look-ahead védelem, az API végpontok. A frontendnek nincs automatikus tesztje (audit F11).

---

## Adatforrások és Üzleti Fenntarthatóság
- **Primer forrás:** az ESPN publikus Scoreboard, Summary és Standings végpontjai (ingyenes, DraftKings-árakkal). Nem hivatalos, dokumentálatlan API: rendelkezésre állási garancia nincs, kiesésnél az alkalmazás hibát jelez, és nem talál ki adatot.
- **Architektúra:** Adapter alapú réteg (`NBADataProvider`), így bármilyen fizetős vagy szindikált odds-feed (pl. The Odds API, Sportradar) zökkenőmentesen beköthető a rendszer átírása nélkül.
- **Felelős Játék:** Az alkalmazás döntéstámogató platformként funkcionál, nem végez automatikus fogadás-elhelyezést és nem ösztönöz meggondolatlan kockázatvállalásra.
