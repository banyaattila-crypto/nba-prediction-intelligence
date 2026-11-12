"""Az API alapvégpontjai, offline: kitalált szolgáltatóval és átirányított naplóval (nem függ az élő ESPN-től)."""
import pytest
from fastapi.testclient import TestClient

import app.main as main
import app.services.tracker_service as ts
from app.models.schemas import Team
from tests.test_security import make_game
from tests.test_tracker import StubProvider


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(ts, "DATA_FILE_PATH", str(tmp_path / "ledger.json"))
    monkeypatch.setattr(main, "tracker_service", ts.TrackerService())
    stub = StubProvider([make_game("200"), make_game("201", status="final")])
    stub.standings = {"1": Team(id="1", name="A", display_name="Alpha", abbreviation="ALP", wins=5, losses=2),
                      "ALP": Team(id="1", name="A", display_name="Alpha", abbreviation="ALP", wins=5, losses=2),
                      "2": Team(id="2", name="B", display_name="Beta", abbreviation="BET", wins=9, losses=1)}
    monkeypatch.setattr(main, "provider", stub)
    return TestClient(main.app)


def test_health_endpoint(client):
    data = client.get("/api/health").json()
    assert data["status"] == "online" and "quant_engine" in data


def test_games_endpoint(client):
    games = client.get("/api/games").json()
    assert [g["id"] for g in games] == ["200", "201"]
    assert "home_team" in games[0] and "away_team" in games[0]


def test_performance_endpoint_on_empty_ledger(client):
    perf = client.get("/api/performance").json()
    assert perf["total_picks"] == 0 and perf["brier_score"] is None and perf["clv_positive_rate"] is None
    assert {"win_rate", "roi_percent", "calibration_data"} <= set(perf)


def test_picks_cover_only_the_scheduled_game(client):
    picks = client.get("/api/picks").json()
    assert len(picks) == 6 and {p["game_id"] for p in picks} == {"200"}


def test_top_picks_endpoint(client):
    for p in client.get("/api/picks/top").json():
        assert p["verdict"] in ("STRONG_VALUE", "VALUE") and "edge" in p and "ev" in p


def test_standings_endpoint_lists_each_team_once_best_first(client):
    teams = client.get("/api/standings").json()
    assert [t["abbreviation"] for t in teams] == ["BET", "ALP"]
