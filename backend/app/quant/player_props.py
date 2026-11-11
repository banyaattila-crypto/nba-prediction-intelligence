import math
from typing import List, Dict, Any, Optional
import numpy as np
from scipy.stats import nbinom, poisson
from app.models.schemas import PickRecommendation
from app.quant.ev_calculator import (
    decimal_to_implied_prob,
    remove_vig_two_way,
    calculate_edge,
    calculate_ev,
    calculate_kelly_stake,
    evaluate_verdict
)

def simulate_player_prop(
    player_name: str,
    team: str,
    stat_type: str,  # 'POINTS', 'REBOUNDS', 'ASSISTS', 'PRA'
    line: float,
    over_odds: float = 1.91,
    under_odds: float = 1.91,
    expected_stat_per_36: float = 24.5,
    projected_minutes: float = 34.0,
    opp_defensive_factor: float = 1.0,  # >1.0 = weak defense, <1.0 = elite defense
    simulations_count: int = 10000,
    seed: Optional[int] = 42
) -> Dict[str, Any]:
    """
    Monte Carlo simulation of individual player proposition markets.
    Uses Poisson / Negative Binomial distribution adjusted for minutes variance and opponent matchup.
    """
    rng = np.random.default_rng(seed)
    
    # 1. Minutes distribution (lognormal or normal with floor/ceiling)
    # NBA starters typically play ±4.5 minutes around their mean, lower bounded by fouls/blowouts
    sim_minutes = np.clip(rng.normal(projected_minutes, 3.8, simulations_count), 15.0, 42.0)
    
    # 2. Expected rate per minute
    base_rate_per_min = (expected_stat_per_36 / 36.0) * opp_defensive_factor
    expected_stats = sim_minutes * base_rate_per_min
    
    # 3. Simulate stat generation (Poisson process on expected stat)
    sim_outcomes = rng.poisson(lam=expected_stats)
    
    # 4. Probabilities
    p_over = float(np.mean(sim_outcomes > line))
    p_under = float(np.mean(sim_outcomes < line))
    p_push = float(np.mean(sim_outcomes == line))
    
    # Vig-removed fair probabilities
    fair_over, fair_under, vig = remove_vig_two_way(over_odds, under_odds)
    
    edge_over = calculate_edge(p_over, fair_over)
    ev_over = calculate_ev(p_over, over_odds)
    verdict_over, conf_over = evaluate_verdict(edge_over, ev_over, uncertainty=0.15)
    
    edge_under = calculate_edge(p_under, fair_under)
    ev_under = calculate_ev(p_under, under_odds)
    verdict_under, conf_under = evaluate_verdict(edge_under, ev_under, uncertainty=0.15)
    
    return {
        "player_name": player_name,
        "team": team,
        "stat_type": stat_type,
        "line": line,
        "expected_mean": round(float(np.mean(sim_outcomes)), 1),
        "median": round(float(np.median(sim_outcomes)), 1),
        "std_dev": round(float(np.std(sim_outcomes)), 2),
        "p_over": round(p_over, 4),
        "p_under": round(p_under, 4),
        "fair_over_odds": round(1.0 / fair_over, 2) if fair_over > 0 else 2.0,
        "fair_under_odds": round(1.0 / fair_under, 2) if fair_under > 0 else 2.0,
        "edge_over": edge_over,
        "ev_over": ev_over,
        "verdict_over": verdict_over,
        "edge_under": edge_under,
        "ev_under": ev_under,
        "verdict_under": verdict_under,
        "kelly_stake_over": calculate_kelly_stake(p_over, over_odds) if verdict_over != "PASS" else 0.0,
        "kelly_stake_under": calculate_kelly_stake(p_under, under_odds) if verdict_under != "PASS" else 0.0
    }
