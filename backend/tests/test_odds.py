"""Az ESPN-árak feldolgozása valós mintán (tests/fixtures), alapértékek nélkül."""
import asyncio
import json
from pathlib import Path

import httpx
import pytest

from app.models.schemas import Game, OddsItem, Team
from app.providers.espn import ESPNProvider, parse_american_odds, parse_line, parse_odds
from app.services.prediction_service import PredictionService

FIXTURES = Path(__file__).parent / "fixtures"
SCOREBOARD = json.loads((FIXTURES / "espn_scoreboard_20261112.json").read_text(encoding="utf-8"))
PICKCENTER = json.loads((FIXTURES / "espn_pickcenter_401909977.json").read_text(encoding="utf-8"))


def rated_team(competitor):
    """Egységes, értékelhető csapat (minden csapat azonos), hogy a modell-tesztek ne a tabellától függjenek."""
    t = competitor["team"]
    return Team(id=t["id"], name=t["name"], display_name=t["displayName"], abbreviation=t["abbreviation"], logo=t.get("logo"),
                points_per_game=113.0, points_allowed_per_game=111.0, ortg=114.0, drtg=112.0, pace=99.0)


def game_for(short_name):
    ev = next(e for e in SCOREBOARD["events"] if e["shortName"] == short_name)
    standings = {c["id"]: rated_team(c) for c in ev["competitions"][0]["competitors"]}
    game = ESPNProvider()._parse_event_to_game(ev, standings)
    assert game is not None
    return game


@pytest.mark.parametrize("value,expected", [
    ("-437", 1.229), ("+341", 4.41), ("+343", 4.43), (-440, 1.227), (-440.0, 1.227), ("EVEN", 2.0), ("ev", 2.0),
    ("OFF", None), ("", None), (None, None), (0, None), ("0", None), ("-50", None), ("+99", None), (True, None), ("xyz", None),
])
def test_parse_american_odds(value, expected):
    assert parse_american_odds(value) == expected


@pytest.mark.parametrize("value,expected", [
    ("-10.5", -10.5), ("+10.5", 10.5), ("o221.5", 221.5), ("u221.5", 221.5), (221.5, 221.5), ("PK", None), (None, None), ("", None),
])
def test_parse_line(value, expected):
    assert parse_line(value) == expected


def test_scoreboard_real_prices_home_favorite():
    o = game_for("TOR @ PHI").odds
    assert (o.moneyline_home, o.moneyline_away) == (1.229, 4.41)          # -437 / +341, nem 1,77 / 2,10
    assert (o.spread, o.spread_home_odds, o.spread_away_odds) == (-10.5, 1.971, 1.855)
    assert (o.over_under, o.over_odds, o.under_odds) == (221.5, 1.952, 1.87)
    assert o.provider == "DraftKings"


def test_scoreboard_home_underdog_spread_is_home_perspective():
    o = game_for("DET @ WSH").odds
    assert o.spread == 10.5                                                # a hazai WSH +10,5
    assert (o.moneyline_home, o.moneyline_away) == (4.43, 1.227)


def test_unavailable_side_is_none_not_default():
    o = game_for("DAL @ MIN").odds
    assert o.over_odds == 1.909 and o.under_odds is None                    # "OFF"
    assert o.spread_home_odds is not None


def test_pickcenter_uses_same_parser():
    o = parse_odds(PICKCENTER)
    assert (o.moneyline_home, o.moneyline_away) == (4.43, 1.227)
    assert o.spread == 10.5 and (o.spread_home_odds, o.spread_away_odds) == (1.893, 1.926)
    assert (o.over_under, o.over_odds, o.under_odds) == (220.5, 1.893, 1.926)


def test_no_usable_odds_gives_none():
    assert parse_odds({}) is None
    assert parse_odds({"provider": {"name": "X"}, "details": "EVEN"}) is None


# --- a hibaág sem használhat kitalált árat ---
class FakeResp:
    def __init__(self, data, status=200):
        self.status_code, self._data = status, data

    def json(self):
        return self._data


class FakeClient:
    """A scoreboard működik, a summary és a tabella időtúllépést dob."""

    async def get(self, url, params=None):
        if url.endswith("/scoreboard"):
            return FakeResp(SCOREBOARD)
        raise httpx.ReadTimeout("időtúllépés")


def test_failed_summary_keeps_real_scoreboard_prices():
    provider = ESPNProvider()
    provider.client = FakeClient()
    game = asyncio.run(provider.get_game_details("401909976"))
    o = game.odds
    assert (o.moneyline_home, o.moneyline_away) == (1.229, 4.41)            # korábban: csendben 1,77 / 2,10
    assert o.spread_home_odds == 1.971


# --- a piacértékelés csak teljes adatból ad tippet ---
def make_game(**odds):
    t = lambda i: Team(id=i, name="T", display_name="T", abbreviation="T")
    return Game(id="1", date="2999-01-01T00:00Z", status="scheduled", home_team=t("h"), away_team=t("a"),
                odds=OddsItem(provider="DraftKings", **odds) if odds else None)


FULL = dict(spread=-3.5, spread_home_odds=1.9, spread_away_odds=1.9, over_under=225.5, over_odds=1.9, under_odds=1.9,
            moneyline_home=1.8, moneyline_away=2.1)


def markets(**overrides):
    game = make_game(**{**FULL, **overrides})
    return sorted(p.market for p in PredictionService().analyze_game(game).picks)


def test_complete_odds_give_all_markets():
    assert markets() == ["MONEYLINE", "MONEYLINE", "SPREAD", "SPREAD", "TOTAL_OVER", "TOTAL_UNDER"]


@pytest.mark.parametrize("override,missing", [
    (dict(spread_away_odds=None), "SPREAD"),
    (dict(spread=None), "SPREAD"),
    (dict(under_odds=None), "TOTAL"),
    (dict(over_under=None), "TOTAL"),
    (dict(moneyline_home=None), "MONEYLINE"),
])
def test_incomplete_market_is_skipped(override, missing):
    got = markets(**override)
    assert not any(m.startswith(missing) for m in got)
    assert len(got) == 4


def test_game_without_odds_has_no_picks():
    game = make_game()
    assert PredictionService().analyze_game(game).picks == []
