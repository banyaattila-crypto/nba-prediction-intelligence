import math
from typing import Tuple

from scipy.optimize import brentq


def shin_devig_two_way(odds_a: float, odds_b: float) -> Tuple[float, float, float, float]:
    """
    Shin (1992, 1993) vig-mentesítés kétkimenetes piacra.

    A modell szerint a bukméker árrésének egy része a jól értesült fogadók (arányuk: z) elleni védekezés.
    Ha q_i = 1 / szorzó_i a nyers implikált valószínűség és pi = sum(q_i) a könyv összege, akkor az igazi
    valószínűség:
        p_i = ( sqrt(z^2 + 4 (1 - z) q_i^2 / pi) - z ) / ( 2 (1 - z) )
    ahol z-t úgy kell megválasztani, hogy sum(p_i) = 1. Az arányos (multiplikatív) módszerhez képest a
    favorit valószínűsége nagyobb, az esélytelenebbé kisebb (a favorit-esélytelen torzítás korrekciója).

    Visszatér: (fair_p_a, fair_p_b, z, vig_százalék)
    """
    if odds_a <= 1.0 or odds_b <= 1.0:
        return (0.5, 0.5, 0.0, 0.0)

    q_a, q_b = 1.0 / odds_a, 1.0 / odds_b
    book = q_a + q_b
    vig = (book - 1.0) * 100.0
    if book <= 1.0:  # nincs árrés (vagy arbitrázs): nincs mit levonni
        return round(q_a / book, 4), round(q_b / book, 4), 0.0, round(vig, 2)

    def probabilities(z: float) -> Tuple[float, float]:
        denom = 2.0 * (1.0 - z)
        return (
            (math.sqrt(z * z + 4.0 * (1.0 - z) * q_a * q_a / book) - z) / denom,
            (math.sqrt(z * z + 4.0 * (1.0 - z) * q_b * q_b / book) - z) / denom,
        )

    # z=0-nál sum(p) = sqrt(book) > 1, z -> 1-nél sum(p) = sum(q^2)/book < 1: a gyök a (0, 1) intervallumban van.
    z = brentq(lambda x: sum(probabilities(x)) - 1.0, 0.0, 1.0 - 1e-9, xtol=1e-12, maxiter=200)
    p_a, p_b = probabilities(z)
    total = p_a + p_b  # numerikus pontatlanság ellen
    return round(p_a / total, 4), round(p_b / total, 4), round(z, 4), round(vig, 2)
