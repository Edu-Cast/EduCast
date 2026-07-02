from tests.conftest import (
    assert_comment_list_response,
    assert_error_response,
    assert_podcast_list_response,
    assert_requires_auth,
)


SUBJECTS = [
    "BIOLOGY",
    "CHEMISTRY",
    "PHYSICS",
    "MATHEMATICS",
    "GEOGRAPHY",
    "HISTORY",
    "LITERATURE",
    "COMPUTER_SCIENCE",
    "ECONOMICS",
    "PHILOSOPHY",
    "PSYCHOLOGY",
    "LAW",
    "BUSINESS",
    "LANGUAGES",
    "ART",
    "MUSIC",
    "PHYSICAL_EDUCATION",
    "SOCIOLOGY",
    "POLITICAL_SCIENCE",
    "OTHER",
]


def test_get_all_podcasts_is_public_and_returns_documented_fields(running_api, http_session):
    response = http_session.get(f"{running_api}/api/podcasts")

    assert_podcast_list_response(response)


def test_search_podcasts_without_filters_is_public_and_returns_documented_fields(running_api, http_session):
    response = http_session.get(f"{running_api}/api/podcasts/search")

    assert_podcast_list_response(response)


def test_search_podcasts_with_query_filter_is_public(running_api, http_session):
    response = http_session.get(
        f"{running_api}/api/podcasts/search",
        params={"query": "physics"},
    )

    assert_podcast_list_response(response)


def test_search_podcasts_with_subject_and_level_filters_is_public(running_api, http_session):
    response = http_session.get(
        f"{running_api}/api/podcasts/search",
        params={"subject": "PHYSICS", "educationLevel": "SCHOOL"},
    )

    assert_podcast_list_response(response)


def test_get_popular_podcasts_is_public_and_returns_documented_fields(running_api, http_session):
    response = http_session.get(f"{running_api}/api/podcasts/popular")

    assert_podcast_list_response(response)


def test_get_popular_podcasts_by_subject_is_public(running_api, http_session):
    response = http_session.get(f"{running_api}/api/podcasts/popular/PHYSICS")

    assert_podcast_list_response(response)


def test_documented_subject_values_are_supported_by_search_endpoint(running_api, http_session):
    for subject in SUBJECTS:
        response = http_session.get(
            f"{running_api}/api/podcasts/search",
            params={"subject": subject},
        )
        assert response.status_code in (200, 400), f"Unexpected status for {subject}: {response.status_code}"
        if response.status_code == 200:
            assert_podcast_list_response(response)


def test_get_missing_podcast_detail_returns_documented_error_format(running_api, http_session):
    response = http_session.get(f"{running_api}/api/podcasts/999999999")

    assert_error_response(response, 400, "Podcast not found")


def test_get_missing_podcast_audio_returns_documented_error_format(running_api, http_session):
    response = http_session.get(f"{running_api}/api/podcasts/999999999/audio")

    assert_error_response(response, 400, "Podcast not found")


def test_get_comments_for_missing_podcast_returns_documented_error_format(running_api, http_session):
    response = http_session.get(f"{running_api}/api/podcasts/999999999/comments")

    assert_error_response(response, 400, "Podcast not found")


def test_get_comments_public_endpoint_returns_documented_comment_fields_when_podcast_exists_or_error(running_api, http_session):
    response = http_session.get(f"{running_api}/api/podcasts/1/comments")

    if response.status_code == 200:
        assert_comment_list_response(response)
    else:
        assert_error_response(response, 400, "Podcast not found")


def test_upload_podcast_requires_authentication_and_multipart_contract(running_api, http_session):
    response = http_session.post(
        f"{running_api}/api/podcasts",
        data={
            "title": "Physics intro",
            "description": "Short audio lesson",
            "subject": "PHYSICS",
            "educationLevel": "SCHOOL",
        },
        files={"file": ("lesson.mp3", b"not-a-real-audio-file", "audio/mpeg")},
    )

    assert_requires_auth(response)


def test_delete_podcast_requires_authentication(running_api, http_session):
    response = http_session.delete(f"{running_api}/api/podcasts/1")

    assert_requires_auth(response)


def test_get_my_podcasts_requires_authentication(running_api, http_session):
    response = http_session.get(f"{running_api}/api/podcasts/my")

    assert_requires_auth(response)
