import os
import json
from typing import List, Optional
from app.models.schemas import HistoricalPick, PerformanceStats, PickRecommendation
from app.quant.backtest import calculate_performance_summary

DATA_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "historical_picks.json")

class TrackerService:
    def __init__(self):
        self._ensure_data_file()

    def _ensure_data_file(self):
        os.makedirs(os.path.dirname(DATA_FILE_PATH), exist_ok=True)
        if not os.path.exists(DATA_FILE_PATH):
            sample_history = self._generate_sample_history()
            with open(DATA_FILE_PATH, "w", encoding="utf-8") as f:
                json.dump([p.model_dump() for p in sample_history], f, indent=2)

    def get_history(self) -> List[HistoricalPick]:
        try:
            with open(DATA_FILE_PATH, "r", encoding="utf-8") as f:
                raw = json.load(f)
                return [HistoricalPick(**item) for item in raw]
        except Exception:
            return []

    def record_pick(self, pick: PickRecommendation, units: float = 1.0) -> HistoricalPick:
        history = self.get_history()
        # Avoid duplicate
        existing = next((p for p in history if p.id == pick.id), None)
        if existing:
            return existing

        new_hist = HistoricalPick(
            id=pick.id,
            date=pick.game_date[:10],
            matchup=pick.game_matchup,
            market=pick.market,
            selection=pick.selection,
            odds=pick.bookmaker_odds,
            model_prob=pick.model_prob,
            ev=pick.ev,
            edge=pick.edge,
            units_staked=units,
            result="PENDING",
            profit_loss=0.0,
            closing_odds=pick.bookmaker_odds,
            clv_edge=0.0
        )
        history.append(new_hist)
        with open(DATA_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump([p.model_dump() for p in history], f, indent=2)
        return new_hist

    def get_performance_stats(self) -> PerformanceStats:
        history = self.get_history()
        return calculate_performance_summary(history)

    def _generate_sample_history(self) -> List[HistoricalPick]:
        """Realistic sample history from the past 2 weeks for calibration & ROI validation."""
        return [
            HistoricalPick(
                id="hist_1", date="2026-11-04", matchup="BOS @ GSW", market="SPREAD",
                selection="BOS -4.5", odds=1.91, model_prob=0.584, ev=11.5, edge=6.2,
                units_staked=1.5, result="WON", profit_loss=1.36, closing_odds=1.82, clv_edge=4.9
            ),
            HistoricalPick(
                id="hist_2", date="2026-11-04", matchup="OKC @ DEN", market="TOTAL_UNDER",
                selection="Under 226.5", odds=1.91, model_prob=0.562, ev=7.3, edge=4.0,
                units_staked=1.0, result="WON", profit_loss=0.91, closing_odds=1.87, clv_edge=2.1
            ),
            HistoricalPick(
                id="hist_3", date="2026-11-05", matchup="NY @ ATL", market="MONEYLINE",
                selection="New York Knicks Győzelem", odds=1.85, model_prob=0.590, ev=9.1, edge=4.9,
                units_staked=1.2, result="LOST", profit_loss=-1.20, closing_odds=1.78, clv_edge=3.9
            ),
            HistoricalPick(
                id="hist_4", date="2026-11-06", matchup="CLE @ DET", market="SPREAD",
                selection="CLE -8.5", odds=1.91, model_prob=0.620, ev=18.4, edge=9.8,
                units_staked=2.0, result="WON", profit_loss=1.82, closing_odds=1.75, clv_edge=9.1
            ),
            HistoricalPick(
                id="hist_5", date="2026-11-06", matchup="MIA @ PHX", market="TOTAL_OVER",
                selection="Over 219.5", odds=1.95, model_prob=0.551, ev=7.4, edge=3.8,
                units_staked=1.0, result="LOST", profit_loss=-1.0, closing_odds=1.92, clv_edge=1.5
            ),
            HistoricalPick(
                id="hist_6", date="2026-11-07", matchup="LAL @ MEM", market="MONEYLINE",
                selection="Memphis Grizzlies Győzelem", odds=2.10, model_prob=0.525, ev=10.2, edge=4.9,
                units_staked=1.0, result="WON", profit_loss=1.10, closing_odds=1.98, clv_edge=6.0
            ),
            HistoricalPick(
                id="hist_7", date="2026-11-08", matchup="MIL @ NY", market="TOTAL_UNDER",
                selection="Under 231.5", odds=1.91, model_prob=0.575, ev=9.8, edge=5.3,
                units_staked=1.2, result="WON", profit_loss=1.09, closing_odds=1.85, clv_edge=3.2
            ),
            HistoricalPick(
                id="hist_8", date="2026-11-09", matchup="SAS @ UTA", market="SPREAD",
                selection="SAS -3.5", odds=1.91, model_prob=0.540, ev=3.1, edge=1.8,
                units_staked=0.5, result="WON", profit_loss=0.45, closing_odds=1.90, clv_edge=0.5
            ),
            HistoricalPick(
                id="hist_9", date="2026-11-09", matchup="HOU @ DAL", market="TOTAL_OVER",
                selection="Over 224.5", odds=1.91, model_prob=0.565, ev=7.9, edge=4.3,
                units_staked=1.0, result="LOST", profit_loss=-1.0, closing_odds=1.89, clv_edge=1.0
            ),
            HistoricalPick(
                id="hist_10", date="2026-11-10", matchup="BOS @ BKN", market="SPREAD",
                selection="BOS -11.5", odds=1.91, model_prob=0.612, ev=16.8, edge=9.0,
                units_staked=1.8, result="WON", profit_loss=1.63, closing_odds=1.80, clv_edge=6.1
            ),
            HistoricalPick(
                id="hist_11", date="2026-11-10", matchup="SAC @ PHX", market="MONEYLINE",
                selection="Sacramento Kings Győzelem", odds=2.25, model_prob=0.488, ev=9.8, edge=4.4,
                units_staked=0.8, result="WON", profit_loss=1.00, closing_odds=2.10, clv_edge=7.1
            ),
            HistoricalPick(
                id="hist_12", date="2026-11-11", matchup="DEN @ OKC", market="SPREAD",
                selection="OKC -4.5", odds=1.91, model_prob=0.570, ev=8.8, edge=4.8,
                units_staked=1.0, result="WON", profit_loss=0.91, closing_odds=1.86, clv_edge=2.7
            )
        ]
