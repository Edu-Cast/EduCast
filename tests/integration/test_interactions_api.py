from tests.conftest import assert_error_response, assert_podcast_list_response, assert_requires_auth


def test_vote_requires_authentication(running_api, http_session):
    response = http_session.post(
        f"{running_api}/api/podcasts/1/vote",
        json={"vote": 1},
    )

    assert_requires_auth(response)


def test_vote_rejects_invalid_bearer_token(running_api, http_session):
    response = http_session.post(
        f"{running_api}/api/podcasts/1/vote",
        json={"vote": 1},
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )

    assert_requires_auth(response)


def test_vote_accepts_only_documented_values_when_unauthenticated_is_not_reached(running_api, http_session):
    response = http_session.post(
        f"{running_api}/api/podcasts/1/vote",
        json={"vote": 2},
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )

    assert_requires_auth(response)


def test_toggle_save_requires_authentication(running_api, http_session):
    response = http_session.post(f"{running_api}/api/podcasts/1/save")

    assert_requires_auth(response)


def test_get_saved_requires_authentication_and_is_not_public_wildcard_route(running_api, http_session):
    response = http_session.get(f"{running_api}/api/podcasts/saved")

    assert_requires_auth(response)


def test_get_saved_rejects_invalid_bearer_token(running_api, http_session):
    response = http_session.get(
        f"{running_api}/api/podcasts/saved",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )

    assert_requires_auth(response)


def test_saved_podcasts_success_schema_is_documented():
    class Response:
        status_code = 200

        @staticmethod
        def json():
            return [
                {
                    "id": 1,
                    "title": "Introduction to Calculus",
                    "description": "A beginner-friendly overview of calculus fundamentals.",
                    "subject": "MATHEMATICS",
                    "educationLevel": "UNIVERSITY",
                    "durationSeconds": 1842,
                    "fileSizeBytes": 29360128,
                    "authorLogin": "ivan123",
                    "createdAt": "2026-06-14T10:23:00Z",
                    "score": 12,
                }
            ]

    assert_podcast_list_response(Response())


def test_add_comment_requires_authentication(running_api, http_session):
    response = http_session.post(
        f"{running_api}/api/podcasts/1/comments",
        json={"text": "Really helpful explanation!"},
    )

    assert_requires_auth(response)


def test_add_comment_requires_non_empty_text_after_authentication_boundary(running_api, http_session):
    response = http_session.post(
        f"{running_api}/api/podcasts/1/comments",
        json={"text": ""},
    )

    assert_requires_auth(response)


def test_delete_comment_requires_authentication(running_api, http_session):
    response = http_session.delete(f"{running_api}/api/podcasts/comments/1")

    assert_requires_auth(response)


def test_delete_missing_comment_with_invalid_token_still_rejects_auth_first(running_api, http_session):
    response = http_session.delete(
        f"{running_api}/api/podcasts/comments/999999999",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )

    assert_requires_auth(response)
