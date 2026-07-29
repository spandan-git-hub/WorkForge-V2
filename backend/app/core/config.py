from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_EXPIRY_DAYS: int = 7
    FRONTEND_URL: str
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
