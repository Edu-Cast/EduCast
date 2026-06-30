def test_register_init_creates_unverified_user(base_url, http_session, unique_user):
    response = http_session.post(f"{base_url}/api/auth/register/init", json=unique_user)

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == unique_user["email"]
    assert body["login"] == unique_user["login"]
    assert body["verified"] is False


def test_register_init_rejects_duplicate_email(base_url, http_session, unique_user):
    first_response = http_session.post(f"{base_url}/api/auth/register/init", json=unique_user)
    assert first_response.status_code == 200

    response = http_session.post(
        f"{base_url}/api/auth/register/init",
        json={
            "login": f"{unique_user['login']}_2",
            "email": unique_user["email"],
            "password": unique_user["password"],
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Email is already in use"


def test_register_init_rejects_duplicate_login(base_url, http_session, unique_user):
    first_response = http_session.post(f"{base_url}/api/auth/register/init", json=unique_user)
    assert first_response.status_code == 200

    response = http_session.post(
        f"{base_url}/api/auth/register/init",
        json={
            "login": unique_user["login"],
            "email": f"other_{unique_user['email']}",
            "password": unique_user["password"],
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Login is already in use"


def test_register_init_rejects_invalid_email(base_url, http_session, unique_user):
    unique_user["email"] = "not-an-email"

    response = http_session.post(f"{base_url}/api/auth/register/init", json=unique_user)

    assert response.status_code == 400
    assert response.json()["email"] == "Incorrect email format"


def test_register_init_rejects_invalid_login_characters(base_url, http_session, unique_user):
    unique_user["login"] = "bad-login!"

    response = http_session.post(f"{base_url}/api/auth/register/init", json=unique_user)

    assert response.status_code == 400
    assert response.json()["login"] == "Login may contain only letters, digits, and underscore"


def test_register_init_rejects_short_login(base_url, http_session, unique_user):
    unique_user["login"] = "abc"

    response = http_session.post(f"{base_url}/api/auth/register/init", json=unique_user)

    assert response.status_code == 400
    assert response.json()["login"] == "Login can be from 4 to 30 symbols"


def test_register_init_rejects_weak_password(base_url, http_session, unique_user):
    unique_user["password"] = "weakpass"

    response = http_session.post(f"{base_url}/api/auth/register/init", json=unique_user)

    assert response.status_code == 400
    assert "Password must contain at least one uppercase letter" in response.json()["error"]
    assert "Password must contain at least one digit" in response.json()["error"]


def test_register_verify_rejects_unknown_user(base_url, http_session):
    response = http_session.post(
        f"{base_url}/api/auth/register/verify",
        json={"email": "missing_user@example.com", "verificationCode": 123456},
    )

    assert response.status_code == 400
    assert response.json()["error"] == "User not found"


def test_register_verify_rejects_wrong_code(base_url, http_session, unique_user):
    register_response = http_session.post(f"{base_url}/api/auth/register/init", json=unique_user)
    assert register_response.status_code == 200

    response = http_session.post(
        f"{base_url}/api/auth/register/verify",
        json={"email": unique_user["email"], "verificationCode": 0},
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Wrong code"


def test_register_verify_requires_code(base_url, http_session, unique_user):
    response = http_session.post(
        f"{base_url}/api/auth/register/verify",
        json={"email": unique_user["email"]},
    )

    assert response.status_code == 400
    assert response.json()["verificationCode"] == "Verification code can't be empty"


def test_resend_rejects_unknown_user(base_url, http_session):
    response = http_session.post(
        f"{base_url}/api/auth/register/resend",
        json={"email": "missing_user@example.com"},
    )

    assert response.status_code == 400
    assert response.json()["error"] == "User not found"


def test_resend_rejects_immediate_repeat_by_cooldown(base_url, http_session, unique_user):
    register_response = http_session.post(f"{base_url}/api/auth/register/init", json=unique_user)
    assert register_response.status_code == 200

    response = http_session.post(
        f"{base_url}/api/auth/register/resend",
        json={"email": unique_user["email"]},
    )

    assert response.status_code == 400
    assert "error" in response.json()


def test_login_rejects_unknown_user(base_url, http_session):
    response = http_session.post(
        f"{base_url}/api/auth/login",
        json={"email": "missing_user@example.com", "password": "StrongPass1"},
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Invalid email or password"


def test_login_rejects_unverified_user(base_url, http_session, unique_user):
    register_response = http_session.post(f"{base_url}/api/auth/register/init", json=unique_user)
    assert register_response.status_code == 200

    response = http_session.post(
        f"{base_url}/api/auth/login",
        json={"email": unique_user["email"], "password": unique_user["password"]},
    )

    assert response.status_code == 400
    assert response.json()["error"] == "Email is not verified"


def test_login_requires_email_and_password(base_url, http_session):
    response = http_session.post(f"{base_url}/api/auth/login", json={})

    assert response.status_code == 400
    body = response.json()
    assert body["email"] == "Email can't be empty"
    assert body["password"] == "Password can't be empty"
