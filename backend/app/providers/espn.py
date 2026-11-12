import time
import httpx
from typing import List, Optional, Dict, Any
from app.providers.base import NBADataProvider
from app.models.schemas import Game, Team, Injury, OddsItem
from app.quant.ev_calculator import american_to_decimal

ESPN_SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
ESPN_SUMMARY_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary"
ESPN_STANDINGS_URL = "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings"


def parse_american_odds(value: Any) -> Optional[float]:
    """Amerikai szorzó ("-437", "+341", -440, "EVEN") tizedes szorzóvá. Hiányzó vagy nem fogadható ("OFF") érték: None."""
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        n = float(value)
    else:
        text = str(value).strip().upper()
        if text in ("EVEN", "EV"):
            n = 100.0
        else:
            try:
                n = float(text.replace("+", ""))
            except ValueError:
                return None
    if -100 < n < 100:  # nem érvényes amerikai ár (0 is)
        return None
    return american_to_decimal(n)


def parse_line(value: Any) -> Optional[float]:
    """Vonal ("-10.5", "+10.5", "o221.5", "u221.5", 221.5) számmá; hiányzó érték: None."""
    if value is None or isinstance(value, bool):
        return None
    text = str(value).strip().lower()
    if text[:1] in ("o", "u"):
        text = text[1:]
    try:
        return float(text.replace("+", ""))
    except ValueError:
        return None


def parse_odds(entry: Dict[str, Any]) -> Optional[OddsItem]:
    """Az ESPN odds-blokkjából (scoreboard `odds[0]` vagy summary `pickcenter[0]`) árak és vonalak.

    Csak azt adja vissza, amit az ESPN tényleg közöl: ami hiányzik vagy nem fogadható (pl. "OFF"), az None.
    A hendikep vonala a hazai csapat szemszögéből értendő.
    """
    if not entry:
        return None
    ml, ps, tt = entry.get("moneyline") or {}, entry.get("pointSpread") or {}, entry.get("total") or {}
    home_t, away_t = entry.get("homeTeamOdds") or {}, entry.get("awayTeamOdds") or {}

    def close(block: Dict[str, Any], side: str, key: str) -> Any:
        return ((block.get(side) or {}).get("close") or {}).get(key)

    def first(*values: Optional[float]) -> Optional[float]:
        return next((v for v in values if v is not None), None)

    odds = OddsItem(
        provider=(entry.get("provider") or {}).get("name") or "Ismeretlen",
        spread=first(parse_line(close(ps, "home", "line")), parse_line(entry.get("spread"))),
        spread_home_odds=first(parse_american_odds(close(ps, "home", "odds")), parse_american_odds(home_t.get("spreadOdds"))),
        spread_away_odds=first(parse_american_odds(close(ps, "away", "odds")), parse_american_odds(away_t.get("spreadOdds"))),
        over_under=first(parse_line(close(tt, "over", "line")), parse_line(entry.get("overUnder"))),
        over_odds=first(parse_american_odds(close(tt, "over", "odds")), parse_american_odds(entry.get("overOdds"))),
        under_odds=first(parse_american_odds(close(tt, "under", "odds")), parse_american_odds(entry.get("underOdds"))),
        moneyline_home=first(parse_american_odds(close(ml, "home", "odds")), parse_american_odds(home_t.get("moneyLine"))),
        moneyline_away=first(parse_american_odds(close(ml, "away", "odds")), parse_american_odds(away_t.get("moneyLine"))),
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    )
    has_any = any(v is not None for k, v in odds.model_dump().items() if k not in ("provider", "timestamp"))
    return odds if has_any else None

class ESPNProvider(NBADataProvider):
    def __init__(self, cache_ttl_seconds: int = 120):
        self.cache_ttl = cache_ttl_seconds
        self._scoreboard_cache: Dict[str, Any] = {}
        self._standings_cache: Optional[Dict[str, Team]] = None
        self._standings_timestamp: float = 0
        self._summary_cache: Dict[str, Any] = {}
        self.client = httpx.AsyncClient(headers={"User-Agent": "Mozilla/5.0 (NBA-Intel/1.0)"}, timeout=10.0)

    async def get_team_standings(self) -> Dict[str, Team]:
        """Fetch and cache all 30 NBA teams with standings, ratings and pace."""
        now = time.time()
        if self._standings_cache and (now - self._standings_timestamp < 1800):  # 30 min cache
            return self._standings_cache

        teams_dict: Dict[str, Team] = {}
        try:
            resp = await self.client.get(ESPN_STANDINGS_URL)
            if resp.status_code == 200:
                data = resp.json()
                for conf in data.get("children", []):
                    for entry in conf.get("standings", {}).get("entries", []):
                        t_data = entry.get("team", {})
                        t_id = str(t_data.get("id"))
                        name = t_data.get("displayName", "NBA Team")
                        short_name = t_data.get("name", name)
                        abbreviation = t_data.get("abbreviation", "NBA")
                        logo = t_data.get("logos", [{}])[0].get("href", "")
                        
                        stats_map = {s.get("name"): s.get("value", 0.0) for s in entry.get("stats", [])}
                        wins = int(stats_map.get("wins", 0))
                        losses = int(stats_map.get("losses", 0))
                        ppg = float(stats_map.get("avgPointsFor", 112.0))
                        opp_ppg = float(stats_map.get("avgPointsAgainst", 112.0))
                        diff = float(stats_map.get("differential", 0.0))
                        rank = int(stats_map.get("playoffSeed", 8))
                        
                        # Estimated Pace and ORtg/DRtg
                        # NBA average pace ~ 99.2 possessions/game
                        estimated_pace = round(98.5 + (ppg + opp_ppg - 224.0) * 0.15, 1)
                        estimated_pace = max(95.0, min(104.0, estimated_pace))
                        
                        ortg = round((ppg / estimated_pace) * 100.0, 1)
                        drtg = round((opp_ppg / estimated_pace) * 100.0, 1)

                        team = Team(
                            id=t_id,
                            name=short_name,
                            display_name=name,
                            abbreviation=abbreviation,
                            logo=logo,
                            record=f"{wins}-{losses}",
                            conference_rank=rank,
                            wins=wins,
                            losses=losses,
                            points_per_game=round(ppg, 1),
                            points_allowed_per_game=round(opp_ppg, 1),
                            ortg=ortg,
                            drtg=drtg,
                            pace=estimated_pace
                        )
                        teams_dict[t_id] = team
                        teams_dict[abbreviation] = team
                        teams_dict[name] = team
        except Exception as e:
            print(f"Warning: Failed to fetch live standings ({e}). Fallback to standard league defaults.")

        if teams_dict:
            self._standings_cache = teams_dict
            self._standings_timestamp = now
        return teams_dict

    async def get_today_games(self, date_str: Optional[str] = None) -> List[Game]:
        """Fetch games from ESPN scoreboard API."""
        params = {}
        if date_str:
            params["dates"] = date_str

        cache_key = date_str or "today"
        now = time.time()
        cached = self._scoreboard_cache.get(cache_key)
        if cached and (now - cached["time"] < self.cache_ttl):
            return cached["games"]

        standings = await self.get_team_standings()
        games: List[Game] = []

        try:
            resp = await self.client.get(ESPN_SCOREBOARD_URL, params=params)
            if resp.status_code == 200:
                data = resp.json()
                events = data.get("events", [])
                for ev in events:
                    g = self._parse_event_to_game(ev, standings)
                    if g:
                        games.append(g)
        except Exception as e:
            print(f"Error fetching ESPN scoreboard: {e}")

        # If empty or failed (e.g. offline test), return fallback games
        if not games:
            games = self._generate_fallback_games()

        self._scoreboard_cache[cache_key] = {"time": now, "games": games}
        return games

    def _parse_event_to_game(self, ev: Dict[str, Any], standings: Dict[str, Team]) -> Optional[Game]:
        try:
            game_id = str(ev.get("id"))
            date_str = ev.get("date", "")
            status_obj = ev.get("status", {})
            status_type = status_obj.get("type", {})
            raw_state = status_type.get("state", "pre")  # 'pre', 'in', 'post'
            status_desc = status_type.get("description", "Scheduled")
            period = status_obj.get("period", 0)
            clock = status_obj.get("displayClock", "")

            state_map = {"pre": "scheduled", "in": "in_progress", "post": "final"}
            game_status = state_map.get(raw_state, "scheduled")

            comp = ev.get("competitions", [{}])[0]
            competitors = comp.get("competitors", [])
            home_raw = next((c for c in competitors if c.get("homeAway") == "home"), None)
            away_raw = next((c for c in competitors if c.get("homeAway") == "away"), None)

            if not home_raw or not away_raw:
                return None

            home_team_id = str(home_raw.get("id"))
            away_team_id = str(away_raw.get("id"))

            # Build or retrieve team objects
            home_team = standings.get(home_team_id) or self._create_team_from_raw(home_raw)
            away_team = standings.get(away_team_id) or self._create_team_from_raw(away_raw)

            home_score = int(home_raw["score"]) if home_raw.get("score") and raw_state != "pre" else None
            away_score = int(away_raw["score"]) if away_raw.get("score") and raw_state != "pre" else None

            raw_odds = comp.get("odds", [])
            odds_item = parse_odds(raw_odds[0]) if raw_odds else None

            venue_name = comp.get("venue", {}).get("fullName", "")

            return Game(
                id=game_id,
                date=date_str,
                venue=venue_name,
                status=game_status,
                status_detail=status_desc,
                period=period,
                clock=clock,
                home_team=home_team,
                away_team=away_team,
                home_score=home_score,
                away_score=away_score,
                odds=odds_item,
                home_rest_days=1,
                away_rest_days=1,
                home_is_b2b=False,
                away_is_b2b=False
            )
        except Exception as e:
            print(f"Error parsing event: {e}")
            return None

    def _create_team_from_raw(self, raw_c: Dict[str, Any]) -> Team:
        t_data = raw_c.get("team", {})
        t_id = str(t_data.get("id"))
        return Team(
            id=t_id,
            name=t_data.get("name", "Team"),
            display_name=t_data.get("displayName", "Team"),
            abbreviation=t_data.get("abbreviation", "NBA"),
            logo=t_data.get("logo") or t_data.get("logos", [{}])[0].get("href", ""),
            record=raw_c.get("records", [{}])[0].get("summary", "0-0"),
            wins=10,
            losses=5,
            points_per_game=113.0,
            points_allowed_per_game=111.0,
            ortg=114.0,
            drtg=112.0,
            pace=99.0
        )

    async def get_game_details(self, game_id: str) -> Optional[Game]:
        """Fetch full game summary: injuries, advanced odds, and matchup trends."""
        now = time.time()
        cached = self._summary_cache.get(game_id)
        if cached and (now - cached["time"] < 120):
            return cached["game"]

        # Fetch base game first from scoreboard
        today_games = await self.get_today_games()
        target_game = next((g for g in today_games if g.id == game_id), None)
        if not target_game:
            return None

        # Fetch detailed summary
        try:
            resp = await self.client.get(ESPN_SUMMARY_URL, params={"event": game_id})
            if resp.status_code == 200:
                data = resp.json()
                
                # Parse injuries
                injuries_home: List[Injury] = []
                injuries_away: List[Injury] = []
                
                for team_inj in data.get("injuries", []):
                    team_id = str(team_inj.get("team", {}).get("id"))
                    is_home = (team_id == target_game.home_team.id)
                    for inj in team_inj.get("injuries", []):
                        athlete = inj.get("athlete", {})
                        p_name = athlete.get("displayName", "Player")
                        pos = athlete.get("position", {}).get("abbreviation", "")
                        status = inj.get("status", "Questionable")
                        detail = inj.get("details", {}).get("detail", inj.get("type", ""))
                        
                        injury_obj = Injury(
                            player_name=p_name,
                            position=pos,
                            status=status,
                            detail=detail
                        )
                        if is_home:
                            injuries_home.append(injury_obj)
                        else:
                            injuries_away.append(injury_obj)
                
                target_game.injuries_home = injuries_home
                target_game.injuries_away = injuries_away

                # Parse pickcenter / odds details: csak akkor írja felül az árakat, ha van használható adat
                pickcenter = data.get("pickcenter", [])
                detailed_odds = parse_odds(pickcenter[0]) if pickcenter else None
                if detailed_odds:
                    target_game.odds = detailed_odds

        except Exception as e:
            print(f"Error fetching game summary for {game_id}: {e}")

        self._summary_cache[game_id] = {"time": now, "game": target_game}
        return target_game

    def _generate_fallback_games(self) -> List[Game]:
        """High-fidelity fallback games when network is unavailable."""
        return [
            Game(
                id="401909966",
                date="2026-11-12T00:00:00Z",
                venue="Gainbridge Fieldhouse, Indianapolis",
                status="scheduled",
                period=0,
                home_team=Team(
                    id="11", name="Pacers", display_name="Indiana Pacers", abbreviation="IND",
                    logo="https://a.espncdn.com/i/teamlogos/nba/500/ind.png",
                    record="6-4", conference_rank=5, wins=6, losses=4,
                    points_per_game=116.2, points_allowed_per_game=114.5,
                    ortg=116.5, drtg=115.0, pace=101.2
                ),
                away_team=Team(
                    id="27", name="Wizards", display_name="Washington Wizards", abbreviation="WAS",
                    logo="https://a.espncdn.com/i/teamlogos/nba/500/was.png",
                    record="2-7", conference_rank=14, wins=2, losses=7,
                    points_per_game=108.4, points_allowed_per_game=122.1,
                    ortg=107.5, drtg=120.8, pace=100.5
                ),
                odds=OddsItem(
                    provider="DraftKings",
                    spread=-6.5,
                    spread_home_odds=1.91,
                    spread_away_odds=1.91,
                    over_under=228.5,
                    over_odds=1.91,
                    under_odds=1.91,
                    moneyline_away=3.20,
                    moneyline_home=1.38,
                    timestamp="2026-11-11T20:00:00Z"
                ),
                injuries_home=[
                    Injury(player_name="Aaron Nesmith", position="SF", status="Out", detail="Ankle sprain")
                ],
                injuries_away=[
                    Injury(player_name="Malcolm Brogdon", position="PG", status="Questionable", detail="Thumb surgery")
                ]
            ),
            Game(
                id="401909967",
                date="2026-11-12T00:30:00Z",
                venue="Madison Square Garden, New York",
                status="scheduled",
                period=0,
                home_team=Team(
                    id="18", name="Knicks", display_name="New York Knicks", abbreviation="NY",
                    logo="https://a.espncdn.com/i/teamlogos/nba/500/ny.png",
                    record="7-4", conference_rank=4, wins=7, losses=4,
                    points_per_game=115.8, points_allowed_per_game=110.2,
                    ortg=117.2, drtg=111.5, pace=97.5
                ),
                away_team=Team(
                    id="5", name="Cavaliers", display_name="Cleveland Cavaliers", abbreviation="CLE",
                    logo="https://a.espncdn.com/i/teamlogos/nba/500/cle.png",
                    record="11-0", conference_rank=1, wins=11, losses=0,
                    points_per_game=122.4, points_allowed_per_game=110.1,
                    ortg=123.0, drtg=109.8, pace=100.2
                ),
                odds=OddsItem(
                    provider="DraftKings",
                    spread=-2.5,
                    spread_home_odds=1.91,
                    spread_away_odds=1.91,
                    over_under=222.5,
                    over_odds=1.91,
                    under_odds=1.91,
                    moneyline_away=2.15,
                    moneyline_home=1.74,
                    timestamp="2026-11-11T20:00:00Z"
                ),
                injuries_home=[
                    Injury(player_name="Mitchell Robinson", position="C", status="Out", detail="Ankle surgery rehab")
                ],
                injuries_away=[]
            )
        ]
