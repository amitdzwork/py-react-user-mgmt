# app/test_users.py
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from app.main import app, get_db  # absolute import

@pytest.fixture(autouse=True)
def override_db():
    fake_session = MagicMock(name="Session")

    def _gen():
        yield fake_session

    app.dependency_overrides[get_db] = _gen
    try:
        yield fake_session
    finally:
        app.dependency_overrides.clear()

@pytest.fixture
def app_client():
    return TestClient(app)

def test_delete_user_not_found(app_client, override_db):
    # Simulate no user
    override_db.query.return_value.filter.return_value.first.return_value = None

    r = app_client.delete("/user", params={"user_id": 42})
    assert r.status_code == 404
    assert r.json()["detail"] == "User not found"

def test_delete_user_success(app_client, override_db):
    # Simulate found user
    fake_user = MagicMock(user_id=123)
    override_db.query.return_value.filter.return_value.first.return_value = fake_user

    r = app_client.delete("/user", params={"user_id": 123})
    assert r.status_code == 200
    body = r.json()
    assert body["deleted"] is True
    assert body["user_id"] == 123

