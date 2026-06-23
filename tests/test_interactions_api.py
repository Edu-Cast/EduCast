from conftest import assert_requires_auth


def test_vote_requires_authentication(base_url, http_session):
    response = http_session.post(
        f"{base_url}/api/podcasts/1/vote",
        json={"vote": 1},
    )

    assert_requires_auth(response)


def test_vote_rejects_invalid_bearer_token(base_url, http_session):
    response = http_session.post(
        f"{base_url}/api/podcasts/1/vote",
        json={"vote": 2},
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )

    assert_requires_auth(response)


def test_save_requires_authentication(base_url, http_session):
    response = http_session.post(f"{base_url}/api/podcasts/1/save")

    assert_requires_auth(response)


def test_get_saved_requires_authentication(base_url, http_session):
    response = http_session.get(f"{base_url}/api/podcasts/saved")

    assert_requires_auth(response)


def test_get_saved_rejects_invalid_bearer_token(base_url, http_session):
    response = http_session.get(
        f"{base_url}/api/podcasts/saved",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )

    assert_requires_auth(response)


def test_add_comment_requires_authentication(base_url, http_session):
    response = http_session.post(
        f"{base_url}/api/podcasts/1/comments",
        json={"text": "Nice lesson"},
    )

    assert_requires_auth(response)


def test_delete_comment_requires_authentication(base_url, http_session):
    response = http_session.delete(f"{base_url}/api/podcasts/comments/1")

    assert_requires_auth(response)
