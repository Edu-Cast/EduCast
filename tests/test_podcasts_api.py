from conftest import assert_requires_auth


def test_get_all_podcasts_is_public(base_url, http_session):
    response = http_session.get(f"{base_url}/api/podcasts")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_comments_for_missing_podcast_returns_bad_request(base_url, http_session):
    response = http_session.get(f"{base_url}/api/podcasts/999999999/comments")

    assert response.status_code == 400
    assert response.json()["error"] == "Podcast not found"


def test_upload_podcast_requires_authentication(base_url, http_session):
    response = http_session.post(
        f"{base_url}/api/podcasts",
        data={
            "title": "Physics intro",
            "description": "Short audio lesson",
            "subject": "PHYSICS",
            "educationLevel": "SCHOOL",
        },
        files={"file": ("lesson.mp3", b"not-a-real-audio-file", "audio/mpeg")},
    )

    assert_requires_auth(response)


def test_delete_podcast_requires_authentication(base_url, http_session):
    response = http_session.delete(f"{base_url}/api/podcasts/1")

    assert_requires_auth(response)
