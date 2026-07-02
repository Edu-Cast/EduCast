def test_frontend_root_returns_html(running_frontend, frontend_session):
    response = frontend_session.get(running_frontend)

    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "EduCast" in response.text
    assert '<div id="app"></div>' in response.text


def test_frontend_spa_fallback_serves_client_route(running_frontend, frontend_session):
    response = frontend_session.get(f"{running_frontend}/library")

    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "EduCast" in response.text
