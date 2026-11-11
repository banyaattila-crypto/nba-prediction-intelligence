from typing import Tuple, List, Dict, Any
from app.models.schemas import Team, Injury

LEAGUE_AVG_PACE = 99.0
LEAGUE_AVG_ORTG = 114.2
LEAGUE_AVG_DRTG = 114.2
HOME_COURT_ADVANTAGE_ORTG = 2.2

# Estimated net rating impact of known star players if out
STAR_PLAYERS_IMPACT = {
    "Nikola Jokic": 6.5,
    "Luka Doncic": 5.8,
    "Giannis Antetokounmpo": 5.5,
    "Shai Gilgeous-Alexander": 5.2,
    "Jayson Tatum": 4.8,
    "Stephen Curry": 4.5,
    "Joel Embiid": 5.0,
    "Anthony Davis": 4.2,
    "LeBron James": 3.8,
    "Kevin Durant": 4.0,
    "Devin Booker": 3.5,
    "Anthony Edwards": 3.8,
    "Donovan Mitchell": 3.6,
    "Tyrese Haliburton": 3.4,
    "Jalen Brunson": 4.0,
    "Trae Young": 3.5,
    "Victor Wembanyama": 4.2,
    "Damian Lillard": 3.5,
    "Ja Morant": 3.8,
    "Bam Adebayo": 3.0,
    "Jimmy Butler": 3.5,
    "Kyrie Irving": 3.4,
}

def calculate_injury_impact(injuries: List[Injury]) -> Tuple[float, float, float]:
    """
    Calculate (offensive_penalty, defensive_penalty, uncertainty_score)
    based on the team's injured players.
    """
    off_penalty = 0.0
    def_penalty = 0.0
    uncertainty = 0.05  # baseline uncertainty
    
    for inj in injuries:
        p_name = inj.player_name
        status = inj.status.upper()
        
        # Determine status weight
        if "OUT" in status:
            weight = 1.0
        elif "DOUBTFUL" in status:
            weight = 0.8
            uncertainty += 0.08
        elif "QUESTIONABLE" in status or "DAY-TO-DAY" in status:
            weight = 0.5
            uncertainty += 0.12  # highest uncertainty for game-time decisions
        else:
            weight = 0.2
        
        # Determine player base impact
        base_impact = 1.2  # default rotation player
        for star, impact in STAR_PLAYERS_IMPACT.items():
            if star.lower() in p_name.lower():
                base_impact = impact
                break
        
        effective_impact = base_impact * weight
        off_penalty += effective_impact * 0.65
        def_penalty += effective_impact * 0.35
    
    # Cap maximum adjustments to avoid extreme distortive outliers
    off_penalty = min(off_penalty, 9.0)
    def_penalty = min(def_penalty, 6.0)
    uncertainty = min(uncertainty, 0.50)
    
    return round(off_penalty, 2), round(def_penalty, 2), round(uncertainty, 2)

def calculate_matchup_ratings(
    home_team: Team,
    away_team: Team,
    home_injuries: List[Injury],
    away_injuries: List[Injury],
    home_rest_days: int = 1,
    away_rest_days: int = 1,
    home_is_b2b: bool = False,
    away_is_b2b: bool = False
) -> Dict[str, Any]:
    """
    Compute adjusted Pace, Offensive Rating, and Defensive Rating for both teams.
    Accounts for:
    - Team baseline ratings
    - Opponent strength adjustment
    - Home court advantage
    - Rest days & Back-to-Back fatigue
    - Injury absences and status uncertainty
    """
    # 1. Injury impact
    h_off_pen, h_def_pen, h_unc = calculate_injury_impact(home_injuries)
    a_off_pen, a_def_pen, a_unc = calculate_injury_impact(away_injuries)
    total_uncertainty = round(max(h_unc, a_unc) + 0.5 * min(h_unc, a_unc), 2)
    
    # 2. Rest / B2B penalties
    h_rest_ortg_adj = -1.8 if home_is_b2b else (0.5 if home_rest_days >= 2 else 0.0)
    a_rest_ortg_adj = -2.2 if away_is_b2b else (0.5 if away_rest_days >= 2 else 0.0) # road B2B is harsher
    
    # 3. Expected Pace
    h_pace = getattr(home_team, "pace", LEAGUE_AVG_PACE) or LEAGUE_AVG_PACE
    a_pace = getattr(away_team, "pace", LEAGUE_AVG_PACE) or LEAGUE_AVG_PACE
    exp_pace = (h_pace * a_pace) / LEAGUE_AVG_PACE
    if home_is_b2b or away_is_b2b:
        exp_pace -= 0.8  # fatigue typically slows down transition pace
    
    # 4. Adjusted Team Ratings
    h_base_ortg = getattr(home_team, "ortg", LEAGUE_AVG_ORTG) or LEAGUE_AVG_ORTG
    h_base_drtg = getattr(home_team, "drtg", LEAGUE_AVG_DRTG) or LEAGUE_AVG_DRTG
    a_base_ortg = getattr(away_team, "ortg", LEAGUE_AVG_ORTG) or LEAGUE_AVG_ORTG
    a_base_drtg = getattr(away_team, "drtg", LEAGUE_AVG_DRTG) or LEAGUE_AVG_DRTG
    
    # Home offensive rating vs Away defensive rating + HCA + Rest - Injury
    h_adj_ortg = (
        (h_base_ortg * a_base_drtg / LEAGUE_AVG_DRTG)
        + HOME_COURT_ADVANTAGE_ORTG
        + h_rest_ortg_adj
        - h_off_pen
        + (a_def_pen * 0.5)
    )
    
    # Away offensive rating vs Home defensive rating + Rest - Injury
    a_adj_ortg = (
        (a_base_ortg * h_base_drtg / LEAGUE_AVG_DRTG)
        + a_rest_ortg_adj
        - a_off_pen
        + (h_def_pen * 0.5)
    )
    
    # Expected points = (Pace * ORtg) / 100
    exp_home_pts = (exp_pace * h_adj_ortg) / 100.0
    exp_away_pts = (exp_pace * a_adj_ortg) / 100.0
    
    return {
        "expected_pace": round(exp_pace, 1),
        "home_adj_ortg": round(h_adj_ortg, 1),
        "away_adj_ortg": round(a_adj_ortg, 1),
        "expected_home_score": round(exp_home_pts, 1),
        "expected_away_score": round(exp_away_pts, 1),
        "expected_total": round(exp_home_pts + exp_away_pts, 1),
        "expected_margin": round(exp_home_pts - exp_away_pts, 1), # positive = home leads
        "uncertainty": total_uncertainty,
        "home_injury_penalty": h_off_pen,
        "away_injury_penalty": a_off_pen,
        "home_rest_advantage": home_rest_days - away_rest_days
    }
