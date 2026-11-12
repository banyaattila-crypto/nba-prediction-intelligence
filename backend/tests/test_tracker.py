import json
import pytest

import app.services.tracker_service as ts
from app.models.schemas import Game, HistoricalPick, PickRecommendation, Team
from app.quant.backtest import calculate_performance_summary, MIN_RELIABLE_SAMPLE
from app.services.settlement import grade, parse_pick_id, profit_loss


@pytest.fixture
def svc(tmp_path, monkeypatch):
    """TrackerService átirányított fájllal: a valódi napló nem érintett."""
    monkeypatch.setattr(ts, "DATA_FILE_PATH", str(tmp_path / "ledger.json"))
    return ts.TrackerService()


def make_pick(pick_id="1_SPREAD_HOME", market="SPREAD", line=-3.5, odds=1.91):
    return PickRecommendation(
        id=pick_id, game_id=pick_id.split("_")[0], game_matchup="A @ B", game_date="2026-11-12T00:00:00Z",
        market=market, selection="x", line=line, bookmaker_odds=odds, bookmaker="t",
        implied_prob=0.52, fair_implied_prob=0.5, model_prob=0.6, edge=10.0, ev=14.0, kelly_stake=1.0,
        confidence="HIGH", uncertainty=0.1, verdict="VALUE", reasoning=[], timestamp="t",
    )


def final_game(game_id, home, away):
    t = lambda i: Team(id=i, name="T", display_name="T", abbreviation="T")
    return Game(id=game_id, date="2026-11-12T00:00:00Z", status="final",
                home_team=t("h"), away_team=t("a"), home_score=home, away_score=away)


def test_new_ledger_is_empty(svc):
    assert svc.get_history() == []


def test_empty_stats_contain_no_fabricated_values(svc):
    s = svc.get_performance_stats()
    assert s.total_picks == 0
    assert s.brier_score is None
    assert s.clv_positive_rate is None
    assert s.reliable_sample is False
    assert all(b["actual_win_rate"] is None and b["delta"] is None for b in s.calibration_data)


def test_record_pick_stores_no_placeholder_clv(svc):
    rec = svc.record_pick(make_pick(), units=1.0)
    assert rec.result == "PENDING"
    assert rec.closing_odds is None and rec.clv_edge is None
    assert rec.line == -3.5
    s = svc.get_performance_stats()
    assert s.completed_picks == 0 and s.brier_score is None and s.clv_positive_rate is None


def test_reliable_sample_threshold():
    picks = [HistoricalPick(id=f"{i}_ML_HOME", date="2026-11-01", matchup="A @ B", market="MONEYLINE",
                            selection="x", odds=2.0, model_prob=0.55, ev=1, edge=1, units_staked=1.0,
                            result="WON" if i % 2 else "LOST", profit_loss=1.0 if i % 2 else -1.0)
             for i in range(MIN_RELIABLE_SAMPLE)]
    s = calculate_performance_summary(picks)
    assert s.reliable_sample is True
    assert s.brier_score is not None
    assert s.clv_positive_rate is None  # nincs záró vonal -> nincs CLV


@pytest.mark.parametrize("pick_id,expected", [
    ("401_ML_HOME", ("401", "ML_HOME")),
    ("401_TOTAL_UNDER", ("401", "TOTAL_UNDER")),
    ("hist_1", None),
    ("401_UNKNOWN", None),
])
def test_parse_pick_id(pick_id, expected):
    assert parse_pick_id(pick_id) == expected


@pytest.mark.parametrize("kind,line,home,away,expected", [
    ("ML_HOME", None, 110, 100, "WON"),
    ("ML_HOME", None, 100, 110, "LOST"),
    ("ML_AWAY", None, 100, 110, "WON"),
    ("ML_HOME", None, 100, 100, None),
    ("SPREAD_HOME", -3.5, 110, 100, "WON"),     # +10 - 3,5 > 0
    ("SPREAD_HOME", -3.5, 102, 100, "LOST"),    # +2 - 3,5 < 0
    ("SPREAD_HOME", -3.0, 103, 100, "PUSH"),
    ("SPREAD_AWAY", 3.5, 100, 102, "WON"),      # vendég -2 + 3,5 > 0
    ("SPREAD_AWAY", 3.5, 110, 100, "LOST"),
    ("SPREAD_HOME", None, 110, 100, None),      # hiányzó vonal -> nem számolható
    ("TOTAL_OVER", 220.5, 120, 105, "WON"),
    ("TOTAL_OVER", 225.0, 120, 105, "PUSH"),
    ("TOTAL_UNDER", 220.5, 120, 105, "LOST"),
    ("TOTAL_UNDER", 230.5, 120, 105, "WON"),
])
def test_grade(kind, line, home, away, expected):
    assert grade(kind, line, home, away) == expected


def test_profit_loss():
    assert profit_loss("WON", 1.5, 1.91) == 1.36
    assert profit_loss("LOST", 1.5, 1.91) == -1.5
    assert profit_loss("PUSH", 1.5, 1.91) == 0.0


def test_settle_pending_end_to_end(svc):
    svc.record_pick(make_pick("1_SPREAD_HOME", line=-3.5), units=2.0)           # 110-100 -> WON
    svc.record_pick(make_pick("2_TOTAL_OVER", market="TOTAL_OVER", line=250.5), units=1.0)  # 215 -> LOST
    svc.record_pick(make_pick("3_ML_HOME", market="MONEYLINE", line=None), units=1.0)       # nincs meccs -> függő
    svc.record_pick(make_pick("4_SPREAD_HOME", line=None), units=1.0)           # vonal nélkül -> nem számolható

    summary = svc.settle_pending({
        "1": final_game("1", 110, 100),
        "2": final_game("2", 110, 105),
        "4": final_game("4", 110, 100),
    })
    assert summary == {"settled": 2, "still_pending": 1, "unsettleable": 1}

    by_id = {p.id: p for p in svc.get_history()}
    assert by_id["1_SPREAD_HOME"].result == "WON" and by_id["1_SPREAD_HOME"].profit_loss == 1.82
    assert by_id["2_TOTAL_OVER"].result == "LOST" and by_id["2_TOTAL_OVER"].profit_loss == -1.0
    assert by_id["3_ML_HOME"].result == "PENDING"
    assert by_id["4_SPREAD_HOME"].result == "PENDING"

    # Második futás: már lezárt tippeket nem módosít
    assert svc.settle_pending({"1": final_game("1", 0, 99)})["settled"] == 0
    assert {p.id: p.result for p in svc.get_history()}["1_SPREAD_HOME"] == "WON"


def test_non_final_game_does_not_settle(svc):
    svc.record_pick(make_pick("5_ML_HOME", market="MONEYLINE", line=None))
    g = final_game("5", None, None)
    g.status = "in_progress"
    assert svc.settle_pending({"5": g})["settled"] == 0


# --- API: look-ahead védelem és csak induló meccsek értékelése ---
from fastapi.testclient import TestClient
import app.main as main
from app.models.schemas import OddsItem


class StubProvider:
    def __init__(self, games):
        self.games = games

    async def get_today_games(self, date_str=None):
        return self.games

    async def get_game_details(self, game_id):
        return next((g for g in self.games if g.id == game_id), None)


def test_picks_only_for_scheduled_games(monkeypatch):
    odds = OddsItem(provider="t", spread=-3.5, spread_home_odds=1.91, spread_away_odds=1.91, over_under=225.5, over_odds=1.91, under_odds=1.91,
                    moneyline_home=1.8, moneyline_away=2.1)
    done, upcoming, live = final_game("100", 110, 100), final_game("200", None, None), final_game("300", 50, 40)
    done.odds = upcoming.odds = live.odds = odds
    upcoming.status, live.status = "scheduled", "in_progress"
    monkeypatch.setattr(main, "provider", StubProvider([done, upcoming, live]))
    c = TestClient(main.app)
    for url in ("/api/picks", "/api/picks/top"):
        picks = c.get(url).json()
        assert {p["game_id"] for p in picks} <= {"200"}, url
    assert len(c.get("/api/picks").json()) == 6  # egy meccs: 2 győztes + 2 hendikep + 2 total piac
