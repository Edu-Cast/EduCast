from tests.conftest import read_project_file


def test_frontend_api_client_covers_auth_catalog_upload_and_interactions():
    api = read_project_file("frontend/src/api.js")

    for method in [
        "async login(email, password)",
        "async registerInit({ login, email, password })",
        "async registerVerify({ email, verificationCode })",
        "async listPodcasts",
        "async popularPodcasts",
        "async getPodcast(id)",
        "async uploadPodcast(formData)",
        "async votePodcast(id, vote)",
        "async toggleSavePodcast(id)",
        "async savedPodcasts()",
        "async myPodcasts()",
    ]:
        assert method in api

    assert "headers.set('Authorization', `Bearer ${token}`)" in api
    assert "if (response.status === 401)" in api
    assert "clearSession()" in api
    assert "normalizePodcast" in api
    assert "normalizeComment" in api


def test_frontend_store_persists_session_drafts_tracks_and_api_base():
    store = read_project_file("frontend/src/store.js")

    for key in [
        "educast_session_v1",
        "educast_register_draft_v1",
        "educast_local_tracks_v1",
        "educast_api_base_v1",
    ]:
        assert key in store

    for export in [
        "export function saveSession(session)",
        "export function clearSession()",
        "export function setRegistrationDraft(draft)",
        "export function addLocalTrack(track)",
        "export function setApiBase(value)",
    ]:
        assert export in store


def test_frontend_helpers_include_safe_formatting_and_reference_data():
    helpers = read_project_file("frontend/src/helpers.js")

    assert "export const subjects" in helpers
    assert "COMPUTER_SCIENCE" in helpers
    assert "export const educationLevels" in helpers
    assert "export function escapeHtml(value)" in helpers
    assert "export function formatDuration(seconds)" in helpers
    assert "export function formatBytes(bytes)" in helpers
    assert "export function initials(text)" in helpers
    assert "export function byLabel(list, value)" in helpers
