#app created, middleware registered, routers mounted
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.db.session import init_db
from app.config import settings
from app.routers.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware




@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()        # creates tables on startup
    yield                  # server runs here
                           # anything after yield runs on shutdown


app = FastAPI(
    title="API Gateway",
    version="0.1.0",
    lifespan=lifespan,
)
app.include_router(auth_router)

@app.get("/health")
async def health():
    return {"status": "ok"}