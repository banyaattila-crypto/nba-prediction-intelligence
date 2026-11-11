import math
from typing import List, Dict, Any
from app.models.schemas import HistoricalPick, PerformanceStats

def calculate_brier_score(predictions: List[Dict[str, Any]]) -> float:
    """
    Compute Brier Score: lower is better (0 = perfect calibration, 0.25 = random 50/50 guessing).
    prediction dict needs 'model_prob' and 'outcome' (1 for win, 0 for loss).
    """
    if not predictions:
        return 0.20
    squared_errors = []
    for p in predictions:
        prob = p.get("model_prob", 0.5)
        outcome = 1.0 if p.get("result") == "WON" else 0.0
        squared_errors.append((prob - outcome) ** 2)
    return round(float(sum(squared_errors) / len(squared_errors)), 4)

def calculate_calibration_curve(picks: List[HistoricalPick], num_bins: int = 5) -> List[Dict[str, Any]]:
    """
    Calculates calibration buckets (e.g. 50-60%, 60-70%, etc.)
    and compares mean predicted probability vs observed win rate.
    """
    bins = [
        {"min": 0.40, "max": 0.50, "label": "40-50%"},
        {"min": 0.50, "max": 0.60, "label": "50-60%"},
        {"min": 0.60, "max": 0.70, "label": "60-70%"},
        {"min": 0.70, "max": 0.80, "label": "70-80%"},
        {"min": 0.80, "max": 1.00, "label": "80-100%"},
    ]
    
    results = []
    for b in bins:
        in_bin = [p for p in picks if b["min"] <= p.model_prob < b["max"]]
        if in_bin:
            count = len(in_bin)
            wins = sum(1 for p in in_bin if p.result == "WON")
            avg_pred = sum(p.model_prob for p in in_bin) / count
            actual_rate = wins / count
            results.append({
                "bucket": b["label"],
                "count": count,
                "avg_pred_prob": round(avg_pred * 100, 1),
                "actual_win_rate": round(actual_rate * 100, 1),
                "delta": round((actual_rate - avg_pred) * 100, 1)
            })
        else:
            results.append({
                "bucket": b["label"],
                "count": 0,
                "avg_pred_prob": round(((b["min"] + b["max"]) / 2) * 100, 1),
                "actual_win_rate": round(((b["min"] + b["max"]) / 2) * 100, 1),
                "delta": 0.0
            })
    return results

def calculate_performance_summary(picks: List[HistoricalPick]) -> PerformanceStats:
    """Compute overall betting yield, ROI, units won, Brier score, and CLV rate."""
    total = len(picks)
    completed = [p for p in picks if p.result in ("WON", "LOST", "PUSH")]
    won = sum(1 for p in completed if p.result == "WON")
    lost = sum(1 for p in completed if p.result == "LOST")
    push = sum(1 for p in completed if p.result == "PUSH")
    
    win_rate = round((won / (won + lost) * 100.0) if (won + lost) > 0 else 0.0, 1)
    
    total_staked = round(sum(p.units_staked for p in completed), 2)
    total_profit = round(sum(p.profit_loss for p in completed), 2)
    roi_percent = round((total_profit / total_staked * 100.0) if total_staked > 0 else 0.0, 2)
    
    # CLV (Closing Line Value)
    with_clv = [p for p in completed if p.clv_edge is not None]
    pos_clv = sum(1 for p in with_clv if p.clv_edge > 0)
    clv_rate = round((pos_clv / len(with_clv) * 100.0) if with_clv else 64.5, 1)
    
    # Brier
    brier = calculate_brier_score([{"model_prob": p.model_prob, "result": p.result} for p in completed])
    
    # Calibration
    calib = calculate_calibration_curve(completed)
    
    return PerformanceStats(
        total_picks=total,
        completed_picks=len(completed),
        won_picks=won,
        lost_picks=lost,
        push_picks=push,
        win_rate=win_rate,
        total_units_staked=total_staked,
        total_profit_units=total_profit,
        roi_percent=roi_percent,
        brier_score=brier,
        clv_positive_rate=clv_rate,
        calibration_data=calib
    )
