from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from app.models.schemas import Game, Team, Injury, OddsItem

class NBADataProvider(ABC):
    @abstractmethod
    async def get_today_games(self, date_str: Optional[str] = None) -> List[Game]:
        """Fetch games for today or a specific YYYYMMDD date."""
        pass

    @abstractmethod
    async def get_game_details(self, game_id: str) -> Optional[Game]:
        """Fetch detailed information for a specific game (injuries, live stats, odds)."""
        pass

    @abstractmethod
    async def get_team_standings(self) -> Dict[str, Team]:
        """Fetch team standings and season statistical profiles."""
        pass
