from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    MONGO_URL: str
    DB_NAME: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 10080
    ANTHROPIC_API_KEY: str
    GEMINI_API_KEY: str
    CORS_ORIGINS: str = "*"
    CHUNK_SIZE: int = 900
    CHUNK_OVERLAP: int = 120
    TOP_K_CHUNKS: int = 5
    SIMILARITY_THRESHOLD: float = 0.55

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
