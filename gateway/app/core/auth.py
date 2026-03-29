#JWT create/decode/verify logic
from datetime import datetime, timedelta, timezone
#python-jose is the library that handles JWT encoding and decoding. jwt is the object that does the actual work.
#JWTError is the exception it raises when something is wrong with a token.
from jose import JWTError, jwt
#HTTPException: how FastAPI sends an error response back to the client. 
#status is just a collection of named HTTP status codes
from fastapi import HTTPException, status
from app.config import settings

#define a function that takes a subject - in practice this will always be a user's ID as a string - and returns a JWT string.
def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes = settings.access_token_expire_minutes
    ) #calculate the expired time of the token.
    return jwt.encode(
        {"sub": subject, "exp":expire},
        settings.secret_key,
        algorithm = settings.algorithm,
    )
    #return a jwt string. 
    #first arguement is the payload - a dictionary of claims bakled into the token
    #secret key - a long random string only use your server knows. -> sign the token cryptographically.
    #algorithm - HS256 -> HMAC with SHA-256. this is the mathematical function used to generate the signature.

#decode the token -> the raw JWT strings from the previous function.
def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        subject: str = payload.get("sub")
        if subject is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
        return subject
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

