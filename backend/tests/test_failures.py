"""Hibaágak: az ESPN kiesése vagy hiányos adata sosem vezethet kitalált meccsre, csapatra vagy sérüléslistára."""
import asyncio

import httpx
import pytest
from fastapi.testclient import TestClient

import app.main as main
from app.errors import DataSourceError, InsufficientDataError
from app.models.schemas import Game
from app.providers.espn import ESPNProvider
from app.services.prediction_service import PredictionService
from tests.test_odds import SCOREBOARD
from tests.test_security import make_game

HOME_ID = "20"  # PHI a rögzített mintában (TOR @ PHI, 401909976)
STANDINGS = {"children": [{"standings": {"entries": [
    {"team": {"id": "20", "displayName": "Philadelphia 76ers", "name": "76ers", "abbreviation": "PHI", "logos": [{"href": "x"}]},
     "stats": [{"name": "wins", "value": 8}, {"name": "losses", "value": 3}, {"name": "avgPointsFor", "value": 117.0}, {"name": "avgPointsAgainst", "value": 108.0}]},
]}}]}


class Resp:
    def __init__(self, data=None, status=200, bad_json=False):
        self.status_code, self._data, self._bad = status, data, bad_json

    def json(self):
        if self._bad:
            raise ValueError("nem JSON")
        return self._data


class Client:
    """Útvonal-végződés szerint válaszol; az Exception értékű útvonal kivételt dob."""

    def __init__(self, routes):
        self.routes = routes

    async def get(self, url, params=None):
        for suffix, result in self.routes.items():
            if url.endswith(suffix):
                if isinstance(result, Exception):
                    raise result
                return result
        raise httpx.ReadTimeout("nincs ilyen útvonal")


def provider_with(**routes):
    p = ESPNProvider()
    p.client = Client({"/" + k: v for k, v in routes.items()})
    return p


TIMEOUT = httpx.ReadTimeout("időtúllépés")
run = asyncio.run


# --- scoreboard ---
@pytest.mark.parametrize("scoreboard,fragment", [
    (TIMEOUT, "nem érhető el"),
    (Resp(status=500), "500"),
    (Resp(bad_json=True), "nem értelmezhető"),
])
def test_scoreboard_failure_raises_instead_of_inventing_games(scoreboard, fragment):
    p = provider_with(scoreboard=scoreboard, standings=TIMEOUT)
    with pytest.raises(DataSourceError, match=fragment):
        run(p.get_today_games())


def test_empty_scoreboard_is_a_valid_empty_day():
    p = provider_with(scoreboard=Resp({"events": []}), standings=TIMEOUT)
    assert run(p.get_today_games()) == []


def test_failure_is_not_cached():
    p = provider_with(scoreboard=TIMEOUT, standings=TIMEOUT)
    with pytest.raises(DataSourceError):
        run(p.get_today_games())
    p.client = Client({"/scoreboard": Resp(SCOREBOARD), "/standings": TIMEOUT})
    assert len(run(p.get_today_games())) == 4


def test_no_fabricated_fallback_games_exist():
    assert not hasattr(ESPNProvider, "_generate_fallback_games")


# --- tabella ---
def test_standings_failure_keeps_last_successful_standings():
    p = provider_with(standings=Resp(STANDINGS))
    first = run(p.get_team_standings())
    assert first["PHI"].has_ratings and first["PHI"].record == "8-3"
    p._standings_timestamp -= 3600                       # lejárt a gyorsítótár
    p.client = Client({"/standings": TIMEOUT})
    assert run(p.get_team_standings()) is first          # nem üres, nem kitalált: a legutóbbi sikeres


def test_standings_unavailable_without_history_is_empty():
    assert run(provider_with(standings=TIMEOUT).get_team_standings()) == {}


def test_team_missing_from_standings_has_no_invented_stats():
    p = provider_with(scoreboard=Resp(SCOREBOARD), standings=TIMEOUT)
    game = next(g for g in run(p.get_today_games()) if g.id == "401909976")
    for team in (game.home_team, game.away_team):
        assert team.has_ratings is False
    assert (game.home_team.wins + game.home_team.losses) == sum(int(x) for x in game.home_team.record.split("-"))  # a rekord a forrásból jön


def test_unrated_game_is_not_analysed():
    p = provider_with(scoreboard=Resp(SCOREBOARD), standings=TIMEOUT)
    game = run(p.get_today_games())[0]
    with pytest.raises(InsufficientDataError):
        PredictionService().analyze_game(game)


# --- sérüléslista ---
def summary_with_injury():
    return {"injuries": [{"team": {"id": HOME_ID}, "injuries": [
        {"athlete": {"displayName": "Joel Tester", "position": {"abbreviation": "C"}}, "status": "Out", "details": {"detail": "Térd"}}]}]}


def test_injuries_known_only_after_a_successful_summary():
    ok = provider_with(scoreboard=Resp(SCOREBOARD), standings=TIMEOUT, summary=Resp(summary_with_injury()))
    game = run(ok.get_game_details("401909976"))
    assert game.injuries_known is True and [i.player_name for i in game.injuries_home] == ["Joel Tester"]

    failing = provider_with(scoreboard=Resp(SCOREBOARD), standings=TIMEOUT, summary=TIMEOUT)
    game = run(failing.get_game_details("401909976"))
    assert game.injuries_known is False and game.injuries_home == []


def test_failed_summary_is_not_cached():
    p = provider_with(scoreboard=Resp(SCOREBOARD), standings=TIMEOUT, summary=TIMEOUT)
    assert run(p.get_game_details("401909976")).injuries_known is False
    p.client = Client({"/scoreboard": Resp(SCOREBOARD), "/standings": TIMEOUT, "/summary": Resp(summary_with_injury())})
    assert run(p.get_game_details("401909976")).injuries_known is True


@pytest.mark.parametrize("known,expected", [(False, True), (True, False)])
def test_analysis_says_when_injuries_are_unknown(known, expected):
    game = make_game("1")
    game.injuries_known = known
    factors = PredictionService().analyze_game(game).key_factors
    assert any("sérüléslista nem érhető el" in f for f in factors) is expected


# --- az API 503-mal jelez, nem hazudik ---
def api(provider, monkeypatch):
    monkeypatch.setattr(main, "provider", provider)
    return TestClient(main.app)


@pytest.mark.parametrize("url", ["/api/games", "/api/picks", "/api/picks/top", "/api/games/401909976"])
def test_api_returns_503_when_espn_is_down(monkeypatch, url):
    r = api(provider_with(scoreboard=TIMEOUT, standings=TIMEOUT, summary=TIMEOUT), monkeypatch).get(url)
    assert r.status_code == 503 and "ESPN" in r.json()["detail"]


def test_api_without_standings_still_lists_games_but_does_not_evaluate_them(monkeypatch):
    c = api(provider_with(scoreboard=Resp(SCOREBOARD), standings=TIMEOUT, summary=TIMEOUT), monkeypatch)
    games = c.get("/api/games")
    assert games.status_code == 200 and len(games.json()) == 4 and not games.json()[0]["home_team"]["has_ratings"]
    for url in ("/api/picks", "/api/picks/top", "/api/games/401909976", "/api/standings"):
        r = c.get(url)
        assert r.status_code == 503, url
        assert "statisztika" in r.json()["detail"] or "tabella" in r.json()["detail"], url


def test_api_with_empty_day_returns_empty_lists(monkeypatch):
    c = api(provider_with(scoreboard=Resp({"events": []}), standings=Resp(STANDINGS)), monkeypatch)
    assert c.get("/api/games").json() == [] and c.get("/api/picks").json() == []
