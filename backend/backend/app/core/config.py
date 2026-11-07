from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Ganraj Logistics Service"
    ENV: str = "dev"
    DATABASE_URL: str = "sqlite:///./ganraj.db"
    SECRET_KEY: str = "ganraj-logistics-secret-key-development-2026-prod-ready"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
    RATE_LIMIT_PER_MINUTE: int = 10

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    NOTIFY_EMAIL: str = ""
    WHATSAPP_API_URL: str = ""
    WHATSAPP_API_TOKEN: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


def get_settings() -> Settings:
    return Settings()  # raises early if required vars are missing
