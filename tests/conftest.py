import os
import time
import uuid

import pytest
import requests


DEFAULT_BASE_URL = "http://localhost"
DEFAULT_FRONTEND_URL = "http://localhost"


@pytest.fixture(scope="session")
def base_url():
    return os.getenv("EDUCAST_BASE_URL", DEFAULT_BASE_URL).rstrip("/")


@pytest.fixture(scope="session")
def http_session():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def frontend_url():
    return os.getenv("EDUCAST_FRONTEND_URL", DEFAULT_FRONTEND_URL).rstrip("/")


@pytest.fixture(scope="session")
def frontend_session():
    return requests.Session()


@pytest.fixture(scope="session", autouse=True)
def wait_for_api(base_url, http_session):
    deadline = time.time() + int(os.getenv("EDUCAST_WAIT_SECONDS", "30"))
    last_error = None

    while time.time() < deadline:
        try:
            response = http_session.get(f"{base_url}/api/podcasts", timeout=3)
            if response.status_code < 500:
                return
            last_error = f"HTTP {response.status_code}: {response.text}"
        except requests.RequestException as exc:
            last_error = str(exc)
        time.sleep(1)

    pytest.fail(f"EduCast API is not reachable at {base_url}: {last_error}")


@pytest.fixture
def unique_user():
    suffix = uuid.uuid4().hex[:12]
    return {
        "login": f"user_{suffix}",
        "email": f"user_{suffix}@example.com",
        "password": "StrongPass1",
    }


def assert_requires_auth(response):
    assert response.status_code in (401, 403)


def assert_json_list_response(response):
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def assert_error_response(response, status_code, message):
    assert response.status_code == status_code
    assert response.json()["error"] == message
