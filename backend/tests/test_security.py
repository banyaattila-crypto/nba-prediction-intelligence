from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

import app.main as main
import app.services.tracker_service as ts
from app.models.schemas import Game, OddsItem, Team
from tests.test_tracker import StubProvider

LOCAL = ("127.0.0.1", 50000)
REMOTE = ("203.0.113.7", 50000)


def make_game(game_id, hours_from_now=5, status="scheduled", odds=True):
    t = lambda i: Team(id=i, name="T", display_name="T", abbreviation="T")
    start = (datetime.now(timezone.utc) + timedelta(hours=hours_from_now)).strftime("%Y-%m-%dT%H:%MZ")
    return Game(
        id=game_id, date=start, status=status, home_team=t("h"), away_team=t("a"),
        odds=OddsItem(provider="t", spread=-3.5, spread_home_odds=1.91, spread_away_odds=1.91, over_under=225.5, over_odds=1.91,
                      under_odds=1.91, moneyline_home=1.8, moneyline_away=2.1) if odds else None,
    )


@pytest.fixture
def env(tmp_path, monkeypatch):
    """Átirányított napló, kitalált szolgáltató; a TestClient helyi gépről, localhost Host fejléccel hív."""
    monkeypatch.delenv("API_WRITE_TOKEN", raising=False)
    monkeypatch.setattr(ts, "DATA_FILE_PATH", str(tmp_path / "ledger.json"))
    svc = ts.TrackerService()
    games = [
        make_game("200"),                              # induló
        make_game("201", hours_from_now=-2),           # "scheduled", de az időpontja elmúlt
        make_game("202", status="final"),              # lejátszott
        make_game("203", odds=False),                  # ár nélkül
    ]
    monkeypatch.setattr(main, "tracker_service", svc)
    monkeypatch.setattr(main, "provider", StubProvider(games))
    return svc


def local(base="http://localhost:8000", client=LOCAL):
    return TestClient(main.app, base_url=base, client=client)


# --- a rögzítés a szerver adatait használja ---
def test_track_records_server_values_not_client_values(env):
    r = local().post("/api/picks/track", json={"pick_id": "200_ML_HOME", "units": 2.0, "odds": 99.0, "model_prob": 0.99, "ev": 999})
    assert r.status_code == 200
    row = env.get_history()[0]
    assert row.odds == 1.8 and row.model_prob != 0.99 and row.ev != 999 and row.units_staked == 2.0


@pytest.mark.parametrize("units", [0, -5, 5.01, 1e9])
def test_track_rejects_invalid_units(env, units):
    assert local().post("/api/picks/track", json={"pick_id": "200_ML_HOME", "units": units}).status_code == 422
    assert env.get_history() == []


@pytest.mark.parametrize("pick_id,status", [
    ("nincs_ilyen", 422),
    ("999_ML_HOME", 404),     # ismeretlen meccs
    ("201_ML_HOME", 409),     # az időpont elmúlt
    ("202_ML_HOME", 409),     # lejátszott
    ("203_ML_HOME", 404),     # nincs piaci ár
])
def test_track_rejects_unavailable_picks(env, pick_id, status):
    assert local().post("/api/picks/track", json={"pick_id": pick_id}).status_code == status
    assert env.get_history() == []


# --- ki írhat ---
def test_remote_client_cannot_write(env):
    c = local(client=REMOTE)
    assert c.post("/api/picks/track", json={"pick_id": "200_ML_HOME"}).status_code == 403
    assert c.post("/api/history/settle").status_code == 403
    assert env.get_history() == []


def test_cross_origin_write_is_rejected(env):
    c = local()
    r = c.post("/api/picks/track", json={"pick_id": "200_ML_HOME"}, headers={"Origin": "https://evil.example"})
    assert r.status_code == 403
    assert c.post("/api/history/settle", headers={"Origin": "https://evil.example"}).status_code == 403
    assert env.get_history() == []


@pytest.mark.parametrize("origin", ["http://localhost:8000", "http://localhost:3000", "http://127.0.0.1:3000"])
def test_own_origins_can_write(env, origin):
    assert local().post("/api/picks/track", json={"pick_id": "200_ML_HOME"}, headers={"Origin": origin}).status_code == 200


def test_dns_rebinding_host_is_rejected(env):
    c = local(base="http://evil.example")  # a kérés helyi gépről jön, de a Host fejléc idegen név
    assert c.post("/api/picks/track", json={"pick_id": "200_ML_HOME"}, headers={"Origin": "http://evil.example"}).status_code == 403
    assert env.get_history() == []


def test_token_mode(env, monkeypatch):
    monkeypatch.setenv("API_WRITE_TOKEN", "titok-123")
    c = local(client=REMOTE)
    body = {"pick_id": "200_ML_HOME"}
    assert c.post("/api/picks/track", json=body).status_code == 401
    assert c.post("/api/picks/track", json=body, headers={"Authorization": "Bearer rossz"}).status_code == 401
    assert c.post("/api/picks/track", json=body, headers={"Authorization": "Bearer titok-123"}).status_code == 200
    # token módban a helyi kliensnek is kell token
    assert local().post("/api/history/settle").status_code == 401


def test_reads_stay_open(env):
    c = local(client=REMOTE)
    assert c.get("/api/history").status_code == 200
    assert c.get("/api/performance").status_code == 200


# --- CORS és bemenet ---
def test_cors_does_not_allow_foreign_origin(env):
    c = local()
    evil = c.options("/api/picks/track", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"})
    assert "access-control-allow-origin" not in evil.headers
    ok = c.options("/api/picks/track", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"})
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert "access-control-allow-credentials" not in ok.headers


@pytest.mark.parametrize("date,status", [("20261112", 200), ("2026-11-12", 422), ("abc", 422), ("1", 422)])
def test_games_date_format(env, date, status):
    assert local().get("/api/games", params={"date": date}).status_code == status
