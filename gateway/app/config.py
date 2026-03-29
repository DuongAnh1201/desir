#All settings from environment
import os
from dotenv import load_dotenv
load_dotenv()

class Settings():
    #Gateway
    secret_key: str= os.getenv("SECRET_KEY")
    algorithm: str = os.getenv("ALGORITHM")
    access_token_expire_minutes: int = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")

    #CORS
    cors_origin: str = os.getenv("CORS_ORIGIN")

    #DATABASE
    database_url: str = os.getenv("DATABASE_URL")

settings= Settings()