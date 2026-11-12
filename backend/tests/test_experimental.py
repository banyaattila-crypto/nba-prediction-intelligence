"""A kísérleti (nem bekötött) modulok: viselkedésük tesztelt, de az alkalmazás nem használja őket."""
import importlib
import pkgutil

import pytest

import app
from app.quant.experimental.elo import calculate_elo_win_prob, calculate_four_factors_rating, calculate_mov_multiplier, update_elo
from app.quant.experimental.player_props import simulate_player_prop


def test_elo_probabilities_are_complementary_and_home_court_helps():
    p_home, p_away = calculate_elo_win_prob(1500, 1500, hca=65)
    assert p_home + p_away == pytest.approx(1.0, abs=1e-3) and p_home > 0.5
    assert calculate_elo_win_prob(1500, 1500, hca=0) == (0.5, 0.5)


def test_elo_update_is_zero_sum_and_margin_matters():
    new_h, new_a, shift = update_elo(1500, 1500, 125, 100)
    assert (new_h - 1500) == pytest.approx(-(new_a - 1500), abs=0.11)
    _, _, small = update_elo(1500, 1500, 101, 100)
    assert shift > small > 0
    assert calculate_mov_multiplier(30, 0) <= 3.0 and calculate_mov_multiplier(1, 0) >= 0.5


def test_four_factors_direction():
    assert calculate_four_factors_rating(efg_pct=0.58, tov_pct=0.10, orb_pct=0.28, ft_rate=0.22) > 0
    assert calculate_four_factors_rating(efg_pct=0.50, tov_pct=0.16, orb_pct=0.22, ft_rate=0.17) < 0


def test_player_prop_probabilities_are_consistent():
    r = simulate_player_prop("X", "BOS", "POINTS", line=26.5, expected_stat_per_36=28.0, projected_minutes=35.0, simulations_count=20000, seed=1)
    assert r["p_over"] + r["p_under"] == pytest.approx(1.0, abs=1e-3)   # a vonal .5, így nincs döntetlen
    assert r["expected_mean"] > 20


def test_no_production_module_imports_the_experimental_package():
    """Az experimental/ csomag definíció szerint nincs bekötve: ha valaki bekötné, előbb ki kell mérni (lásd __init__)."""
    offenders = []
    for info in pkgutil.walk_packages(app.__path__, prefix="app."):
        if info.name.startswith("app.quant.experimental"):
            continue
        spec = importlib.util.find_spec(info.name)
        text = open(spec.origin, encoding="utf-8").read() if spec and spec.origin else ""
        if "quant.experimental" in text:
            offenders.append(info.name)
    assert offenders == []
