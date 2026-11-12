import pytest
from app.quant.ev_calculator import (
    american_to_decimal,
    decimal_to_implied_prob,
    remove_vig_two_way,
    calculate_edge,
    calculate_ev,
    calculate_kelly_stake,
    evaluate_verdict
)
from app.quant.monte_carlo import run_monte_carlo_simulation
from app.quant.ratings import calculate_matchup_ratings, calculate_injury_impact
from app.quant.backtest import calculate_brier_score, calculate_calibration_curve
from app.models.schemas import Team, Injury, HistoricalPick

def test_american_to_decimal():
    assert american_to_decimal(100) == 2.0
    assert american_to_decimal(150) == 2.5
    assert american_to_decimal(-110) == 1.909 or american_to_decimal(-110) == 1.91
    assert american_to_decimal(-200) == 1.5

def test_decimal_to_implied_prob():
    assert decimal_to_implied_prob(2.0) == 0.5
    assert decimal_to_implied_prob(4.0) == 0.25

def test_remove_vig_two_way():
    fair_a, fair_b, vig = remove_vig_two_way(1.91, 1.91)
    assert fair_a == 0.5
    assert fair_b == 0.5
    assert 4.0 <= vig <= 5.5

def test_calculate_edge_and_ev():
    model_prob = 0.55
    fair_prob = 0.50
    edge = calculate_edge(model_prob, fair_prob)
    assert edge == 5.0
    
    odds = 2.0
    ev = calculate_ev(model_prob, odds)
    # EV = 0.55 * (2.0 - 1) - 0.45 * 1 = 0.55 - 0.45 = +0.10 => 10%
    assert ev == 10.0

def test_kelly_stake():
    # Model 55% at 2.0 odds -> f* = (1 * 0.55 - 0.45)/1 = 0.10
    # Quarter Kelly = 0.10 * 0.25 * 10 = 0.25 units -> minimum cap 0.5 units
    stake = calculate_kelly_stake(0.55, 2.0, fraction=0.25)
    assert stake >= 0.5

    # Negative EV should yield 0 stake
    no_stake = calculate_kelly_stake(0.40, 2.0)
    assert no_stake == 0.0

def test_evaluate_verdict():
    verdict, conf = evaluate_verdict(edge=5.0, ev=6.0, uncertainty=0.10)
    assert verdict == "STRONG_VALUE"
    assert conf == "HIGH"

    verdict_pass, _ = evaluate_verdict(edge=0.5, ev=0.8, uncertainty=0.10)
    assert verdict_pass == "PASS"

def test_monte_carlo_simulation():
    res = run_monte_carlo_simulation(
        expected_home_score=115.0,
        expected_away_score=110.0,
        spread_line=-5.0,
        total_line=225.0,
        simulations_count=5000,
        seed=123
    )
    assert res.home_win_prob > res.away_win_prob
    assert res.expected_home_score > res.expected_away_score
    assert len(res.home_score_distribution) > 0
    assert len(res.total_distribution) > 0
    assert "-5.0" in res.spread_cover_probs

def test_injury_impact():
    injuries = [
        Injury(player_name="Nikola Jokic", position="C", status="Out", detail="Knee"),
        Injury(player_name="Bench Player", position="PG", status="Questionable", detail="Ankle")
    ]
    off_pen, def_pen, unc = calculate_injury_impact(injuries)
    assert off_pen > 3.0
    assert unc > 0.10

def test_brier_score():
    sample_preds = [
        {"model_prob": 0.8, "result": "WON"},   # error = (0.8 - 1)^2 = 0.04
        {"model_prob": 0.2, "result": "LOST"},  # error = (0.2 - 0)^2 = 0.04
    ]
    brier = calculate_brier_score(sample_preds)
    assert brier == 0.04

from app.quant.shin import shin_devig_two_way
from app.quant.experimental.elo import (
    calculate_elo_win_prob,
    calculate_mov_multiplier,
    update_elo,
    calculate_four_factors_rating
)
from app.quant.experimental.player_props import simulate_player_prop

def test_shin_devig():
    # Symmetric odds
    fair_a, fair_b, z, vig = shin_devig_two_way(1.91, 1.91)
    assert abs(fair_a - 0.50) < 0.01
    assert abs(fair_b - 0.50) < 0.01
    assert vig > 4.0
    
    # Asymmetric odds (heavy favorite)
    f_fav, f_dog, z_asym, vig_asym = shin_devig_two_way(1.20, 5.0)
    assert f_fav > 0.75
    assert f_dog < 0.25
    assert abs((f_fav + f_dog) - 1.0) < 0.001

def test_elo_win_prob_and_update():
    # Equal Elo with Home Court Advantage (HCA = 65)
    p_home, p_away = calculate_elo_win_prob(1500, 1500, hca=65)
    assert p_home > 0.55
    assert p_away < 0.45
    
    # Update Elo on blowout
    new_h, new_a, shift = update_elo(1500, 1500, home_score=125, away_score=100)
    assert new_h > 1500
    assert new_a < 1500
    assert shift > 5.0

def test_four_factors_rating():
    # Elite shooting and low turnovers
    rating = calculate_four_factors_rating(efg_pct=0.58, tov_pct=0.10, orb_pct=0.28, ft_rate=0.22)
    assert rating > 2.0

def test_player_prop_simulation():
    res = simulate_player_prop(
        player_name="Jayson Tatum",
        team="BOS",
        stat_type="POINTS",
        line=26.5,
        over_odds=1.91,
        under_odds=1.91,
        expected_stat_per_36=28.0,
        projected_minutes=35.0,
        simulations_count=5000,
        seed=42
    )
    assert "p_over" in res
    assert "p_under" in res
    assert res["expected_mean"] > 20.0
    assert (res["p_over"] + res["p_under"]) > 0.90
