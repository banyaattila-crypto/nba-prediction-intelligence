"""Az írást végző végpontok védelme (tipp rögzítése, elszámolás).

Két üzemmód:
- `API_WRITE_TOKEN` beállítva: minden írás `Authorization: Bearer <token>` fejlécet kér, bárhonnan.
- nincs token (alapértelmezett, egyfelhasználós helyi használat): írni csak a helyi gépről lehet,
  és csak olyan kérésből, amely nem idegen weboldalról (cross-origin) és nem DNS-rebinding úton érkezik.

Megjegyzés: ha az alkalmazás fordított proxy mögött fut, a kliens címe a proxy címe (helyi). Ilyenkor
mindenképp állítsd be az API_WRITE_TOKEN-t.
"""
import hmac
import os
from typing import List
from urllib.parse import urlparse

from fastapi import HTTPException, Request

LOOPBACK_ADDRESSES = {"127.0.0.1", "::1"}
LOOPBACK_HOSTNAMES = {"localhost", "127.0.0.1", "::1"}

DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]


def allowed_origins() -> List[str]:
    """Engedélyezett böngészős eredetek (CORS és írás); felülírható: CORS_ORIGINS=a,b,c"""
    raw = os.getenv("CORS_ORIGINS", "")
    configured = [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]
    return configured or DEFAULT_ORIGINS


def _hostname(netloc: str) -> str:
    # "localhost:8000" -> "localhost"; "[::1]:8000" -> "::1"
    return (urlparse(f"//{netloc}").hostname or "").lower()


def require_write_access(request: Request) -> None:
    token = os.getenv("API_WRITE_TOKEN")
    if token:
        supplied = request.headers.get("authorization", "")
        if not hmac.compare_digest(supplied.encode(), f"Bearer {token}".encode()):
            raise HTTPException(
                status_code=401,
                detail="Az íráshoz érvényes API-token kell (Authorization: Bearer ...).",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return

    client = request.client.host if request.client else None
    if client not in LOOPBACK_ADDRESSES:
        raise HTTPException(
            status_code=403,
            detail="Írás csak a helyi gépről engedélyezett. Távoli használathoz állítsd be az API_WRITE_TOKEN változót.",
        )

    # DNS-rebinding ellen: a Host fejléc is helyi név kell legyen.
    if _hostname(request.headers.get("host", "")) not in LOOPBACK_HOSTNAMES:
        raise HTTPException(status_code=403, detail="Az írási kérés Host fejléce nem helyi név, elutasítva.")

    # Idegen weboldalról indított (cross-site) kérés ellen: a böngésző mindig küld Origin fejlécet.
    origin = request.headers.get("origin")
    if origin:
        same_origin = urlparse(origin).netloc.lower() == request.headers.get("host", "").lower()
        if not same_origin and origin.rstrip("/") not in allowed_origins():
            raise HTTPException(status_code=403, detail="Idegen eredetű (cross-origin) írási kérés elutasítva.")
