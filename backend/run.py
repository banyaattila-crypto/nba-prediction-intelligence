import os
import uvicorn

LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # Alapértelmezés: csak a helyi gépről érhető el. Hálózatra nyitás: HOST=0.0.0.0
    host = os.getenv("HOST", "127.0.0.1")
    print(f"NBA Prediction & Betting Intelligence: http://{host}:{port}")
    if host not in LOOPBACK_HOSTS and not os.getenv("API_WRITE_TOKEN"):
        print("Figyelem: a szerver a hálózatról is elérhető, API_WRITE_TOKEN nélkül az írás csak a helyi gépről engedélyezett.")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
