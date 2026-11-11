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
   - **Vig-mentesítés (Devigging):** Multiplikatív piaci árrés-eltávolítás a tiszta fair valószínűségek kinyeréséhez ($P_{\text{fair}}$).
   - **Monte Carlo Szimuláció:** Meccsenként 10 000 független vektorizált szimuláció (NumPy) normál ponteloszlással és tempókorrelációval.
   - **Él (Edge) és Várható Érték (EV):**
     $$\text{Edge} = P_{\text{modell}} - P_{\text{fair}}$$
     $$\text{EV} = [P_{\text{modell}} \cdot (\text{Odds} - 1) - (1 - P_{\text{modell}})] \cdot 100$$
   - **Bankroll-védelem:** 0.25x Fractional Kelly kritérium javaslat a tőke megőrzésére.
   - **Szigorú szűrés és "PASS" logika:** Ha nincs elegendő matematikai előny ($\text{Edge} < +2.0\%$ vagy magas a rotációs bizonytalanság), a rendszer jelzi: *"Nincs ajánlható tipp"*.

3. **Objektív Teljesítménymérés & Backtest:**
   - Időbélyegzett, megmásíthatatlan historikus tippnapló (zéró look-ahead bias).
   - Találati arány (Win Rate), Kumulált Unit P/L és ROI (Yield %).
   - **Brier-Score** (valószínűségi pontosság mérése).
   - **Kalibrációs görbe (Reliability Diagram):** A modell által jósolt valószínűségi sávok összevetése a tényleges nyerési aránnyal.
   - **Closing Line Value (CLV):** Záró oddsok verési aránya.

4. **Modern Mobilbarát UI:**
   - React + Vite + Tailwind CSS + Lucide Icons.
   - Sötét módú, profi sport-analitikai dizájn.
   - Részletes mérkőzés mélyelemző modal score-eloszlási hisztogrammal.

---

## Telepítés és Futtatás

### 1. Előfeltételek
- Python 3.12+
- Node.js 18+ és npm

### 2. Backend Futtatása
```bash
cd backend
source venv/bin/activate   # vagy ./venv/bin/python
python run.py
```
A backend alapértelmezetten a `http://localhost:8000` címen indul el, és automatikusan kiszolgálja mind a REST API-t (`/api/...`), mind az elkészült frontend felületet.

### 3. Frontend Fejlesztői Mód (Opcionális)
Ha a frontend forráskódját módosítani szeretnéd:
```bash
cd frontend
npm install
npm run dev
```
A Vite fejlesztői szerver a `http://localhost:3000` címen érhető el, automatikus API proxyval a 8000-es portra.

### 4. Automatizált Tesztek Futtatása
```bash
cd backend
PYTHONPATH=. ./venv/bin/pytest
```
Az összes egység- és integrációs teszt (13 db) lefut: EV-számítás, vig-mentesítés, Kelly-méretezés, Monte Carlo szimuláció, Brier-score és API végpontok.

---

## Adatforrások és Üzleti Fenntarthatóság
- **Primer forrás:** Hivatalos ESPN Scoreboard, Summary és Standings API-k (ingyenes, valós idejű, DraftKings/Caesars oddsokkal, magas rendelkezésre állás).
- **Architektúra:** Adapter alapú réteg (`NBADataProvider`), így bármilyen fizetős vagy szindikált odds-feed (pl. The Odds API, Sportradar) zökkenőmentesen beköthető a rendszer átírása nélkül.
- **Felelős Játék:** Az alkalmazás döntéstámogató platformként funkcionál, nem végez automatikus fogadás-elhelyezést és nem ösztönöz meggondolatlan kockázatvállalásra.
