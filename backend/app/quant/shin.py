import math
from typing import Tuple, List, Optional
import numpy as np
from scipy.optimize import brentq

def shin_devig_two_way(odds_a: float, odds_b: float) -> Tuple[float, float, float, float]:
    """
    Implements Shin's (1992, 1993) model for extracting true probabilities from bookmaker odds.
    Shin's model accounts for the presence of informed (sharp) bettors in the market:
    q_i = sqrt(z^2 + 4 * (1 - z) * (pi_i^2 / sum(pi_j))) ...
    
    Returns:
    (fair_p_a, fair_p_b, z_insider_factor, vig_percentage)
    """
    if odds_a <= 1.0 or odds_b <= 1.0:
        return (0.5, 0.5, 0.0, 0.0)
    
    pi_a = 1.0 / odds_a
    pi_b = 1.0 / odds_b
    total_implied = pi_a + pi_b
    vig = (total_implied - 1.0) * 100.0
    
    probs = np.array([pi_a, pi_b])
    
    # Objective function to solve for Shin's z (the insider trading fraction)
    # When z = 0, Shin degenerates to standard square-root devigging.
    def shin_objective(z):
        # Shin's formula for true probabilities p_i:
        # p_i = (sqrt(z^2 + 4*(1-z)*(pi_i / total_implied)) - z) / (2 * (1 - z))
        denom = 2.0 * (1.0 - z)
        if denom == 0:
            return 1.0
        
        p = (np.sqrt(z**2 + 4.0 * (1.0 - z) * (probs / total_implied)) - z) / denom
        return np.sum(p) - 1.0
    
    try:
        # z typically lies between 0 and 0.25 in sports betting markets
        z_solution = brentq(shin_objective, 0.0, 0.35, maxiter=100)
    except Exception:
        # Fallback to multiplicative if optimization fails
        z_solution = 0.0
    
    if z_solution > 0:
        denom = 2.0 * (1.0 - z_solution)
        fair_p_a = (math.sqrt(z_solution**2 + 4.0 * (1.0 - z_solution) * (pi_a / total_implied)) - z_solution) / denom
        fair_p_b = 1.0 - fair_p_a
    else:
        fair_p_a = pi_a / total_implied
        fair_p_b = pi_b / total_implied
        
    return round(float(fair_p_a), 4), round(float(fair_p_b), 4), round(float(z_solution), 4), round(float(vig), 2)
