import re
import uuid
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session as DBSession
from app.config import settings
from app.models.session import Session

logger = logging.getLogger(__name__)


class SessionManager:
    def validate_uuid(self, value: str) -> bool:
        if not value:
            return False
        return bool(re.match(settings.UUID_V4_PATTERN, value, re.IGNORECASE))

    def issue_new_session(self, db: DBSession) -> str:
        new_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        session = Session(
            session_id=new_id,
            created_at=now,
            last_accessed_at=now,
        )
        db.add(session)
        db.commit()
        logger.info("New session issued: %s", new_id)
        return new_id

    def get_or_create(self, cookie_value: str | None, db: DBSession) -> str:
        if cookie_value and self.validate_uuid(cookie_value):
            existing = db.query(Session).filter(
                Session.session_id == cookie_value
            ).first()
            if existing:
                self.touch(existing.session_id, db)
                return existing.session_id
        return self.issue_new_session(db)

    def touch(self, session_id: str, db: DBSession) -> None:
        db.query(Session).filter(Session.session_id == session_id).update(
            {"last_accessed_at": datetime.now(timezone.utc)}
        )
        db.commit()
