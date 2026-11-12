import math
from typing import Dict, Any, Tuple

DEFAULT_BASE_ELO = 1500.0
ELO_K_FACTOR = 20.0
ELO_HCA = 65.0  # NBA Home Court Advantage in Elo points (~2.5-3 points spread)

def calculate_elo_win_prob(home_elo: float, away_elo: float, hca: float = ELO_HCA) -> Tuple[float, float]:
    """
    Calculate win probability from Elo ratings:
    P_home = 1 / (1 + 10^((away_elo - (home_elo + hca)) / 400))
    """
    exponent = (away_elo - (home_elo + hca)) / 400.0
    p_home = 1.0 / (1.0 + math.pow(10.0, exponent))
    p_away = 1.0 - p_home
    return round(p_home, 4), round(p_away, 4)

def calculate_mov_multiplier(margin: int, elo_diff: float) -> float:
    """
    Margin of Victory (MOV) multiplier for NBA Elo updates (FiveThirtyEight methodology).
    Prevents garbage-time blowouts from distorting ratings while appropriately rewarding decisive wins.
    """
    abs_margin = abs(margin)
    numerator = math.pow(abs_margin + 3.0, 0.8)
    denominator = 7.5 + 0.006 * abs(elo_diff)
    return max(0.5, min(3.0, numerator / denominator))

def update_elo(
    home_elo: float,
    away_elo: float,
    home_score: int,
    away_score: int,
    k_factor: float = ELO_K_FACTOR,
    hca: float = ELO_HCA
) -> Tuple[float, float, float]:
    """
    Update Elo ratings after a game.
    Returns: (new_home_elo, new_away_elo, elo_change)
    """
    p_home, _ = calculate_elo_win_prob(home_elo, away_elo, hca)
    margin = home_score - away_score
    actual_home = 1.0 if margin > 0 else 0.0
    
    elo_diff = (home_elo + hca) - away_elo
    mov = calculate_mov_multiplier(margin, elo_diff)
    
    elo_shift = k_factor * mov * (actual_home - p_home)
    new_h_elo = round(home_elo + elo_shift, 1)
    new_a_elo = round(away_elo - elo_shift, 1)
    
    return new_h_elo, new_a_elo, round(elo_shift, 1)

def calculate_four_factors_rating(
    efg_pct: float = 0.54,
    tov_pct: float = 0.13,
    orb_pct: float = 0.25,
    ft_rate: float = 0.20
) -> float:
    """
    Dean Oliver Four Factors composite efficiency index:
    - eFG% (Shooting) : 40% weight
    - TOV% (Turnovers) : 25% weight (negative impact)
    - ORB% (Rebounding): 20% weight
    - FT Rate (Free Throws): 15% weight
    
    Returns standard composite efficiency delta vs league average.
    """
    # League benchmarks (approx): eFG ~ 0.54, TOV ~ 0.13, ORB ~ 0.26, FTR ~ 0.20
    delta_efg = (efg_pct - 0.540) * 100.0 * 0.40
    delta_tov = -(tov_pct - 0.130) * 100.0 * 0.25
    delta_orb = (orb_pct - 0.260) * 100.0 * 0.20
    delta_ft = (ft_rate - 0.200) * 100.0 * 0.15
    
    composite_delta = delta_efg + delta_tov + delta_orb + delta_ft
    return round(composite_delta, 2)
