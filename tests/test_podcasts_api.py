from conftest import assert_error_response, assert_json_list_response, assert_requires_auth


def test_get_all_podcasts_is_public(base_url, http_session):
    response = http_session.get(f"{base_url}/api/podcasts")

    assert_json_list_response(response)


def test_search_podcasts_without_filters_is_public(base_url, http_session):
    response = http_session.get(f"{base_url}/api/podcasts/search")

    assert_json_list_response(response)


def test_search_podcasts_with_query_filter_is_public(base_url, http_session):
    response = http_session.get(
        f"{base_url}/api/podcasts/search",
        params={"query": "physics"},
    )

    assert_json_list_response(response)


def test_search_podcasts_with_subject_and_level_filters_is_public(base_url, http_session):
    response = http_session.get(
        f"{base_url}/api/podcasts/search",
        params={"subject": "PHYSICS", "educationLevel": "SCHOOL"},
    )

    assert_json_list_response(response)


def test_get_popular_podcasts_is_public(base_url, http_session):
    response = http_session.get(f"{base_url}/api/podcasts/popular")

    assert_json_list_response(response)


def test_get_popular_podcasts_by_subject_is_public(base_url, http_session):
    response = http_session.get(f"{base_url}/api/podcasts/popular/PHYSICS")

    assert_json_list_response(response)


def test_get_missing_podcast_detail_returns_bad_request(base_url, http_session):
    response = http_session.get(f"{base_url}/api/podcasts/999999999")

    assert_error_response(response, 400, "Podcast not found")


def test_get_missing_podcast_audio_returns_bad_request(base_url, http_session):
    response = http_session.get(f"{base_url}/api/podcasts/999999999/audio")

    assert_error_response(response, 400, "Podcast not found")


def test_get_comments_for_missing_podcast_returns_bad_request(base_url, http_session):
    response = http_session.get(f"{base_url}/api/podcasts/999999999/comments")

    assert_error_response(response, 400, "Podcast not found")


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


def test_get_my_podcasts_requires_authentication(base_url, http_session):
    response = http_session.get(f"{base_url}/api/podcasts/my")

    assert_requires_auth(response)
