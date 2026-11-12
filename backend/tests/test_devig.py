"""Vig-mentesítés: a Shin- és a hatványos módszer független ellenőrzése, és a bekötés."""
import math

import pytest

from app.quant import calibration
from app.quant.ev_calculator import _power_devig, remove_vig_two_way
from app.quant.shin import shin_devig_two_way

PAIRS = [(1.91, 1.91), (1.5, 2.7), (1.2, 5.0), (1.05, 12.0), (1.229, 4.41), (1.971, 1.855)]


def bisect(f, lo, hi, steps=200):
    """Független gyökkereső (nem a scipy-t használja), hogy a megoldót ne önmagával ellenőrizzük."""
    for _ in range(steps):
        mid = (lo + hi) / 2
        if f(lo) * f(mid) <= 0:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


def shin_reference(a, b):
    qa, qb = 1 / a, 1 / b
    book = qa + qb
    prob = lambda q, z: (math.sqrt(z * z + 4 * (1 - z) * q * q / book) - z) / (2 * (1 - z))
    z = bisect(lambda z: prob(qa, z) + prob(qb, z) - 1, 0.0, 1 - 1e-9)
    return prob(qa, z), prob(qb, z), z


# --- Shin ---
@pytest.mark.parametrize("a,b", PAIRS)
def test_shin_matches_independent_solution(a, b):
    p_a, p_b, z, vig = shin_devig_two_way(a, b)
    ref_a, ref_b, ref_z = shin_reference(a, b)
    assert p_a == pytest.approx(ref_a, abs=1e-4) and p_b == pytest.approx(ref_b, abs=1e-4)
    assert z == pytest.approx(ref_z, abs=1e-4)
    assert z > 0                                      # korábban a hibás célfüggvény miatt mindig 0 volt
    assert p_a + p_b == pytest.approx(1.0, abs=1e-3)


def test_shin_moves_probability_to_the_favorite_versus_proportional():
    p_fav, p_dog, _, _ = shin_devig_two_way(1.2, 5.0)
    prop_fav = (1 / 1.2) / (1 / 1.2 + 1 / 5.0)
    assert p_fav > prop_fav and p_dog < 1 - prop_fav


def test_shin_no_vig_and_invalid_odds():
    assert shin_devig_two_way(2.0, 2.0)[:3] == (0.5, 0.5, 0.0)
    assert shin_devig_two_way(1.0, 2.0) == (0.5, 0.5, 0.0, 0.0)


# --- hatványos ---
@pytest.mark.parametrize("a,b", PAIRS)
def test_power_devig_satisfies_its_definition(a, b):
    p_a, p_b = _power_devig(a, b)
    assert p_a + p_b == pytest.approx(1.0, abs=1e-9)
    k = math.log(p_a) / math.log(1 / a)               # p_i = q_i^k, ugyanaz a k mindkét oldalon
    assert p_b == pytest.approx((1 / b) ** k, abs=1e-9)
    assert k >= 1.0


def test_power_devig_without_vig_normalises():
    assert _power_devig(2.0, 2.0) == (0.5, 0.5)
    p_a, p_b = _power_devig(2.0, 2.2)                 # a könyv összege < 1: nincs árrés
    assert p_a + p_b == pytest.approx(1.0)


# --- bekötés ---
def test_production_default_is_the_measured_best_method():
    assert calibration.DEVIG_METHOD == "power"
    assert remove_vig_two_way(1.5, 2.7) == remove_vig_two_way(1.5, 2.7, method="power")


@pytest.mark.parametrize("method", ["power", "shin", "multiplicative"])
def test_every_method_gives_a_valid_distribution(method):
    for a, b in PAIRS:
        p_a, p_b, vig = remove_vig_two_way(a, b, method=method)
        assert p_a + p_b == pytest.approx(1.0, abs=2e-4) and 0 < p_a < 1 and vig > 0


def test_methods_agree_on_even_markets_and_differ_on_lopsided_ones():
    even = {m: remove_vig_two_way(1.91, 1.91, method=m)[0] for m in ("power", "shin", "multiplicative")}
    assert set(even.values()) == {0.5}
    lop = {m: remove_vig_two_way(1.2, 5.0, method=m)[0] for m in ("power", "shin", "multiplicative")}
    assert lop["power"] > lop["multiplicative"] and lop["shin"] > lop["multiplicative"]


def test_method_can_be_switched_through_calibration(monkeypatch):
    monkeypatch.setattr(calibration, "DEVIG_METHOD", "multiplicative")
    assert remove_vig_two_way(1.2, 5.0)[0] == remove_vig_two_way(1.2, 5.0, method="multiplicative")[0]
    with pytest.raises(ValueError):
        remove_vig_two_way(1.2, 5.0, method="ismeretlen")


def test_invalid_odds_stay_neutral():
    assert remove_vig_two_way(1.0, 2.0) == (0.5, 0.5, 0.0)
