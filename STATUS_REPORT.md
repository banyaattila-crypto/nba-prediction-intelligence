# NBA Prediction & Betting Intelligence App — Állapotjelentés (Status Report)

**Dátum:** 2026. november 11.  
**Verzió:** 1.0.0 (MVP)  
**Státusz:** Működőképes, tesztelt produkciós prototípus  

---

## 1. Vezetői Összefoglaló (Executive Summary)

A projekt célja egy olyan modern, mobilbarát és szigorúan adatvezérelt NBA döntéstámogató alkalmazás kifejlesztése volt, amely nem véletlenszerű vagy fekete doboz tippeket ad, hanem:
1. Matematikailag modellezi a mérkőzések kimenetelét (10 000 futásos Monte Carlo szimulációval).
2. Eltávolítja a bukmékeri árrést (Vig / Juice), hogy a tiszta fair piaci valószínűségeket kapjuk meg.
3. Pozitív várható értékű (+EV) lehetőségeket azonosít transzparens él (Edge) és várható érték számításokkal.
4. Ha nincs statisztikai előny, kategorikusan jelzi a mérkőzés/piac elkerülését („Nincs ajánlható él / PASS”).
5. Brier-score, megbízhatósági kalibrációs görbe és CLV (Closing Line Value) metrikákkal auditálhatóvá teszi a teljesítményt.

Az MVP fejlesztési és tesztelési fázisa sikeresen lezárult. A rendszer valós idejű NBA adatokból dolgozik.

---

## 2. Elvégzett Feladatok és Komponensek

### A. Piackutatás és Benchmark Elemzés
- Részletesen kielemeztük a megadott referenciaalkalmazásokat:
  - **BettingPros: Picks & Odds** *(FantasyPros / BettingPros)*
  - **BetsWall Sports Betting Tips** *(BetsWall Ltd)*
  - **NBA tippek** *(FindYourBets / NerdyTips)*
  - **Basketball Betting Tips & Odds** *(Loheden AI Solutions AB)*
  - **Kvantitatív etalonok:** Dimers & OddsJam (Devigging, Monte Carlo szimulációk, CLV)
- Elkészült a referencia-összehasonlító mátrix, a legjobb UX-megoldások átvétele és a félrevezető elemek (pl. csillagos önkényes bizalom, „biztos tipp” narratíva) kizárása.

### B. Adatarchitektúra és Adapter Réteg
- **Adapter minta:** `NBADataProvider` absztrakt interfész, amely lehetővé teszi tetszőleges új forrás (pl. The Odds API, Sportradar) bekötését.
- **ESPN Public Data Adapter:**
  - Valós idejű meccsmenetrend, állapotok (Scheduled, Live Q1-Q4, Final), helyi időzónás kezdések.
  - Hivatalos sérülésjelentések (Out, Questionable, Day-to-Day) mindkét csapatra.
  - Valós idejű DraftKings / Caesars oddsok (Moneyline, Spread, Over/Under).
  - 30 csapat ligatáblázata, pontátlagai, kapott pontjai és differenciálja.
  - Beépített in-memory gyorstárazás (cache) a hálózati terhelés minimalizálására.
  - Offline tesztelési fallback mechanizmus.

### C. Kvantitatív Modellező Motor (`quant/`)
- **Dinamikus Csapaterősség és Tempó:**
  - Offensive Rating (ORtg) és Defensive Rating (DRtg) ligaátlaghoz viszonyítva.
  - Várható meccstempó (Pace) számítás 48 perces birtoklásokra.
  - Hazai pálya előny (Home Court Advantage: +2.2 pont / 100 birtoklás).
  - Pihenőnapok és Back-to-Back (B2B) fáradtsági büntetések (-1.8 hazai, -2.2 idegenbeli B2B levonás).
  - Sérülés-súlyozási modell (sztárjátékosok VORP/BPM hatása, Questionable státusz bizonytalansági indexe).
- **10 000 Futásos Vektorizált Monte Carlo Szimuláció:**
  - NumPy alapú gyors szimuláció (<10 ms).
  - Pontszórás és tempó-kovariancia kezelése ($\sigma \approx 11.5$).
  - Pontos Spread fedési és Over/Under CDF valószínűségi eloszlások generálása hisztogrammal.
- **Piaci Árrés Eltávolítás (Devigging) és Várható Érték (EV):**
  - Multiplikatív és normált piaci vig-mentesítés ($P_{\text{fair}}$).
  - Várható Érték: $\text{EV} = [P_{\text{modell}} \cdot (\text{Odds} - 1) - (1 - P_{\text{modell}})] \cdot 100$.
  - Él: $\text{Edge} = P_{\text{modell}} - P_{\text{fair}}$.
  - Bankroll-védelem: **0.25x Fractional Kelly** méretezés (0.5 – 2.5 egység).
- **Backtesting & Kalibráció:**
  - Brier-Score kalkulátor ($0 \le \text{BS} \le 0.25$).
  - Kalibrációs görbe (Reliability diagram) 5 valószínűségi sávban (40-50%, 50-60%, 60-70%, 70-80%, 80-100%).
  - Megmásíthatatlan historikus tippnapló (JSON audit ledger).

### D. REST API Réteg (`backend/`)
- FastAPI keretrendszer Python 3.12-ben:
  - `GET /api/games`: Napi mérkőzések és élő státusz.
  - `GET /api/games/{id}`: Részletes kvantitatív mérkőzéselemzés 10 000 szimulációval és sérülésekkel.
  - `GET /api/picks`: Értékelt piacok szűrőkkel (piac, min. EV, min. Edge, csak value).
  - `GET /api/picks/top`: Napi legjobb +EV lehetőségek kiemelése.
  - `POST /api/picks/track`: Virtuális bankroll követés (paper trading).
  - `GET /api/performance`: Brier-score, ROI, találati arány és kalibrációs görbe.
  - `GET /api/standings`: 30 NBA csapat hatékonysági mutatói.
  - `GET /api/health`: Rendszer- és kvantitatív motor diagnosztika.
  - Single-binary jellegű frontend kiszolgálás (`dist/` közvetlen mountolása).

### E. Modern Mobilbarát Frontend (`frontend/`)
- React 18, Vite 6, Tailwind CSS, Lucide ikonok.
- Reszponzív, modern sötét dizájn (Dark Sports-Analytics téma).
- Nézetek:
  1. **Napi Meccsek (Daily Slate):** Meccskártyák valós oddsokkal, kezdési idővel, élő eredményekkel és legfontosabb előrejelzéssel.
  2. **Részletes Elemző Modal:** 10 000 szimulációs eloszlási hisztogram, sérülésjelentések, kulcsfaktorok, piacok elemzése.
  3. **Érték Tippek (+EV):** Piacszűrő, minimális él/EV csúszkák, Kelly tétméret, transzparens szöveges indoklások.
  4. **Validáció & Backtest:** Kumulált unit profit, ROI %, találati arány, Brier-score, kalibrációs diagram, historikus tippnapló.
  5. **Tabella & Csapatstatisztikák:** Rendezhető mutatók (ORtg, DRtg, Net Rating, Pace, W-L).
  6. **Kvantitatív Módszertan & Felelős Játék Modal:** Matematikai képletek magyarázata és pénzügyi kockázati figyelmeztetés.

---

## 3. Tesztelési és Minőségbiztosítási Eredmények

Az automatizált Pytest tesztek lefutottak:

```
======================== 13 passed, 1 warning in 4.23s =========================
```

- **Matematikai tesztek:** American -> Decimal odds konverzió, Vig-mentesítés (kétesélyes piacok), Edge %, EV %, Fractional Kelly tétméretezés.
- **Modell tesztek:** Monte Carlo szimuláció eloszlásai, sérülési büntetések, Brier-score kalkuláció.
- **Integrációs tesztek:** Health, Games, Top Picks és Performance végpontok válaszstruktúrája és validációja.
- **Frontend build:** Hiba nélküli Vite production build (`dist/assets/`).

---

## 4. Jelenlegi Működési Környezet

- **Helyi elérhetőség:** `http://localhost:8000` (egy paranccsal futtatható a backendből: `python run.py`).
- **Git állapot:** Kezdeti verzió előkészítve a GitHub push-ra.
- **Adatforrás státusz:** Élő ESPN kapcsolat aktív, valós DraftKings szorzókkal.

---

## 5. Következő Mérföldkövek (Roadmap)

1. **Játékos Props Modell:** Játékos-pontok, lepattanók, gólpasszok (PRA) szimulációja várható játékpercek alapján.
2. **The Odds API másodlagos adapter:** Több európai és amerikai bukméker (Pinnacle, bet365, FanDuel) egyidejű összehasonlítása.
3. **Automatikus eredmény-kiértékelő háttérfolyamat (Cron job):** A lezárult mérkőzések után automatikusan frissülő napló és CLV számítás.
4. **PWA (Progressive Web App) támogatás:** Telepíthető mobilalkalmazás-ikon és offline értesítések.
