import time
from typing import List, Optional, Any
from app.models.schemas import Game, GameAnalysis, PickRecommendation
from app.quant.ratings import calculate_matchup_ratings
from app.quant.monte_carlo import run_monte_carlo_simulation
from app.quant.ev_calculator import (
    decimal_to_implied_prob,
    remove_vig_two_way,
    calculate_edge,
    calculate_ev,
    calculate_kelly_stake,
    evaluate_verdict
)

class PredictionService:
    def analyze_game(self, game: Game) -> GameAnalysis:
        """Complete quantitative analysis and betting edge generation for an NBA game."""
        matchup_data = calculate_matchup_ratings(
            home_team=game.home_team,
            away_team=game.away_team,
            home_injuries=game.injuries_home,
            away_injuries=game.injuries_away,
            home_rest_days=game.home_rest_days,
            away_rest_days=game.away_rest_days,
            home_is_b2b=game.home_is_b2b,
            away_is_b2b=game.away_is_b2b
        )

        spread_line = game.odds.spread if game.odds else None
        total_line = game.odds.over_under if game.odds else None

        # Run 10,000 iterations Monte Carlo simulation
        sim_result = run_monte_carlo_simulation(
            expected_home_score=matchup_data["expected_home_score"],
            expected_away_score=matchup_data["expected_away_score"],
            spread_line=spread_line,
            total_line=total_line,
            simulations_count=10000
        )

        picks = self._evaluate_markets(game, matchup_data, sim_result)

        key_factors = []
        if matchup_data["uncertainty"] > 0.25:
            key_factors.append(f"Magas bizonytalanság sérülések miatt (index: {matchup_data['uncertainty']})")
        if matchup_data["home_injury_penalty"] > 2.0:
            key_factors.append(f"Jelentős hazai hiányzók (-{matchup_data['home_injury_penalty']} pont támadóhatékonyság)")
        if matchup_data["away_injury_penalty"] > 2.0:
            key_factors.append(f"Jelentős vendég hiányzók (-{matchup_data['away_injury_penalty']} pont támadóhatékonyság)")
        if game.home_is_b2b:
            key_factors.append("Hazai csapat egymást követő napon játszik (B2B fáradtság)")
        if game.away_is_b2b:
            key_factors.append("Vendég csapat utazási terhelés alatt (B2B fáradtság)")

        key_factors.append(f"Várható tempó: {matchup_data['expected_pace']} birtoklás / 48 perc")
        key_factors.append(f"Modell pontbecslés: {game.home_team.abbreviation} {matchup_data['expected_home_score']} - {matchup_data['expected_away_score']} {game.away_team.abbreviation}")

        return GameAnalysis(
            game=game,
            simulation=sim_result,
            picks=picks,
            key_factors=key_factors
        )

    def _evaluate_markets(
        self,
        game: Game,
        matchup_data: dict,
        sim: Any
    ) -> List[PickRecommendation]:
        picks: List[PickRecommendation] = []
        odds = game.odds
        if not odds:
            return picks

        matchup_str = f"{game.away_team.abbreviation} @ {game.home_team.abbreviation}"
        bookmaker = odds.provider
        now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        uncertainty = matchup_data["uncertainty"]

        # ---------------- 1. MONEYLINE MARKET ----------------
        if odds.moneyline_home and odds.moneyline_away:
            fair_ml_home, fair_ml_away, vig_ml = remove_vig_two_way(odds.moneyline_home, odds.moneyline_away)
            
            # Home ML
            edge_home_ml = calculate_edge(sim.home_win_prob, fair_ml_home)
            ev_home_ml = calculate_ev(sim.home_win_prob, odds.moneyline_home)
            verdict_h, conf_h = evaluate_verdict(edge_home_ml, ev_home_ml, uncertainty)
            
            reason_h = [
                f"Modell győzelmi esély: {round(sim.home_win_prob * 100, 1)}% vs. Vig-mentes odds esély: {round(fair_ml_home * 100, 1)}%",
                f"Bukmékeri árrés (Vig): {vig_ml}%",
                f"Várható pontkülönbség: {matchup_data['expected_margin']} pont hazai javára"
            ]
            
            picks.append(PickRecommendation(
                id=f"{game.id}_ML_HOME",
                game_id=game.id,
                game_matchup=matchup_str,
                game_date=game.date,
                market="MONEYLINE",
                selection=f"{game.home_team.display_name} Győzelem",
                line=None,
                bookmaker_odds=odds.moneyline_home,
                bookmaker=bookmaker,
                implied_prob=decimal_to_implied_prob(odds.moneyline_home),
                fair_implied_prob=fair_ml_home,
                model_prob=sim.home_win_prob,
                edge=edge_home_ml,
                ev=ev_home_ml,
                kelly_stake=calculate_kelly_stake(sim.home_win_prob, odds.moneyline_home) if verdict_h != "PASS" else 0.0,
                confidence=conf_h,
                uncertainty=uncertainty,
                verdict=verdict_h,
                reasoning=reason_h,
                timestamp=now_str
            ))

            # Away ML
            edge_away_ml = calculate_edge(sim.away_win_prob, fair_ml_away)
            ev_away_ml = calculate_ev(sim.away_win_prob, odds.moneyline_away)
            verdict_a, conf_a = evaluate_verdict(edge_away_ml, ev_away_ml, uncertainty)
            
            reason_a = [
                f"Modell győzelmi esély: {round(sim.away_win_prob * 100, 1)}% vs. Vig-mentes odds esély: {round(fair_ml_away * 100, 1)}%",
                f"Bukmékeri árrés (Vig): {vig_ml}%",
                f"Vendég ORtg: {matchup_data['away_adj_ortg']} vs Hazai DRtg: {game.home_team.drtg}"
            ]
            
            picks.append(PickRecommendation(
                id=f"{game.id}_ML_AWAY",
                game_id=game.id,
                game_matchup=matchup_str,
                game_date=game.date,
                market="MONEYLINE",
                selection=f"{game.away_team.display_name} Győzelem",
                line=None,
                bookmaker_odds=odds.moneyline_away,
                bookmaker=bookmaker,
                implied_prob=decimal_to_implied_prob(odds.moneyline_away),
                fair_implied_prob=fair_ml_away,
                model_prob=sim.away_win_prob,
                edge=edge_away_ml,
                ev=ev_away_ml,
                kelly_stake=calculate_kelly_stake(sim.away_win_prob, odds.moneyline_away) if verdict_a != "PASS" else 0.0,
                confidence=conf_a,
                uncertainty=uncertainty,
                verdict=verdict_a,
                reasoning=reason_a,
                timestamp=now_str
            ))

        # ---------------- 2. SPREAD (HENDIKEP) MARKET ----------------
        if odds.spread is not None and odds.spread_home_odds and odds.spread_away_odds:
            spread_line = odds.spread
            cover_prob_h = sim.spread_cover_probs.get(str(spread_line), 0.50)
            cover_prob_a = round(1.0 - cover_prob_h, 4)
            
            fair_sp_h, fair_sp_a, vig_sp = remove_vig_two_way(odds.spread_home_odds, odds.spread_away_odds)
            
            edge_sp_h = calculate_edge(cover_prob_h, fair_sp_h)
            ev_sp_h = calculate_ev(cover_prob_h, odds.spread_home_odds)
            verdict_sp_h, conf_sp_h = evaluate_verdict(edge_sp_h, ev_sp_h, uncertainty)

            sign_h = f"+{spread_line}" if spread_line > 0 else f"{spread_line}"
            sign_a = f"+{-spread_line}" if -spread_line > 0 else f"{-spread_line}"

            picks.append(PickRecommendation(
                id=f"{game.id}_SPREAD_HOME",
                game_id=game.id,
                game_matchup=matchup_str,
                game_date=game.date,
                market="SPREAD",
                selection=f"{game.home_team.abbreviation} {sign_h}",
                line=spread_line,
                bookmaker_odds=odds.spread_home_odds,
                bookmaker=bookmaker,
                implied_prob=decimal_to_implied_prob(odds.spread_home_odds),
                fair_implied_prob=fair_sp_h,
                model_prob=cover_prob_h,
                edge=edge_sp_h,
                ev=ev_sp_h,
                kelly_stake=calculate_kelly_stake(cover_prob_h, odds.spread_home_odds) if verdict_sp_h != "PASS" else 0.0,
                confidence=conf_sp_h,
                uncertainty=uncertainty,
                verdict=verdict_sp_h,
                reasoning=[
                    f"Modell becsült hendikep: {round(-matchup_data['expected_margin'], 1)} vs. Piac hendikep: {sign_h}",
                    f"10 000 Monte Carlo szimuláció fedési aránya: {round(cover_prob_h * 100, 1)}%",
                    f"Vig-mentes fair valószínűség: {round(fair_sp_h * 100, 1)}%"
                ],
                timestamp=now_str
            ))

            edge_sp_a = calculate_edge(cover_prob_a, fair_sp_a)
            ev_sp_a = calculate_ev(cover_prob_a, odds.spread_away_odds)
            verdict_sp_a, conf_sp_a = evaluate_verdict(edge_sp_a, ev_sp_a, uncertainty)

            picks.append(PickRecommendation(
                id=f"{game.id}_SPREAD_AWAY",
                game_id=game.id,
                game_matchup=matchup_str,
                game_date=game.date,
                market="SPREAD",
                selection=f"{game.away_team.abbreviation} {sign_a}",
                line=-spread_line,
                bookmaker_odds=odds.spread_away_odds,
                bookmaker=bookmaker,
                implied_prob=decimal_to_implied_prob(odds.spread_away_odds),
                fair_implied_prob=fair_sp_a,
                model_prob=cover_prob_a,
                edge=edge_sp_a,
                ev=ev_sp_a,
                kelly_stake=calculate_kelly_stake(cover_prob_a, odds.spread_away_odds) if verdict_sp_a != "PASS" else 0.0,
                confidence=conf_sp_a,
                uncertainty=uncertainty,
                verdict=verdict_sp_a,
                reasoning=[
                    f"Vendég fedési valószínűség: {round(cover_prob_a * 100, 1)}%",
                    f"Modell spread margin különbség: {round(matchup_data['expected_margin'] + spread_line, 1)} pont",
                    f"Matematikai várható érték (EV): {ev_sp_a}%"
                ],
                timestamp=now_str
            ))

        # ---------------- 3. TOTALS (OVER / UNDER) MARKET ----------------
        if odds.over_under is not None and odds.over_odds and odds.under_odds:
            tot_line = odds.over_under
            # Probability from Monte Carlo
            # Normal distribution approximation on sim totals
            over_count = sum(item["count"] for item in sim.total_distribution if float(item["range"].split("-")[0]) >= tot_line)
            # More accurate continuous CDF calculation using normal approximation
            import scipy.stats as stats
            sim_tot_mean = sim.expected_total
            sim_tot_std = 16.5  # standard total deviation in NBA
            
            p_under = round(float(stats.norm.cdf(tot_line, loc=sim_tot_mean, scale=sim_tot_std)), 4)
            p_over = round(1.0 - p_under, 4)
            
            fair_over, fair_under, vig_tot = remove_vig_two_way(odds.over_odds, odds.under_odds)

            # Over
            edge_over = calculate_edge(p_over, fair_over)
            ev_over = calculate_ev(p_over, odds.over_odds)
            verdict_ov, conf_ov = evaluate_verdict(edge_over, ev_over, uncertainty)

            picks.append(PickRecommendation(
                id=f"{game.id}_TOTAL_OVER",
                game_id=game.id,
                game_matchup=matchup_str,
                game_date=game.date,
                market="TOTAL_OVER",
                selection=f"Over {tot_line}",
                line=tot_line,
                bookmaker_odds=odds.over_odds,
                bookmaker=bookmaker,
                implied_prob=decimal_to_implied_prob(odds.over_odds),
                fair_implied_prob=fair_over,
                model_prob=p_over,
                edge=edge_over,
                ev=ev_over,
                kelly_stake=calculate_kelly_stake(p_over, odds.over_odds) if verdict_ov != "PASS" else 0.0,
                confidence=conf_ov,
                uncertainty=uncertainty,
                verdict=verdict_ov,
                reasoning=[
                    f"Várható összpontszám: {matchup_data['expected_total']} pont vs. Piac vonal: {tot_line}",
                    f"Becsült tempó: {matchup_data['expected_pace']} birtoklás / 48 perc",
                    f"Modell Over valószínűség: {round(p_over * 100, 1)}% vs. Vig-mentes piaci esély: {round(fair_over * 100, 1)}%"
                ],
                timestamp=now_str
            ))

            # Under
            edge_under = calculate_edge(p_under, fair_under)
            ev_under = calculate_ev(p_under, odds.under_odds)
            verdict_un, conf_un = evaluate_verdict(edge_under, ev_under, uncertainty)

            picks.append(PickRecommendation(
                id=f"{game.id}_TOTAL_UNDER",
                game_id=game.id,
                game_matchup=matchup_str,
                game_date=game.date,
                market="TOTAL_UNDER",
                selection=f"Under {tot_line}",
                line=tot_line,
                bookmaker_odds=odds.under_odds,
                bookmaker=bookmaker,
                implied_prob=decimal_to_implied_prob(odds.under_odds),
                fair_implied_prob=fair_under,
                model_prob=p_under,
                edge=edge_under,
                ev=ev_under,
                kelly_stake=calculate_kelly_stake(p_under, odds.under_odds) if verdict_un != "PASS" else 0.0,
                confidence=conf_un,
                uncertainty=uncertainty,
                verdict=verdict_un,
                reasoning=[
                    f"Várható összpontszám: {matchup_data['expected_total']} pont vs. Piac vonal: {tot_line}",
                    f"Modell Under valószínűség: {round(p_under * 100, 1)}% (különbség: {round(tot_line - matchup_data['expected_total'], 1)} pont)",
                    f"Várható érték (EV): {ev_under}%"
                ],
                timestamp=now_str
            ))

        return picks
