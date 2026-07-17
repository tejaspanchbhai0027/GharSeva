from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional

class Settings(BaseSettings):
    APP_ENV: str = "development"
    
    # Security
    SECRET_KEY: str = "supersecretjwtkeythatisatleast32characterslong"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # DB Connections
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/gharseva"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Razorpay
    RAZORPAY_KEY_ID: str = "rzp_test_placeholder"
    RAZORPAY_KEY_SECRET: str = "placeholder_secret"
    
    # Communications
    SENDGRID_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "noreply@gharseva.com"
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Google Maps
    GOOGLE_MAPS_API_KEY: Optional[str] = None

    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"
    )

settings = Settings()
