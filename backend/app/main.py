import os
from datetime import date as date_cls, datetime, timedelta, timezone
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from app.providers.espn import ESPNProvider
from app.services.prediction_service import PredictionService
from app.services.tracker_service import TrackerService, TrackerStorageError
from fastapi.responses import JSONResponse
from app.models.schemas import (
    Game,
    GameAnalysis,
    PickRecommendation,
    HistoricalPick,
    PerformanceStats,
    Team
)

app = FastAPI(
    title="NBA Prediction & Betting Intelligence API",
    description="Quantitative decision support system for NBA basketball games and betting markets.",
    version="1.0.0"
)

# CORS setup for web and mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(TrackerStorageError)
async def tracker_storage_error_handler(request, exc: TrackerStorageError):
    return JSONResponse(status_code=503, content={"detail": str(exc)})

provider = ESPNProvider()
prediction_service = PredictionService()
tracker_service = TrackerService()

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "provider": "ESPN Public Data Adapter",
        "quant_engine": "Vectorized Monte Carlo (10,000 iterations)",
        "vig_model": "Multiplicative & Power Devigging",
        "timestamp": os.getenv("UPTIME_START", "active")
    }

@app.get("/api/games", response_model=List[Game])
async def get_games(date: Optional[str] = None):
    """Retrieve today's games or games on a specific date (YYYYMMDD)."""
    games = await provider.get_today_games(date_str=date)
    return games

@app.get("/api/games/{game_id}", response_model=GameAnalysis)
async def get_game_analysis(game_id: str):
    """Deep-dive quantitative analysis for a specific NBA game."""
    game = await provider.get_game_details(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Mérkőzés nem található")
    analysis = prediction_service.analyze_game(game)
    return analysis

def _scheduled(games):
    """Csak a még el nem kezdődött meccsek értékelhetők: az indulás után a modell és az ár már nem összevethető."""
    return [g for g in games if g.status == "scheduled"]

@app.get("/api/picks", response_model=List[PickRecommendation])
async def get_all_picks(
    market: Optional[str] = Query(None, description="MONEYLINE, SPREAD, TOTAL_OVER, TOTAL_UNDER"),
    min_edge: Optional[float] = Query(None, description="Minimum edge percentage, e.g. 2.0"),
    min_ev: Optional[float] = Query(None, description="Minimum EV percentage, e.g. 3.0"),
    verdict: Optional[str] = Query(None, description="STRONG_VALUE, VALUE, or PASS")
):
    """Retrieve generated picks across all current games with quantitative filters."""
    games = _scheduled(await provider.get_today_games())
    all_picks: List[PickRecommendation] = []
    
    for g in games:
        # Load details (including injuries & line data) if scheduled
        detailed_g = await provider.get_game_details(g.id) or g
        analysis = prediction_service.analyze_game(detailed_g)
        all_picks.extend(analysis.picks)
        
    filtered = all_picks
    if market:
        filtered = [p for p in filtered if p.market.upper() == market.upper()]
    if min_edge is not None:
        filtered = [p for p in filtered if p.edge >= min_edge]
    if min_ev is not None:
        filtered = [p for p in filtered if p.ev >= min_ev]
    if verdict:
        filtered = [p for p in filtered if p.verdict.upper() == verdict.upper()]
        
    # Sort primarily by EV descending
    filtered.sort(key=lambda x: x.ev, reverse=True)
    return filtered

@app.get("/api/picks/top", response_model=List[PickRecommendation])
async def get_top_value_picks():
    """Retrieve the top positive EV opportunities for the day (Edge >= 2.0% and EV >= 2.5%)."""
    games = _scheduled(await provider.get_today_games())
    top_picks: List[PickRecommendation] = []
    for g in games:
        detailed_g = await provider.get_game_details(g.id) or g
        analysis = prediction_service.analyze_game(detailed_g)
        for pick in analysis.picks:
            if pick.verdict in ("STRONG_VALUE", "VALUE"):
                top_picks.append(pick)
    top_picks.sort(key=lambda x: x.ev, reverse=True)
    return top_picks[:8]

@app.post("/api/picks/track")
async def track_pick(pick: PickRecommendation, units: float = 1.0):
    """Add a pick to the user's tracked paper-trading portfolio."""
    # Look-ahead védelem: az indulás után rögzített tipp már az eredmény ismeretében születhetne.
    try:
        start = datetime.fromisoformat(pick.game_date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail="A meccs időpontja nem értelmezhető, a tipp nem rögzíthető.")
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if start <= datetime.now(timezone.utc):
        raise HTTPException(status_code=409, detail="A meccs már elkezdődött, utólag nem rögzíthető tipp.")
    recorded = tracker_service.record_pick(pick, units=units)
    return {"message": "Tipp sikeresen rögzítve", "pick": recorded}

@app.post("/api/history/settle")
async def settle_history():
    """A függő tippek lezárása a lejátszott meccsek végeredménye alapján (ESPN)."""
    pending = [p for p in tracker_service.get_history() if p.result == "PENDING"]
    if not pending:
        return {"settled": 0, "still_pending": 0, "unsettleable": 0}
    # A tipp dátuma UTC; az ESPN amerikai napokra bont, ezért az előző napot is lekérjük.
    days = set()
    for p in pending:
        try:
            d = date_cls.fromisoformat(p.date)
        except ValueError:
            continue
        days.update({d - timedelta(days=1), d})
    finals = {}
    for d in sorted(days):
        for g in await provider.get_today_games(date_str=d.strftime("%Y%m%d")):
            if g.status == "final":
                finals[g.id] = g
    return tracker_service.settle_pending(finals)

@app.get("/api/performance", response_model=PerformanceStats)
async def get_performance():
    """Retrieve historical performance, ROI, Brier score, and calibration curve."""
    return tracker_service.get_performance_stats()

@app.get("/api/history", response_model=List[HistoricalPick])
async def get_history_picks():
    """Retrieve immutable list of tracked historical picks."""
    return tracker_service.get_history()

@app.get("/api/standings")
async def get_standings():
    """Retrieve 30 NBA teams with standings, ratings and pace."""
    standings = await provider.get_team_standings()
    # Unique team list
    unique_teams = {}
    for k, v in standings.items():
        unique_teams[v.id] = v
    teams_list = list(unique_teams.values())
    teams_list.sort(key=lambda t: t.wins, reverse=True)
    return teams_list

# Serve compiled frontend in production if dist exists
frontend_dist = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.isdir(frontend_dist):
    from starlette.responses import FileResponse

    def _safe_dist_file(rel_path: str):
        """A dist mappán belüli, létező fájl valós útvonala; egyébként None (path traversal ellen)."""
        try:
            candidate = os.path.realpath(os.path.join(frontend_dist, rel_path))
            if os.path.commonpath([frontend_dist, candidate]) != frontend_dist:
                return None
        except ValueError:  # NUL-bájt, eltérő meghajtó
            return None
        return candidate if os.path.isfile(candidate) else None

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = _safe_dist_file(full_path)
        if file_path:
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

