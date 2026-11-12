"""A modell kalibrálása és kiértékelése a szezon lejátszott meccsein (calibration/season_games.json).

Futtatás (a backend mappából):  ./venv/bin/python -B calibration/analyze.py

Mit mér:
  A. a piac hibáját: a tényleges különbség és összpontszám szórása a záró vonal körül (=> Monte Carlo szórás)
  B. a jelenlegi modellt PONTBELI csapatértékeléssel (egy meccsnél csak az előtte lejátszott meccsek számítanak,
     nincs look-ahead): mennyire pontos a piachoz képest, és mekkora súllyal érdemes a piaci vonalhoz keverni
  C. a csapatértékelés zsugorítását a ligaátlag felé (szezon eleji zajos pontátlagok ellen)
  D. a vig-mentesítési módszereket (arányos, Shin, hatványos): melyik becsüli jobban a tényleges kimenetelt
A bizonytalanságot bootstrap adja (2000 újramintavétel, rögzített mag).
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
from scipy.optimize import brentq
from scipy.stats import norm

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.models.schemas import Team  # noqa: E402
from app.providers.espn import estimate_ratings  # noqa: E402
from app.quant.ratings import calculate_matchup_ratings  # noqa: E402
from app.quant.shin import shin_devig_two_way  # noqa: E402

DATA = Path(__file__).with_name("season_games.json")
MIN_PRIOR_GAMES = 5          # ennyi előzetes meccs kell mindkét csapatnál a modell értékeléséhez
RNG = np.random.default_rng(20261112)


def load():
    return json.loads(DATA.read_text(encoding="utf-8"))["games"]


def devig(a: float, b: float) -> float:
    pa, pb = 1 / a, 1 / b
    return pa / (pa + pb)


def point_in_time_predictions(games, shrink_games: float):
    """Minden meccshez a modell várható különbsége/összpontszáma csak a korábbi meccsekből.

    shrink_games = k: a csapat pontátlagát (n·átlag + k·ligaátlag) / (n + k) szerint húzzuk a ligaátlag felé.
    """
    pf, pa, n = defaultdict(float), defaultdict(float), defaultdict(int)
    league_pts, league_games = 0.0, 0
    rows = []
    for g in games:
        h, a = g["home"], g["away"]
        if n[h] >= MIN_PRIOR_GAMES and n[a] >= MIN_PRIOR_GAMES and league_games > 0:
            league = league_pts / league_games / 2          # átlagos csapatpont meccsenként

            def team(abbr):
                k = shrink_games
                ppg = (pf[abbr] + k * league) / (n[abbr] + k)
                opp = (pa[abbr] + k * league) / (n[abbr] + k)
                pace, ortg, drtg = estimate_ratings(ppg, opp)
                return Team(id=abbr, name=abbr, display_name=abbr, abbreviation=abbr, ortg=ortg, drtg=drtg, pace=pace)

            m = calculate_matchup_ratings(team(h), team(a), [], [], 1, 1, False, False)
            o = g["odds"]
            rows.append({
                "g": g, "model_margin": m["expected_margin"], "model_total": m["expected_total"],
                "mkt_margin": -o["spread"], "mkt_total": o["over_under"],
                "margin": g["home_score"] - g["away_score"], "total": g["home_score"] + g["away_score"],
            })
        pf[h] += g["home_score"]; pa[h] += g["away_score"]; n[h] += 1
        pf[a] += g["away_score"]; pa[a] += g["home_score"]; n[a] += 1
        league_pts += g["home_score"] + g["away_score"]; league_games += 1
    return rows


def best_weight(actual, market, model):
    """w, amely minimalizálja Σ(tényleges − (piac + w·(modell − piac)))²; zárt alakban."""
    d = model - market
    return float(np.sum((actual - market) * d) / np.sum(d * d))


def bootstrap_weight(actual, market, model, reps=2000):
    idx = np.arange(len(actual))
    ws = []
    for _ in range(reps):
        s = RNG.choice(idx, size=len(idx), replace=True)
        ws.append(best_weight(actual[s], market[s], model[s]))
    return np.percentile(ws, [2.5, 97.5])


def rmse(x):
    return float(np.sqrt(np.mean(np.square(x))))


def devig_comparison(games):
    """D. Moneyline: a hazai győzelem vig-mentes valószínűsége vs. a tényleges kimenetel, módszerenként."""
    def multiplicative(a, b):
        return (1 / a) / (1 / a + 1 / b)

    def shin(a, b):
        return shin_devig_two_way(a, b)[0]

    def power(a, b):  # p_i = q_i^k, sum = 1
        q = np.array([1 / a, 1 / b])
        k = brentq(lambda x: float((q ** x).sum() - 1.0), 1.0, 30.0)
        return float(q[0] ** k)

    rows = [(g["odds"]["moneyline_home"], g["odds"]["moneyline_away"], 1.0 if g["home_score"] > g["away_score"] else 0.0)
            for g in games if g["odds"].get("moneyline_home") and g["odds"].get("moneyline_away")]
    y = np.array([r[2] for r in rows])
    methods = {"arányos": multiplicative, "Shin": shin, "hatványos": power}
    probs = {name: np.array([f(a, b) for a, b, _ in rows]) for name, f in methods.items()}
    log_loss = lambda p: -(y * np.log(p) + (1 - y) * np.log(1 - p))
    brier = lambda p: (p - y) ** 2
    lopsided = np.array([max(multiplicative(a, b), 1 - multiplicative(a, b)) > 0.70 for a, b, _ in rows])

    print("\nD. VIG-MENTESÍTÉSI MÓDSZEREK (moneyline, hazai győzelem)")
    print(f"   n={len(rows)}, ebből lopsided (favorit > 70%): {int(lopsided.sum())}")
    print(f"   {'módszer':<10} {'log-loss':>9} {'Brier':>8} | {'Δ log-loss az arányoshoz':>26} {'95% CI':>20} | {'Δ csak lopsided':>16}")
    base = log_loss(probs["arányos"])
    for name, p in probs.items():
        d = log_loss(p) - base
        boots = [RNG.choice(d, size=len(d), replace=True).mean() for _ in range(2000)]
        lo, hi = np.percentile(boots, [2.5, 97.5])
        print(f"   {name:<10} {log_loss(p).mean():>9.4f} {brier(p).mean():>8.4f} | {d.mean():>+26.5f} [{lo:+.4f},{hi:+.4f}] | {d[lopsided].mean():>+16.5f}")
    print("   (negatív Δ = jobb az arányosnál; ha a CI tartalmazza a nullát, a különbség nem kimutatható)")
    d = log_loss(probs["hatványos"]) - log_loss(probs["Shin"])
    boots = [RNG.choice(d, size=len(d), replace=True).mean() for _ in range(2000)]
    lo, hi = np.percentile(boots, [2.5, 97.5])
    print(f"   hatványos vs Shin (páros): Δ log-loss {d.mean():+.5f} [{lo:+.4f},{hi:+.4f}]  ({'a hatványos jobb' if hi < 0 else 'a Shin jobb' if lo > 0 else 'nem kimutatható különbség'})")


def main():
    games = load()
    print(f"Adat: {len(games)} meccs, {games[0]['date'][:10]} .. {games[-1]['date'][:10]}")

    # ---------- A. a piac hibája ----------
    margin = np.array([g["home_score"] - g["away_score"] for g in games], float)
    total = np.array([g["home_score"] + g["away_score"] for g in games], float)
    spread = np.array([g["odds"]["spread"] for g in games], float)
    line = np.array([g["odds"]["over_under"] for g in games], float)
    r_m, r_t = margin + spread, total - line
    print("\nA. A PIAC HIBÁJA (tényleges - záró vonal)")
    print(f"   különbség: átlag {r_m.mean():+.2f} (hazai torzítás), szórás {r_m.std(ddof=1):.2f}  [n={len(r_m)}]")
    print(f"   összpont : átlag {r_t.mean():+.2f}, szórás {r_t.std(ddof=1):.2f}")
    sd_m, sd_t = r_m.std(ddof=1), r_t.std(ddof=1)
    print(f"   korreláció (különbség- és összpont-hiba): {np.corrcoef(r_m, r_t)[0, 1]:+.2f}")

    ml = [(g, devig(g["odds"]["moneyline_home"], g["odds"]["moneyline_away"])) for g in games if g["odds"].get("moneyline_home") and g["odds"].get("moneyline_away")]
    y = np.array([1.0 if g["home_score"] > g["away_score"] else 0.0 for g, _ in ml])
    p_mkt = np.array([p for _, p in ml])
    p_phi = norm.cdf(np.array([-g["odds"]["spread"] for g, _ in ml]) / sd_m)
    print(f"   hazai győzelem, Brier: piaci ML (arányos vig-mentesítés) {np.mean((p_mkt - y) ** 2):.4f} | Φ(-vonal/σ={sd_m:.1f}) {np.mean((p_phi - y) ** 2):.4f} | érmefeldobás 0.2500  [n={len(y)}]")
    big = [(-g["odds"]["spread"], p) for g, p in ml if abs(g["odds"]["spread"]) >= 3]
    implied = [s / norm.ppf(p) for s, p in big if 0.05 < p < 0.95 and norm.ppf(p) != 0]
    print(f"   a piaci ML-ből implikált σ (|vonal|>=3): medián {np.median(implied):.1f}  [n={len(implied)}]")

    # ---------- B/C. a modell pontbeli értékelése, zsugorítással ----------
    print("\nB/C. A MODELL (pontbeli csapatértékelés, sérülés/pihenő nélkül) a piachoz képest")
    print(f"   {'k':>4} {'n':>4} | {'RMSE különbség: modell':>24} {'piac':>7} | {'w (különbség)':>14} {'95% CI':>16} | {'RMSE összpont: modell':>22} {'piac':>7} | {'w (összpont)':>13} {'95% CI':>16}")
    best = None
    for k in (0, 5, 10, 20, 40, 80):
        rows = point_in_time_predictions(games, k)
        a_m = np.array([r["margin"] for r in rows], float); mk_m = np.array([r["mkt_margin"] for r in rows]); md_m = np.array([r["model_margin"] for r in rows])
        a_t = np.array([r["total"] for r in rows], float); mk_t = np.array([r["mkt_total"] for r in rows]); md_t = np.array([r["model_total"] for r in rows])
        w_m, w_t = best_weight(a_m, mk_m, md_m), best_weight(a_t, mk_t, md_t)
        ci_m, ci_t = bootstrap_weight(a_m, mk_m, md_m), bootstrap_weight(a_t, mk_t, md_t)
        print(f"   {k:>4} {len(rows):>4} | {rmse(a_m - md_m):>24.2f} {rmse(a_m - mk_m):>7.2f} | {w_m:>14.3f} [{ci_m[0]:+.2f},{ci_m[1]:+.2f}] | {rmse(a_t - md_t):>22.2f} {rmse(a_t - mk_t):>7.2f} | {w_t:>13.3f} [{ci_t[0]:+.2f},{ci_t[1]:+.2f}]")
        if best is None or rmse(a_m - md_m) < best[0]:
            best = (rmse(a_m - md_m), k, w_m, w_t, ci_m, ci_t)
    print(f"\n   legjobb zsugorítás (a modell különbség-RMSE-je szerint): k={best[1]}")
    devig_comparison(games)
    print(f"\nJAVASOLT PARAMÉTEREK: MARGIN_SD={sd_m:.1f}  TOTAL_SD={sd_t:.1f}  RATING_SHRINK_GAMES={best[1]}  "
          f"MARGIN_MODEL_WEIGHT={max(0.0, best[2]):.2f}  TOTAL_MODEL_WEIGHT={max(0.0, best[3]):.2f}")


if __name__ == "__main__":
    main()
