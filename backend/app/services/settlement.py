"""Tippek elszámolása lejátszott meccsek végeredménye alapján.

A tipp azonosítója `<game_id>_<PIAC>` alakú (lásd PredictionService), ebből derül ki a piac és az oldal.
Az eredmény kizárólag a végeredményből és a rögzített vonalból számolódik.
"""
import re
from typing import Optional, Tuple

_PICK_ID = re.compile(r"^(?P<game_id>[^_]+)_(?P<kind>ML_HOME|ML_AWAY|SPREAD_HOME|SPREAD_AWAY|TOTAL_OVER|TOTAL_UNDER)$")


def parse_pick_id(pick_id: str) -> Optional[Tuple[str, str]]:
    m = _PICK_ID.match(pick_id)
    return (m.group("game_id"), m.group("kind")) if m else None


def _by_sign(value: float) -> str:
    return "WON" if value > 0 else "LOST" if value < 0 else "PUSH"


def grade(kind: str, line: Optional[float], home_score: int, away_score: int) -> Optional[str]:
    """WON / LOST / PUSH, vagy None, ha nem számolható (hiányzó vonal, döntetlen a győztes piacon)."""
    margin = home_score - away_score  # pozitív = hazai nyert
    if kind in ("ML_HOME", "ML_AWAY"):
        if margin == 0:
            return None
        return "WON" if (margin > 0) == (kind == "ML_HOME") else "LOST"
    if line is None:
        return None
    if kind == "SPREAD_HOME":
        return _by_sign(margin + line)
    if kind == "SPREAD_AWAY":
        return _by_sign(-margin + line)
    total = home_score + away_score
    if kind == "TOTAL_OVER":
        return _by_sign(total - line)
    return _by_sign(line - total)  # TOTAL_UNDER


def profit_loss(result: str, units: float, odds: float) -> float:
    if result == "WON":
        return round(units * (odds - 1.0), 2)
    if result == "LOST":
        return round(-units, 2)
    return 0.0
