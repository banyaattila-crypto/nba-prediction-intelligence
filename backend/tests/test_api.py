import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "quant_engine" in data

def test_games_endpoint():
    response = client.get("/api/games")
    assert response.status_code == 200
    games = response.json()
    assert isinstance(games, list)
    assert len(games) > 0
    first_game = games[0]
    assert "home_team" in first_game
    assert "away_team" in first_game

def test_performance_endpoint():
    response = client.get("/api/performance")
    assert response.status_code == 200
    perf = response.json()
    assert "total_picks" in perf
    assert "win_rate" in perf
    assert "roi_percent" in perf
    assert "calibration_data" in perf

def test_top_picks_endpoint():
    response = client.get("/api/picks/top")
    assert response.status_code == 200
    picks = response.json()
    assert isinstance(picks, list)
    for p in picks:
        assert p["verdict"] in ("STRONG_VALUE", "VALUE")
        assert "edge" in p
        assert "ev" in p
