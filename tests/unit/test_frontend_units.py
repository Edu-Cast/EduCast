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
    assert "setApiBase" not in api
    assert "apiBase" in api


def test_frontend_store_persists_session_drafts_and_api_base():
    store = read_project_file("frontend/src/store.js")

    for key in [
        "educast_session_v1",
        "educast_register_draft_v1",
        "educast_api_base_v1",
    ]:
        assert key in store

    for export in [
        "export function saveSession(session)",
        "export function clearSession()",
        "export function setRegistrationDraft(draft)",
        "export function setApiBase(value)",
    ]:
        assert export in store

    for removed_local_state in [
        "educast_local_tracks_v1",
        "educast_saved_ids_v2",
        "educast_subscriptions_v1",
        "export function addLocalTrack(track)",
        "export function toggleSavedId(id)",
        "export function toggleSubscription(author)",
    ]:
        assert removed_local_state not in store


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


def test_upload_flow_preserves_selected_file_across_rerender():
    main = read_project_file("frontend/src/main.js")

    assert "let selectedUploadFile = null" in main
    assert "selectedUploadFile = file || null" in main
    assert "fd.append('file', file)" in main
    assert "selectedUploadFile = null" in main


def test_settings_modal_has_user_settings_without_api_base_control():
    main = read_project_file("frontend/src/main.js")
    api = read_project_file("frontend/src/api.js")
    store = read_project_file("frontend/src/store.js")

    assert "Session status" in main
    assert "Saved lectures" in main
    assert "Your lectures" in main
    assert "apiBase" not in main
    assert "apiBase" in api
    assert "apiBase" not in store
    assert "setApiBase" not in api
    assert "setApiBase" not in store
