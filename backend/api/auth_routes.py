from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from api.auth import create_access_token, get_current_user
from db.database import SessionLocal
from db.models import User
from api.security import hash_password, verify_password

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class ChangePasswordRequest(BaseModel):
    new_password: str

@router.post("/login")
def login(data: LoginRequest):
    db = SessionLocal()
    username = data.username
    password = data.password

    user = db.query(User).filter(User.username == username).first()

    if not user or not verify_password(password, user.hashed_password):
        db.close()
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": username})
    must_change = user.must_change_password if user.must_change_password else False
    db.close()
    return {"access_token": token, "token_type": "bearer", "must_change_password": must_change}

@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: str = Depends(get_current_user)
):
    db = SessionLocal()
    user = db.query(User).filter(User.username == current_user).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(data.new_password)
    user.must_change_password = False
    db.commit()
    db.close()
    return {"message": "Password updated successfully"}
