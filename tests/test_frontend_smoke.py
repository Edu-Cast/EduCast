def test_frontend_root_returns_html(frontend_url, frontend_session):
    response = frontend_session.get(frontend_url)

    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
