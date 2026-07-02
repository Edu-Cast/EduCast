import os
import time
import uuid
from pathlib import Path

import pytest
import requests


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASE_URL = "http://localhost"
DEFAULT_FRONTEND_URL = "http://localhost"

PODCAST_FIELDS = {
    "id",
    "title",
    "description",
    "subject",
    "educationLevel",
    "durationSeconds",
    "fileSizeBytes",
    "authorLogin",
    "createdAt",
    "score",
}

USER_RESPONSE_FIELDS = {"email", "login", "verified"}
LOGIN_RESPONSE_FIELDS = {"token", "email", "login"}
COMMENT_FIELDS = {"id", "text", "authorLogin", "createdAt"}
ERROR_RESPONSE_FIELDS = {"error"}


@pytest.fixture(scope="session")
def repo_root():
    return REPO_ROOT


@pytest.fixture(scope="session")
def base_url():
    return os.getenv("EDUCAST_BASE_URL", DEFAULT_BASE_URL).rstrip("/")


@pytest.fixture(scope="session")
def frontend_url():
    return os.getenv("EDUCAST_FRONTEND_URL", DEFAULT_FRONTEND_URL).rstrip("/")


@pytest.fixture(scope="session")
def http_session():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def frontend_session():
    return requests.Session()


@pytest.fixture(scope="session")
def running_api(base_url, http_session):
    deadline = time.time() + int(os.getenv("EDUCAST_WAIT_SECONDS", "30"))
    last_error = None

    while time.time() < deadline:
        try:
            response = http_session.get(f"{base_url}/api/podcasts", timeout=3)
            if response.status_code < 500:
                return base_url
            last_error = f"HTTP {response.status_code}: {response.text}"
        except requests.RequestException as exc:
            last_error = str(exc)
        time.sleep(1)

    pytest.fail(f"EduCast API is not reachable at {base_url}: {last_error}")


@pytest.fixture(scope="session")
def running_frontend(frontend_url, frontend_session):
    deadline = time.time() + int(os.getenv("EDUCAST_WAIT_SECONDS", "30"))
    last_error = None

    while time.time() < deadline:
        try:
            response = frontend_session.get(frontend_url, timeout=3)
            if response.status_code < 500:
                return frontend_url
            last_error = f"HTTP {response.status_code}: {response.text[:200]}"
        except requests.RequestException as exc:
            last_error = str(exc)
        time.sleep(1)

    pytest.fail(f"EduCast frontend is not reachable at {frontend_url}: {last_error}")


@pytest.fixture
def unique_user():
    suffix = uuid.uuid4().hex[:12]
    return {
        "login": f"user_{suffix}",
        "email": f"user_{suffix}@example.com",
        "password": "StrongPass1",
    }


def read_project_file(relative_path):
    return (REPO_ROOT / relative_path).read_text(encoding="utf-8")


def assert_has_fields(body, required_fields):
    assert isinstance(body, dict)
    missing = set(required_fields) - set(body.keys())
    assert not missing, f"Missing response fields: {sorted(missing)}. Body: {body}"


def assert_error_response(response, status_code, message=None):
    assert response.status_code == status_code
    body = response.json()
    assert_has_fields(body, ERROR_RESPONSE_FIELDS)
    assert isinstance(body["error"], str)
    assert body["error"]
    if message is not None:
        assert body["error"] == message
    return body


def assert_validation_response(response, status_code=400):
    assert response.status_code == status_code
    body = response.json()
    assert isinstance(body, dict)
    assert body, "Validation response body must not be empty"
    assert all(isinstance(key, str) and key for key in body.keys())
    assert all(isinstance(value, str) and value for value in body.values())
    return body


def assert_requires_auth(response):
    assert response.status_code in (401, 403)


def assert_podcast_response(body):
    assert_has_fields(body, PODCAST_FIELDS)
    assert isinstance(body["id"], int)
    assert isinstance(body["title"], str)
    assert isinstance(body["description"], str)
    assert isinstance(body["subject"], str)
    assert isinstance(body["educationLevel"], str)
    assert isinstance(body["durationSeconds"], int)
    assert isinstance(body["fileSizeBytes"], int)
    assert isinstance(body["authorLogin"], str)
    assert isinstance(body["createdAt"], str)
    assert isinstance(body["score"], int)


def assert_podcast_list_response(response):
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    for podcast in body:
        assert_podcast_response(podcast)
    return body


def assert_user_response(response, verified=None):
    assert response.status_code == 200
    body = response.json()
    assert_has_fields(body, USER_RESPONSE_FIELDS)
    assert isinstance(body["email"], str)
    assert isinstance(body["login"], str)
    assert isinstance(body["verified"], bool)
    if verified is not None:
        assert body["verified"] is verified
    return body


def assert_login_response(response):
    assert response.status_code == 200
    body = response.json()
    assert_has_fields(body, LOGIN_RESPONSE_FIELDS)
    assert isinstance(body["token"], str)
    assert body["token"]
    assert isinstance(body["email"], str)
    assert isinstance(body["login"], str)
    return body


def assert_comment_response(body):
    assert_has_fields(body, COMMENT_FIELDS)
    assert isinstance(body["id"], int)
    assert isinstance(body["text"], str)
    assert isinstance(body["authorLogin"], str)
    assert isinstance(body["createdAt"], str)


def assert_comment_list_response(response):
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    for comment in body:
        assert_comment_response(comment)
    return body
