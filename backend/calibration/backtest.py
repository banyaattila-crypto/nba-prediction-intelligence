"""Az ÉLES tippgenerálás (PredictionService) visszamérése a szezon lejátszott meccsein.

Futtatás (a backend mappából):  ./venv/bin/python -B calibration/backtest.py [--weight W]
  --weight W: a modell súlya (alapérték: calibration.MODEL_WEIGHT); 1 = a nyers modell, a hihetőségi védelemmel

Minden meccshez csak az előtte lejátszott meccsekből számolt csapatértékelés (nincs look-ahead), a záró árakkal
és vonalakkal. A jelzett tippekre 1 egységes lapos tét, az eredményt a settlement.grade() számolja.
Korlát: a történelmi sérülések és pihenőnapok nincsenek meg, ezért a modell azok nélkül fut.
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.models.schemas import Game, OddsItem, Team  # noqa: E402
from app.quant import calibration  # noqa: E402
from app.providers.espn import estimate_ratings  # noqa: E402
from app.services.prediction_service import PredictionService  # noqa: E402
from app.services.settlement import grade, parse_pick_id, profit_loss  # noqa: E402

DATA = Path(__file__).with_name("season_games.json")
MIN_PRIOR_GAMES = 5
RNG = np.random.default_rng(20261112)


def iter_picks(games):
    """(tipp, meccs) párok a pontbeli csapatértékeléssel."""
    pf, pa, n = defaultdict(float), defaultdict(float), defaultdict(int)
    service = PredictionService()
    for g in games:
        h, a = g["home"], g["away"]
        if n[h] >= MIN_PRIOR_GAMES and n[a] >= MIN_PRIOR_GAMES:
            def team(abbr):
                pace, ortg, drtg = estimate_ratings(pf[abbr] / n[abbr], pa[abbr] / n[abbr])
                return Team(id=abbr, name=abbr, display_name=abbr, abbreviation=abbr, ortg=ortg, drtg=drtg, pace=pace)

            game = Game(id=g["id"], date="2999-01-01T00:00Z", status="scheduled", home_team=team(h), away_team=team(a),
                        odds=OddsItem(provider="DraftKings", **g["odds"]))
            for pick in service.analyze_game(game).picks:
                yield pick, g
        pf[h] += g["home_score"]; pa[h] += g["away_score"]; n[h] += 1
        pf[a] += g["away_score"]; pa[a] += g["home_score"]; n[a] += 1


def roi_with_ci(profits, reps=2000):
    p = np.array(profits, float)
    boots = [RNG.choice(p, size=len(p), replace=True).mean() for _ in range(reps)]
    return p.mean() * 100, np.percentile(boots, [2.5, 97.5]) * 100


def report(label, rows):
    if not rows:
        print(f"   {label:<34} n=0")
        return
    profits = [r[0] for r in rows]
    wins = sum(1 for r in rows if r[1] == "WON"); losses = sum(1 for r in rows if r[1] == "LOST"); pushes = len(rows) - wins - losses
    roi, ci = roi_with_ci(profits)
    print(f"   {label:<34} n={len(rows):>4}  {wins}-{losses}-{pushes}  ROI {roi:+6.1f}%  95% CI [{ci[0]:+.0f}%, {ci[1]:+.0f}%]")


def main():
    if "--weight" in sys.argv:
        calibration.MODEL_WEIGHT = float(sys.argv[sys.argv.index("--weight") + 1])
    print(f"Beállítás: modell súlya {calibration.MODEL_WEIGHT}, hihetőségi védelem {calibration.MAX_PLAUSIBLE_EDGE_PP} pp felett, szórás {calibration.MARGIN_SD}/{calibration.TOTAL_SD}")
    games = json.loads(DATA.read_text(encoding="utf-8"))["games"]
    flagged, everything, by_market, edges = [], [], defaultdict(list), []
    games_used = set()
    for pick, g in iter_picks(games):
        parsed = parse_pick_id(pick.id)
        result = grade(parsed[1], pick.line, g["home_score"], g["away_score"])
        if result is None:
            continue
        row = (profit_loss(result, 1.0, pick.bookmaker_odds), result)
        everything.append(row)
        games_used.add(g["id"])
        edges.append(pick.edge)
        if pick.verdict != "PASS":
            flagged.append(row)
            by_market[pick.market].append(row)
    print(f"Visszamérés: {len(games_used)} meccs (mindkét csapatnál >= {MIN_PRIOR_GAMES} előzetes meccs), {len(everything)} értékelt piac")
    print(f"Az eltérések eloszlása (pp): átlag {np.mean(edges):+.2f}, |eltérés| medián {np.median(np.abs(edges)):.1f}, 90. percentilis {np.percentile(np.abs(edges), 90):.1f}, max {np.max(np.abs(edges)):.1f}")
    print("\nHozam (lapos 1 egységes tét, záró szorzókon):")
    report("MINDEN piac (referencia: a vig)", everything)
    report("a modell JELZETT tippjei", flagged)
    for m in sorted(by_market):
        report(f"  ebből {m}", by_market[m])


if __name__ == "__main__":
    main()
