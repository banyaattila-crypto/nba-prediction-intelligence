"""A kalibráció: a nyers modell a piachoz húzva, mért szórásokkal és hihetőségi védelemmel."""
import numpy as np
import pytest
from scipy.stats import norm

from app.quant import calibration
from app.quant.calibration import MARGIN_SD, TOTAL_SD, blend_probability
from app.quant.monte_carlo import run_monte_carlo_simulation
from app.services.prediction_service import PredictionService
from tests.test_odds import game_for


# --- keverés ---
def test_blend_weights():
    assert blend_probability(0.70, 0.50, weight=0.0) == 0.50     # a piac
    assert blend_probability(0.70, 0.50, weight=1.0) == 0.70     # a nyers modell
    assert blend_probability(0.70, 0.50, weight=0.25) == 0.55


def test_blend_default_uses_current_module_weight(monkeypatch):
    monkeypatch.setattr(calibration, "MODEL_WEIGHT", 0.5)
    assert blend_probability(0.70, 0.50) == 0.60


def test_measured_model_weight_is_zero():
    """A 170 meccses visszamérés szerint a modell nem ad információt a piachoz; emeléshez újramérés kell."""
    assert calibration.MODEL_WEIGHT == 0.0


# --- szimuláció: a mért szórások ---
def test_simulation_reproduces_measured_dispersion():
    sim_args = dict(expected_home_score=112.0, expected_away_score=110.0, simulations_count=200_000, seed=7)
    rng_probe = run_monte_carlo_simulation(**sim_args)
    # a nyers pontszámokat nem adja vissza, ezért az eloszlásból: P(győzelem) = Φ(várt különbség / σ)
    expected_margin = 2.0
    assert rng_probe.home_win_prob == pytest.approx(norm.cdf(expected_margin / MARGIN_SD), abs=0.005)
    assert rng_probe.expected_total == pytest.approx(222.0, abs=0.3)


def test_simulated_totals_have_measured_sd():
    sim = run_monte_carlo_simulation(expected_home_score=111.0, expected_away_score=111.0, simulations_count=200_000, seed=11)
    buckets = sim.total_distribution
    mids = np.array([(float(b["range"].split("-")[0]) + float(b["range"].split("-")[1])) / 2 for b in buckets])
    counts = np.array([b["count"] for b in buckets], float)
    mean = np.average(mids, weights=counts)
    sd = np.sqrt(np.average((mids - mean) ** 2, weights=counts))
    assert sd == pytest.approx(TOTAL_SD, abs=1.2)  # a hisztogram sávozása miatt nagyobb tűrés


# --- horgonyzás ---
def picks_for(short_name):
    analysis = PredictionService().analyze_game(game_for(short_name))
    return analysis, analysis.picks


def test_default_weight_anchors_every_pick_to_the_market():
    _, picks = picks_for("TOR @ PHI")
    assert picks
    for p in picks:
        assert p.model_prob == p.fair_implied_prob
        assert p.edge == 0.0
        assert p.verdict == "PASS" and p.kelly_stake == 0.0
        assert p.raw_model_prob is not None


def test_raw_model_is_kept_and_differs_from_market():
    """A nyers modell eltérése látható marad (ez az, amit a kalibráció kiszűr)."""
    _, picks = picks_for("TOR @ PHI")
    assert max(abs(p.raw_model_prob - p.fair_implied_prob) for p in picks) > 0.10


def test_every_pick_explains_the_calibration():
    _, picks = picks_for("DET @ WSH")
    assert all(any(r.startswith("Kalibráció:") for r in p.reasoning) for p in picks)


def test_full_weight_restores_raw_probabilities_but_guard_blocks_implausible_edges(monkeypatch):
    monkeypatch.setattr(calibration, "MODEL_WEIGHT", 1.0)
    _, picks = picks_for("TOR @ PHI")
    for p in picks:
        assert p.model_prob == p.raw_model_prob
        if abs(p.edge) > calibration.MAX_PLAUSIBLE_EDGE_PP:
            assert p.verdict == "PASS" and p.kelly_stake == 0.0
            assert any(r.startswith("Hihetőségi védelem") for r in p.reasoning)
    assert any(abs(p.edge) > calibration.MAX_PLAUSIBLE_EDGE_PP for p in picks)  # volt mit kiszűrni


def test_plausible_edge_can_still_be_flagged_when_weight_is_raised(monkeypatch):
    """A védelem csak a hihetetlenül nagy eltérést fogja meg: kis súlynál a jelzés működik."""
    monkeypatch.setattr(calibration, "MODEL_WEIGHT", 0.25)
    flagged = [p for name in ("TOR @ PHI", "DET @ WSH", "DAL @ MIN", "CHA @ PHX") for p in picks_for(name)[1] if p.verdict != "PASS"]
    assert flagged
    assert all(0 < abs(p.edge) <= calibration.MAX_PLAUSIBLE_EDGE_PP for p in flagged)


# --- a total valószínűsége a mért szórással ---
def test_total_probability_uses_measured_sd():
    analysis, picks = picks_for("CHA @ PHX")
    over = next(p for p in picks if p.market == "TOTAL_OVER")
    line = analysis.game.odds.over_under
    expected = round(1.0 - float(norm.cdf(line, loc=analysis.simulation.expected_total, scale=TOTAL_SD)), 4)
    assert over.raw_model_prob == expected
