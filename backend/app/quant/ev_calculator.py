import math
from typing import Tuple, List, Dict, Any

def american_to_decimal(american: float) -> float:
    """Convert American odds (+150, -110) to decimal odds (2.50, 1.91)."""
    if american is None or american == 0:
        return 1.91
    if american > 0:
        return round(1.0 + (american / 100.0), 3)
    else:
        return round(1.0 + (100.0 / abs(american)), 3)

def decimal_to_implied_prob(decimal_odds: float) -> float:
    """Calculate raw implied probability: 1 / decimal_odds."""
    if decimal_odds <= 1.0:
        return 0.99
    return round(1.0 / decimal_odds, 4)

def remove_vig_two_way(odds_a: float, odds_b: float) -> Tuple[float, float, float]:
    """
    Remove bookmaker margin (vig) from a 2-way market.
    Returns: (fair_prob_a, fair_prob_b, vig_percentage)
    """
    if odds_a <= 1.0 or odds_b <= 1.0:
        return (0.5, 0.5, 0.0)
    
    raw_p_a = 1.0 / odds_a
    raw_p_b = 1.0 / odds_b
    total_implied = raw_p_a + raw_p_b
    vig = (total_implied - 1.0) * 100.0
    
    fair_p_a = raw_p_a / total_implied
    fair_p_b = raw_p_b / total_implied
    
    return round(fair_p_a, 4), round(fair_p_b, 4), round(vig, 2)

def calculate_edge(model_prob: float, fair_prob: float) -> float:
    """Calculate betting edge in percentage: (Model_P - Fair_P) * 100."""
    return round((model_prob - fair_prob) * 100.0, 2)

def calculate_ev(model_prob: float, decimal_odds: float) -> float:
    """
    Calculate Expected Value percentage:
    EV = (P_model * (Odds - 1) - (1 - P_model)) * 100
    """
    if decimal_odds <= 1.0:
        return 0.0
    profit_if_won = decimal_odds - 1.0
    loss_if_lost = 1.0
    ev = (model_prob * profit_if_won - (1.0 - model_prob) * loss_if_lost) * 100.0
    return round(ev, 2)

def calculate_kelly_stake(model_prob: float, decimal_odds: float, fraction: float = 0.25, max_units: float = 2.5) -> float:
    """
    Calculate recommended stake in units using Fractional Kelly Criterion.
    Full Kelly: f = (b * p - q) / b, where b = odds - 1, p = prob, q = 1 - p.
    Default fraction is 0.25 (Quarter-Kelly) for capital preservation.
    """
    if decimal_odds <= 1.0 or model_prob <= 0.0:
        return 0.0
    
    b = decimal_odds - 1.0
    p = model_prob
    q = 1.0 - p
    
    f_star = (b * p - q) / b
    if f_star <= 0:
        return 0.0
    
    # 1 unit is calibrated as 1% of bankroll. Stake is fractional Kelly * 10 units.
    recommended_units = f_star * fraction * 10.0
    return round(min(max_units, max(0.5, recommended_units)), 1)

def evaluate_verdict(edge: float, ev: float, uncertainty: float) -> Tuple[str, str]:
    """
    Determine transparent recommendation verdict and confidence grade.
    Strict thresholding: we don't blindly recommend positive EV if edge is microscopic or uncertainty is excessive.
    """
    if uncertainty > 0.40:
        # High uncertainty due to major key injuries or unknown rotations
        if ev > 6.0 and edge > 5.0:
            return "VALUE", "LOW"
        return "PASS", "LOW"
    
    if ev >= 5.0 and edge >= 4.0:
        return "STRONG_VALUE", "HIGH"
    elif ev >= 2.5 and edge >= 2.0:
        return "VALUE", "MEDIUM"
    else:
        return "PASS", "NEUTRAL"
