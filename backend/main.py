import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.db import Database
from backend.routers.fishing import router as fishing_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Database.init()
    yield
    Database.close()


app = FastAPI(lifespan=lifespan)

cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(fishing_router, prefix="/api/fishing")
