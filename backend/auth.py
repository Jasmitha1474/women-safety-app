# auth.py
import os
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.hash import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from mongodb_config import db

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key_here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 1 day

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ----- Hashing + Verifying PIN -----
def hash_pin(pin: str) -> str:
    return bcrypt.hash(pin)

def verify_pin(pin: str, hashed: str) -> bool:
    return bcrypt.verify(pin, hashed)

# ----- JWT Token -----
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ----- User Retrieval -----
def get_current_user(token: str = Depends(oauth2_scheme)):
    """Verify token and fetch user from MongoDB"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        phone: str = payload.get("sub")
        if phone is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db["users"].find_one({"phone": phone})
    if not user:
        raise credentials_exception
    user["_id"] = str(user["_id"])
    return user

def get_current_user_optional(token: str = Depends(oauth2_scheme)):
    """Same as get_current_user but returns None if invalid"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        phone = payload.get("sub")
        if not phone:
            return None
        user = db["users"].find_one({"phone": phone})
        if user:
            user["_id"] = str(user["_id"])
        return user
    except:
        return None
