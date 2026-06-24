from fastapi import APIRouter, Depends

from services.auth_service import get_current_user
from services.speech import create_realtime_token

router = APIRouter(prefix="/api/speech", tags=["speech"])


@router.post("/realtime-token")
async def realtime_token(current_user: dict = Depends(get_current_user)) -> dict:
    token = await create_realtime_token()
    return {"token": token, "expires_in": 900}
