from jose import jwt, ExpiredSignatureError
from fastapi import Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta, timezone
from typing import Optional
import os

SECRET = os.getenv("JWT_SECRET", "devsecret")
ALGO = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=EXPIRY_HOURS)
    to_encode.update({"exp": expire})
    encoded = jwt.encode(to_encode, SECRET, algorithm=ALGO)
    return encoded


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    token_query: Optional[str] = Query(None, alias="token")
):
    actual_token = token or token_query
    if not actual_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(actual_token, SECRET, algorithms=[ALGO])
        return payload.get("sub")
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
