import os
import json
import tempfile
import threading
from typing import Dict, List, Optional
from app.models.schemas import Game, HistoricalPick, PerformanceStats, PickRecommendation
from app.services.settlement import grade, parse_pick_id, profit_loss
from app.quant.backtest import calculate_performance_summary

DATA_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "historical_picks.json")


class TrackerStorageError(RuntimeError):
    """A tippnapló nem olvasható vagy nem írható. A fájlt ilyenkor NEM írjuk felül."""


def _write_json_atomic(path: str, items: List[HistoricalPick]) -> None:
    """Atomi írás: ideiglenes fájl ugyanabban a mappában, fsync, majd os.replace."""
    directory = os.path.dirname(path)
    fd, tmp_path = tempfile.mkstemp(dir=directory, prefix=".historical_", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump([p.model_dump() for p in items], f, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, path)
    except BaseException:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


class TrackerService:
    # Egy folyamaton belüli olvasás-módosítás-írás védelme. Több worker/folyamat esetén
    # fájlzár vagy adatbázis kell (lásd audit F2).
    _lock = threading.RLock()

    def __init__(self):
        self._ensure_data_file()

    def _ensure_data_file(self):
        os.makedirs(os.path.dirname(DATA_FILE_PATH), exist_ok=True)
        with self._lock:
            if not os.path.exists(DATA_FILE_PATH):
                _write_json_atomic(DATA_FILE_PATH, [])

    def get_history(self) -> List[HistoricalPick]:
        try:
            with open(DATA_FILE_PATH, "r", encoding="utf-8") as f:
                raw = json.load(f)
            return [HistoricalPick(**item) for item in raw]
        except Exception as e:
            # Korábban: `return []`, amit a record_pick felülírt -> a teljes napló elveszett.
            raise TrackerStorageError(f"A tippnapló nem olvasható ({type(e).__name__}): {e}") from e

    def record_pick(self, pick: PickRecommendation, units: float = 1.0) -> HistoricalPick:
        with self._lock:
            return self._record_pick_locked(pick, units)

    def _record_pick_locked(self, pick: PickRecommendation, units: float) -> HistoricalPick:
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
            line=pick.line,
            closing_odds=None,  # a záró vonal rögzítése nincs implementálva -> nincs CLV
            clv_edge=None
        )
        history.append(new_hist)
        try:
            _write_json_atomic(DATA_FILE_PATH, history)
        except OSError as e:
            raise TrackerStorageError(f"A tippnapló nem írható: {e}") from e
        return new_hist

    def get_performance_stats(self) -> PerformanceStats:
        history = self.get_history()
        return calculate_performance_summary(history)

    def settle_pending(self, final_games: Dict[str, Game]) -> Dict[str, int]:
        """A függő tippeket a lejátszott meccsek végeredménye alapján zárja le."""
        with self._lock:
            history = self.get_history()
            settled = unsettleable = still_pending = 0
            for p in history:
                if p.result != "PENDING":
                    continue
                parsed = parse_pick_id(p.id)
                game = final_games.get(parsed[0]) if parsed else None
                if not parsed or game is None or game.home_score is None or game.away_score is None:
                    still_pending += 1
                    continue
                result = grade(parsed[1], p.line, game.home_score, game.away_score)
                if result is None:
                    unsettleable += 1
                    continue
                p.result = result
                p.profit_loss = profit_loss(result, p.units_staked, p.odds)
                settled += 1
            if settled:
                try:
                    _write_json_atomic(DATA_FILE_PATH, history)
                except OSError as e:
                    raise TrackerStorageError(f"A tippnapló nem írható: {e}") from e
            return {"settled": settled, "still_pending": still_pending, "unsettleable": unsettleable}
