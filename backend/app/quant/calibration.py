"""A modell kalibrációs paraméterei, a szezon lejátszott meccseiből mérve.

Forrás: calibration/season_games.json (170 meccs, 2026-10-20 .. 2026-11-12, záró vonalakkal),
elemzés: calibration/analyze.py, visszamérés: calibration/backtest.py. Újramérés: lásd calibration/collect.py.

Eredmények (pontbeli csapatértékeléssel, 92 meccsen):
- a tényleges különbség szórása a záró vonal körül 14,4, az összponté 17,7;
- a modell pontatlanabb a piacnál (RMSE 15,4-16,2 vs 14,3), és a piachoz keverés optimális súlya ~0
  (95% CI [-0,3; +0,4]): a modell nem ad kimutatható információt a záró vonalhoz;
- a nyers modell jelzett tippjeinek hozama -8,9% volt (a vig: -7,8%).
Ezért a modell súlya 0. Emelni csak olyan újramérés alapján szabad, amely a súlyt a nullától megkülönböztethetően
pozitívnak mutatja.
"""
from typing import Optional

MARGIN_SD = 14.4   # a tényleges különbség szórása a záró vonal körül
TOTAL_SD = 17.7    # a tényleges összpontszám szórása a záró vonal körül

# p_végső = p_piac + MODEL_WEIGHT * (p_modell - p_piac); 0 = a piaci valószínűség, 1 = a nyers modell.
MODEL_WEIGHT = 0.0

# A záró vonalak hatékonyak: ennél nagyobb modell–piac eltérés a visszamérésben (medián 13,7 pp) modellzajra utalt,
# ezért nem lehet jelzés. Ez szakmai becslés, nem mért érték.
MAX_PLAUSIBLE_EDGE_PP = 8.0


def blend_probability(p_model: float, p_market: float, weight: Optional[float] = None) -> float:
    """A nyers modell valószínűsége a piacihoz húzva. weight=None: a MODEL_WEIGHT aktuális értéke."""
    w = MODEL_WEIGHT if weight is None else weight
    return round(p_market + w * (p_model - p_market), 4)
