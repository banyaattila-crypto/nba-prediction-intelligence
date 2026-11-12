import numpy as np
from typing import Dict, Any, List, Optional
from app.models.schemas import MonteCarloSimulationResult
from app.quant.calibration import MARGIN_SD, TOTAL_SD

def run_monte_carlo_simulation(
    expected_home_score: float,
    expected_away_score: float,
    spread_line: Optional[float] = None,
    total_line: Optional[float] = None,
    simulations_count: int = 10000,
    margin_sd: float = MARGIN_SD,
    total_sd: float = TOTAL_SD,
    seed: Optional[int] = 42
) -> MonteCarloSimulationResult:
    """
    Vectorized Monte Carlo simulation of NBA game scoring.
    Simulates `simulations_count` outcomes around the expected scores. The noise is set so that the simulated
    margin and total have the standard deviations measured on real results (see app/quant/calibration.py).
    """
    rng = np.random.default_rng(seed)

    # Team noise s gives margin variance 2*s^2; the shared pace noise j adds 4*j^2 to the total variance only.
    team_sd = margin_sd / np.sqrt(2.0)
    pace_sd = np.sqrt(max(total_sd ** 2 - margin_sd ** 2, 0.0)) / 2.0
    pace_jitter = rng.normal(0, pace_sd, simulations_count)
    home_noise = rng.normal(0, team_sd, simulations_count) + pace_jitter
    away_noise = rng.normal(0, team_sd, simulations_count) + pace_jitter
    
    home_sim_scores = np.maximum(70.0, expected_home_score + home_noise)
    away_sim_scores = np.maximum(70.0, expected_away_score + away_noise)
    
    # In basketball regular games can't tie - resolve hypothetical ties
    ties = home_sim_scores == away_sim_scores
    home_sim_scores[ties] += rng.choice([1.0, -1.0], size=np.sum(ties))
    
    margins = home_sim_scores - away_sim_scores
    totals = home_sim_scores + away_sim_scores
    
    # Probabilities
    home_win_prob = float(np.mean(margins > 0))
    away_win_prob = float(np.mean(margins < 0))
    
    # Spread coverage probs
    spread_cover_probs = {}
    lines_to_test = [-12.5, -9.5, -6.5, -4.5, -2.5, 0.0, 2.5, 4.5, 6.5, 9.5, 12.5]
    if spread_line is not None and spread_line not in lines_to_test:
        lines_to_test.append(spread_line)
    lines_to_test.sort()
    
    for line in lines_to_test:
        # If home line is -3.5, home covers if home_score - away_score > 3.5 (i.e. margin > -line)
        cover_p = float(np.mean(margins + line > 0))
        spread_cover_probs[str(line)] = round(cover_p, 4)
    
    # Score distribution for charts (10-bin histogram)
    home_hist, home_bin_edges = np.histogram(home_sim_scores, bins=12)
    home_distribution = []
    for i in range(len(home_hist)):
        home_distribution.append({
            "range": f"{int(home_bin_edges[i])}-{int(home_bin_edges[i+1])}",
            "count": int(home_hist[i]),
            "pct": round(float(home_hist[i]) / simulations_count * 100.0, 1)
        })
        
    total_hist, total_bin_edges = np.histogram(totals, bins=12)
    total_distribution = []
    for i in range(len(total_hist)):
        total_distribution.append({
            "range": f"{int(total_bin_edges[i])}-{int(total_bin_edges[i+1])}",
            "count": int(total_hist[i]),
            "pct": round(float(total_hist[i]) / simulations_count * 100.0, 1)
        })
        
    return MonteCarloSimulationResult(
        simulations_count=simulations_count,
        home_win_prob=round(home_win_prob, 4),
        away_win_prob=round(away_win_prob, 4),
        expected_home_score=round(float(np.mean(home_sim_scores)), 1),
        expected_away_score=round(float(np.mean(away_sim_scores)), 1),
        expected_total=round(float(np.mean(totals)), 1),
        expected_margin=round(float(np.mean(margins)), 1),
        home_score_distribution=home_distribution,
        total_distribution=total_distribution,
        spread_cover_probs=spread_cover_probs
    )
