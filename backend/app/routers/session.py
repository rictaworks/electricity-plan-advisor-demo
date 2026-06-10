import logging
from fastapi import APIRouter, Depends, Cookie, Response
from sqlalchemy.orm import Session as DBSession
from typing import Optional
from app.config import settings
from app.database import get_db
from app.schemas.session import SessionResponse
from app.services.session_manager import SessionManager

logger = logging.getLogger(__name__)
router = APIRouter()
_session_manager = SessionManager()


@router.get("/api/session", response_model=SessionResponse)
def get_session(
    response: Response,
    session_id: Optional[str] = Cookie(default=None, alias=settings.SESSION_COOKIE_NAME),
    db: DBSession = Depends(get_db),
) -> SessionResponse:
    sid = _session_manager.get_or_create(session_id, db)
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=sid,
        httponly=True,
        samesite="lax",
        max_age=settings.SESSION_TTL_HOURS * 3600,
    )
    return SessionResponse(session_id=sid)
