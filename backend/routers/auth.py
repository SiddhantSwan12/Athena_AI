import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from db import users_col
from models.schemas import AuthResponse, LoginRequest, SignupRequest, UserOut
from services.auth_service import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_payload(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "created_at": user["created_at"],
    }


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest):
    existing = await users_col.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = {
        "id": str(uuid.uuid4()),
        "email": req.email.lower(),
        "name": req.name.strip(),
        "password_hash": hash_password(req.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await users_col.insert_one(user)
    token = create_access_token(user["id"], user["email"])
    return AuthResponse(access_token=token, user=_user_payload(user))


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = await users_col.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(user["id"], user["email"])
    return AuthResponse(access_token=token, user=_user_payload(user))


@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return UserOut(**_user_payload(current_user))
