"""A szezon lejátszott meccseinek gyűjtése az ESPN publikus API-járól: végeredmény + záró vonalak.

Újrafuttatás (a backend mappából):  ./venv/bin/python -B calibration/collect.py [kezdő_nap] [utolsó_nap]
Kimenet: calibration/season_games.json  (a szezon eddigi lejátszott meccsei, nap szerint rendezve)

Az árakat ugyanaz a parse_odds() dolgozza fel, mint az éles kódban. Udvarias tempó: ~4 kérés/másodperc.
"""
import json
import sys
import time
import urllib.request
from datetime import date, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.providers.espn import parse_odds  # noqa: E402

BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba"
HEADERS = {"User-Agent": "Mozilla/5.0 (NBA-Intel/1.0)"}
OUT = Path(__file__).with_name("season_games.json")


def get(url: str):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=30) as r:
                return json.load(r)
        except Exception as e:  # hálózati hiba: újrapróbál
            err = e
            time.sleep(1.5 * (attempt + 1))
    print(f"  hiba: {url[-60:]} ({err})", flush=True)
    return None


def main(first: date, last: date) -> None:
    games, skipped_no_odds = [], 0
    day = first
    while day <= last:
        sb = get(f"{BASE}/scoreboard?dates={day:%Y%m%d}")
        events = [e for e in (sb or {}).get("events", []) if e["status"]["type"]["state"] == "post"]
        for ev in events:
            time.sleep(0.25)
            comp = ev["competitions"][0]
            home = next(c for c in comp["competitors"] if c["homeAway"] == "home")
            away = next(c for c in comp["competitors"] if c["homeAway"] == "away")
            summary = get(f"{BASE}/summary?event={ev['id']}")
            pickcenter = (summary or {}).get("pickcenter") or []
            odds = parse_odds(pickcenter[0]) if pickcenter else None
            if odds is None or odds.spread is None or odds.over_under is None:
                skipped_no_odds += 1
                continue
            games.append({
                "id": ev["id"], "date": ev["date"],
                "home": home["team"]["abbreviation"], "away": away["team"]["abbreviation"],
                "home_score": int(home["score"]), "away_score": int(away["score"]),
                "odds": {k: v for k, v in odds.model_dump().items() if k not in ("provider", "timestamp")},
            })
        print(f"{day:%Y-%m-%d}: {len(events)} lejátszott meccs, eddig {len(games)} használható", flush=True)
        day += timedelta(days=1)
        time.sleep(0.25)
    games.sort(key=lambda g: g["date"])
    OUT.write_text(json.dumps({"collected": datetime.utcnow().strftime("%Y-%m-%dT%H:%MZ"), "games": games}, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"KÉSZ: {len(games)} meccs mentve ({skipped_no_odds} kihagyva ár nélkül) -> {OUT}", flush=True)


if __name__ == "__main__":
    first = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else date(2026, 10, 18)
    last = date.fromisoformat(sys.argv[2]) if len(sys.argv) > 2 else date(2026, 11, 11)
    main(first, last)
