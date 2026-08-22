import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "StudyPilot"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    
    # Security
    JWT_SECRET: str = "studypilot-super-secret-production-key-change-me-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./studypilot.db"
    
    # AI / LLM Configuration
    GEMINI_API_KEY: str = ""
    AI_API_KEY: str = ""
    AI_MODEL: str = "gemini-1.5-flash"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://studypilot-gilt.vercel.app",
        "https://studypilot.vercel.app",
    ]

settings = Settings()
