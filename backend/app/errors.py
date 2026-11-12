class DataSourceError(RuntimeError):
    """Az adatforrás (ESPN) nem érhető el vagy használhatatlan választ adott. Az API 503-mal jelzi."""


class InsufficientDataError(DataSourceError):
    """Egy meccs nem értékelhető, mert hiányzik hozzá az alapadat (pl. csapatstatisztika)."""
