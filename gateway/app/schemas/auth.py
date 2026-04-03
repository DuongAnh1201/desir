#LoginRequest, TokenResponse, UserOut
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr #validates it's a real email format
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    role: str
    class Config:
        from_attributes = True #tells Pydantic to automatically convert database objects to Python objects when returning them from the API.
    