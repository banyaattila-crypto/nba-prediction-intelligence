from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Team(BaseModel):
    id: str
    name: str
    display_name: str
    abbreviation: str
    logo: Optional[str] = None
    record: Optional[str] = "0-0"
    conference_rank: Optional[int] = None
    wins: int = 0
    losses: int = 0
    points_per_game: float = 110.0
    points_allowed_per_game: float = 110.0
    ortg: float = 112.0
    drtg: float = 112.0
    pace: float = 99.0

class Injury(BaseModel):
    player_name: str
    position: Optional[str] = None
    status: str  # Out, Questionable, Day-To-Day, Doubtful
    detail: Optional[str] = None

class OddsItem(BaseModel):
    provider: str
    spread: Optional[float] = None
    spread_home_odds: Optional[float] = None
    spread_away_odds: Optional[float] = None
    over_under: Optional[float] = None
    over_odds: Optional[float] = None
    under_odds: Optional[float] = None
    moneyline_home: Optional[float] = None
    moneyline_away: Optional[float] = None
    timestamp: Optional[str] = None

class Game(BaseModel):
    id: str
    date: str
    venue: Optional[str] = None
    status: str  # 'scheduled', 'in_progress', 'final'
    status_detail: Optional[str] = None
    period: Optional[int] = 0
    clock: Optional[str] = None
    home_team: Team
    away_team: Team
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    odds: Optional[OddsItem] = None
    injuries_home: List[Injury] = []
    injuries_away: List[Injury] = []
    home_rest_days: int = 1
    away_rest_days: int = 1
    home_is_b2b: bool = False
    away_is_b2b: bool = False

class PickRecommendation(BaseModel):
    id: str
    game_id: str
    game_matchup: str
    game_date: str
    market: str  # 'MONEYLINE', 'SPREAD', 'TOTAL_OVER', 'TOTAL_UNDER', 'TEAM_TOTAL'
    selection: str  # e.g. "Boston Celtics -5.5", "Over 224.5"
    line: Optional[float] = None
    bookmaker_odds: float
    bookmaker: str
    implied_prob: float  # raw implied prob 1 / odds
    fair_implied_prob: float  # vig-removed prob
    model_prob: float
    edge: float  # model_prob - fair_implied_prob
    ev: float  # expected value %
    kelly_stake: float  # fractional kelly unit sizing (0.0 - 2.5 units)
    confidence: str  # 'HIGH', 'MEDIUM', 'LOW'
    uncertainty: float  # 0.0 - 1.0 (based on injury & volatility)
    verdict: str  # 'STRONG_VALUE', 'VALUE', 'PASS'
    reasoning: List[str]
    timestamp: str
    result: Optional[str] = "PENDING"  # 'WON', 'LOST', 'PUSH', 'PENDING'

class TrackRequest(BaseModel):
    """Tipp rögzítése: a kliens csak az azonosítót és a tétet adja, minden más adatot a szerver számol."""
    pick_id: str = Field(min_length=3, max_length=64)
    units: float = Field(1.0, gt=0, le=5.0, allow_inf_nan=False)

class MonteCarloSimulationResult(BaseModel):
    simulations_count: int = 10000
    home_win_prob: float
    away_win_prob: float
    expected_home_score: float
    expected_away_score: float
    expected_total: float
    expected_margin: float  # home - away
    home_score_distribution: List[Dict[str, Any]] = []
    total_distribution: List[Dict[str, Any]] = []
    spread_cover_probs: Dict[str, float] = {}

class GameAnalysis(BaseModel):
    game: Game
    simulation: MonteCarloSimulationResult
    picks: List[PickRecommendation] = []
    key_factors: List[str] = []

class HistoricalPick(BaseModel):
    id: str
    date: str
    matchup: str
    market: str
    selection: str
    odds: float
    model_prob: float
    ev: float
    edge: float
    units_staked: float
    result: str  # WON, LOST, PUSH
    profit_loss: float
    line: Optional[float] = None  # hendikep / total vonal a rögzítéskor (az elszámoláshoz kell)
    closing_odds: Optional[float] = None
    clv_edge: Optional[float] = None

class PerformanceStats(BaseModel):
    total_picks: int
    completed_picks: int
    won_picks: int
    lost_picks: int
    push_picks: int
    win_rate: float
    total_units_staked: float
    total_profit_units: float
    roi_percent: float
    brier_score: Optional[float] = None  # None, amíg nincs lezárt tipp
    clv_positive_rate: Optional[float] = None  # None, amíg nincs rögzített záró vonal
    clv_tracked_picks: int = 0
    min_reliable_sample: int = 50
    reliable_sample: bool = False  # a lezárt tippek száma elér-e egy értelmezhető mintaméretet
    calibration_data: List[Dict[str, Any]]
