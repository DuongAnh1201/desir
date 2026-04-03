#shared Depends(): current_user, db session, http client
#the way of saying: "run this function first, and give me whatever it returns"
from fastapi import Depends, HTTPException, status
#HTTPBearer is a pre-built helper that knows how to read the Authorization: Bear <token> header from an incoming request
#HTTPAuthorizationCredentials is the object it returns after reading that header- it holds the scheme('Bearer') and the raw token string
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, HTTPBearer
#The type for an async database session. 
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth import decode_token
from app.db.session import get_db
#theSQLAlchemy User model - the  python class that maps to the users table. We need it here to look up the user by ID and also as the return type of the function
from app.db.models import User

#called outside the function, so it's created once and reused across all requests.
#it's created once and reused across all requests. -> This instance does one job: when FastAPI calls it as a dependency, it reads the Authorization header from the request and returns a credential object.
#if the header is missing, it raises a 403 automatically before the code runs.
bearer = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer), # before the function runs, FastAPI first runs bearer.
    #bearer reads the Authorization header and returns an HTTPAuthorizationCredentials object.
    db: AsyncSession = Depends(get_db)
    #FastAPI also runs get_db, which opens a database session and yields it. After the request finishes, FastAPI returns to get_db and closes the session
) -> User: #User object
    user_id = decode_token(credentials.credentials) #Credential is the object bearer returned. It has two attributes: .scheme and .credentials
    user = await db.get(User, int(user_id)) #db.get(Model, primary_key) is SQLAlchemy's shortcut for fetching one row by its primary key.
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user