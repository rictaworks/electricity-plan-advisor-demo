import pytest
from app.services.session_manager import SessionManager


@pytest.fixture
def manager():
    return SessionManager()


def test_validate_uuid_valid(manager):
    assert manager.validate_uuid("550e8400-e29b-41d4-a716-446655440000") is True


def test_validate_uuid_v4_format(manager):
    import uuid
    assert manager.validate_uuid(str(uuid.uuid4())) is True


def test_validate_uuid_v1_returns_false(manager):
    assert manager.validate_uuid("550e8400-e29b-11d4-a716-446655440000") is False


def test_validate_uuid_invalid_string_returns_false(manager):
    assert manager.validate_uuid("not-a-uuid") is False


def test_validate_uuid_empty_returns_false(manager):
    assert manager.validate_uuid("") is False


def test_validate_uuid_none_returns_false(manager):
    assert manager.validate_uuid(None) is False  # type: ignore


def test_issue_new_session_returns_uuid_v4(manager, db):
    sid = manager.issue_new_session(db)
    assert manager.validate_uuid(sid) is True


def test_get_or_create_with_valid_existing_session(manager, db):
    sid = manager.issue_new_session(db)
    result = manager.get_or_create(sid, db)
    assert result == sid


def test_get_or_create_with_invalid_cookie_returns_new(manager, db):
    result = manager.get_or_create("invalid-cookie", db)
    assert manager.validate_uuid(result) is True
    assert result != "invalid-cookie"


def test_get_or_create_with_none_returns_new(manager, db):
    result = manager.get_or_create(None, db)
    assert manager.validate_uuid(result) is True


def test_get_or_create_with_unknown_valid_uuid_returns_new(manager, db):
    import uuid
    unknown = str(uuid.uuid4())
    result = manager.get_or_create(unknown, db)
    assert manager.validate_uuid(result) is True
