from tests.conftest import (
    assert_error_response,
    assert_login_response,
    assert_user_response,
    assert_validation_response,
)


def test_register_init_returns_documented_user_response_fields(running_api, http_session, unique_user):
    response = http_session.post(f"{running_api}/api/auth/register/init", json=unique_user)

    body = assert_user_response(response, verified=False)
    assert body["email"] == unique_user["email"]
    assert body["login"] == unique_user["login"]


def test_register_init_rejects_duplicate_email(running_api, http_session, unique_user):
    first_response = http_session.post(f"{running_api}/api/auth/register/init", json=unique_user)
    assert_user_response(first_response, verified=False)

    response = http_session.post(
        f"{running_api}/api/auth/register/init",
        json={
            "login": f"{unique_user['login']}_2",
            "email": unique_user["email"],
            "password": unique_user["password"],
        },
    )

    assert_error_response(response, 400, "Email is already in use")


def test_register_init_rejects_duplicate_login(running_api, http_session, unique_user):
    first_response = http_session.post(f"{running_api}/api/auth/register/init", json=unique_user)
    assert_user_response(first_response, verified=False)

    response = http_session.post(
        f"{running_api}/api/auth/register/init",
        json={
            "login": unique_user["login"],
            "email": f"other_{unique_user['email']}",
            "password": unique_user["password"],
        },
    )

    assert_error_response(response, 400, "Login is already in use")


def test_register_init_validates_email_format(running_api, http_session, unique_user):
    unique_user["email"] = "not-an-email"

    response = http_session.post(f"{running_api}/api/auth/register/init", json=unique_user)

    body = assert_validation_response(response)
    assert "email" in body


def test_register_init_validates_login_characters(running_api, http_session, unique_user):
    unique_user["login"] = "bad-login!"

    response = http_session.post(f"{running_api}/api/auth/register/init", json=unique_user)

    body = assert_validation_response(response)
    assert "login" in body


def test_register_init_validates_login_length(running_api, http_session, unique_user):
    unique_user["login"] = "abc"

    response = http_session.post(f"{running_api}/api/auth/register/init", json=unique_user)

    body = assert_validation_response(response)
    assert "login" in body


def test_register_init_rejects_password_without_uppercase(running_api, http_session, unique_user):
    unique_user["password"] = "password123"

    response = http_session.post(f"{running_api}/api/auth/register/init", json=unique_user)

    body = assert_error_response(response, 400)
    assert "uppercase" in body["error"].lower()


def test_register_init_rejects_password_without_lowercase(running_api, http_session, unique_user):
    unique_user["password"] = "PASSWORD123"

    response = http_session.post(f"{running_api}/api/auth/register/init", json=unique_user)

    body = assert_error_response(response, 400)
    assert "lowercase" in body["error"].lower()


def test_register_init_rejects_password_without_digit(running_api, http_session, unique_user):
    unique_user["password"] = "PasswordOnly"

    response = http_session.post(f"{running_api}/api/auth/register/init", json=unique_user)

    body = assert_error_response(response, 400)
    assert "digit" in body["error"].lower()


def test_register_verify_rejects_unknown_user(running_api, http_session):
    response = http_session.post(
        f"{running_api}/api/auth/register/verify",
        json={"email": "missing_user@example.com", "verificationCode": 123456},
    )

    assert_error_response(response, 400, "User not found")


def test_register_verify_rejects_wrong_code(running_api, http_session, unique_user):
    register_response = http_session.post(f"{running_api}/api/auth/register/init", json=unique_user)
    assert_user_response(register_response, verified=False)

    response = http_session.post(
        f"{running_api}/api/auth/register/verify",
        json={"email": unique_user["email"], "verificationCode": 0},
    )

    assert_error_response(response, 400, "Wrong code")


def test_register_verify_requires_code_field(running_api, http_session, unique_user):
    response = http_session.post(
        f"{running_api}/api/auth/register/verify",
        json={"email": unique_user["email"]},
    )

    body = assert_validation_response(response)
    assert "verificationCode" in body


def test_register_resend_rejects_unknown_user(running_api, http_session):
    response = http_session.post(
        f"{running_api}/api/auth/register/resend",
        json={"email": "missing_user@example.com"},
    )

    assert_error_response(response, 400, "User not found")


def test_register_resend_rejects_immediate_repeat_by_cooldown(running_api, http_session, unique_user):
    register_response = http_session.post(f"{running_api}/api/auth/register/init", json=unique_user)
    assert_user_response(register_response, verified=False)

    response = http_session.post(
        f"{running_api}/api/auth/register/resend",
        json={"email": unique_user["email"]},
    )

    body = assert_error_response(response, 400)
    assert "wait" in body["error"].lower() or "seconds" in body["error"].lower()


def test_login_rejects_unknown_user(running_api, http_session):
    response = http_session.post(
        f"{running_api}/api/auth/login",
        json={"email": "missing_user@example.com", "password": "Password123"},
    )

    assert_error_response(response, 400, "Invalid email or password")


def test_login_rejects_unverified_user(running_api, http_session, unique_user):
    register_response = http_session.post(f"{running_api}/api/auth/register/init", json=unique_user)
    assert_user_response(register_response, verified=False)

    response = http_session.post(
        f"{running_api}/api/auth/login",
        json={"email": unique_user["email"], "password": unique_user["password"]},
    )

    assert_error_response(response, 400, "Email is not verified")


def test_login_requires_email_and_password_fields(running_api, http_session):
    response = http_session.post(f"{running_api}/api/auth/login", json={})

    body = assert_validation_response(response)
    assert "email" in body
    assert "password" in body
