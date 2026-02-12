from __future__ import annotations

from uuid import uuid4

import pytest

from po_app import create_app
from po_app import db as db_mod
from po_app.routes import api as api_mod
from po_app.routes import main as main_mod


@pytest.fixture()
def app(tmp_path):
    original_path = db_mod._database_manager.db_path
    original_use_postgres = db_mod._database_manager.use_postgres
    original_po_repo_use_postgres = api_mod._po_repository.use_postgres
    original_passkey_repo_use_postgres = api_mod._passkey_repository.use_postgres
    original_auth_flow_use_postgres = api_mod._auth_flow_service._use_postgres
    original_api_auth_disabled = api_mod.AUTH_DISABLED
    original_main_auth_disabled = main_mod.AUTH_DISABLED
    test_db_path = tmp_path / "test_po.db"

    db_mod._database_manager.db_path = test_db_path
    db_mod._database_manager.use_postgres = False
    api_mod._po_repository.use_postgres = False
    api_mod._passkey_repository.use_postgres = False
    api_mod._auth_flow_service._use_postgres = False
    api_mod.AUTH_DISABLED = False
    main_mod.AUTH_DISABLED = False

    app = create_app()
    app.config["TESTING"] = True

    try:
        yield app
    finally:
        db_mod._database_manager.db_path = original_path
        db_mod._database_manager.use_postgres = original_use_postgres
        api_mod._po_repository.use_postgres = original_po_repo_use_postgres
        api_mod._passkey_repository.use_postgres = original_passkey_repo_use_postgres
        api_mod._auth_flow_service._use_postgres = original_auth_flow_use_postgres
        api_mod.AUTH_DISABLED = original_api_auth_disabled
        main_mod.AUTH_DISABLED = original_main_auth_disabled


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def auth_client(client):
    with client.session_transaction() as session:
        session["auth_user"] = "admin"
        session["auth_session_id"] = f"test-{uuid4().hex[:10]}"
        session["can_manage_login_requests"] = False
    return client


def test_auth_status_works_without_login(client):
    response = client.get("/api/auth/status")
    assert response.status_code == 200
    payload = response.get_json()
    assert isinstance(payload, dict)
    assert payload.get("authenticated") is False
    assert "has_passkey" in payload
    assert "login_approval" in payload
    assert "code_login" in payload


def test_protected_routes_require_auth(client):
    response = client.get("/api/po")
    assert response.status_code == 401


def test_po_crud_cycle(auth_client):
    form_no = f"TEST-{uuid4().hex[:8]}"
    create_payload = {
        "fields": {
            "formNo": form_no,
            "date": "02/09/2026",
            "to": "SMOKE",
            "companyName": "SMOKE CO",
        },
        "items": [
            {
                "noModel": "A1",
                "item": "Item",
                "qty": "1",
                "unit": "pcs",
                "planNo": "P1",
            }
        ],
        "signatures": {},
        "reportStyle": {},
    }

    create_res = auth_client.post("/api/po", json=create_payload)
    assert create_res.status_code == 200
    created = create_res.get_json()
    assert isinstance(created, dict)
    po_id = int(created.get("id") or 0)
    assert po_id > 0

    get_res = auth_client.get(f"/api/po/{po_id}")
    assert get_res.status_code == 200
    assert (get_res.get_json() or {}).get("id") == po_id

    update_payload = dict(create_payload)
    update_payload["id"] = po_id
    update_payload["fields"] = dict(create_payload["fields"])
    update_payload["fields"]["companyName"] = "SMOKE UPDATED"
    update_res = auth_client.post("/api/po", json=update_payload)
    assert update_res.status_code == 200

    delete_res = auth_client.delete(f"/api/po/{po_id}")
    assert delete_res.status_code == 200
    trashed_id = int((delete_res.get_json() or {}).get("trashed_id") or 0)
    assert trashed_id > 0

    restore_res = auth_client.post(f"/api/po/trash/{trashed_id}/restore")
    assert restore_res.status_code == 200
    restored_id = int((restore_res.get_json() or {}).get("id") or 0)
    assert restored_id > 0

    delete_again_res = auth_client.delete(f"/api/po/{restored_id}")
    assert delete_again_res.status_code == 200
    trashed_id_2 = int((delete_again_res.get_json() or {}).get("trashed_id") or 0)
    assert trashed_id_2 > 0

    purge_res = auth_client.delete(f"/api/po/trash/{trashed_id_2}")
    assert purge_res.status_code == 200


def test_login_request_list_for_non_approval_session_is_forbidden(auth_client):
    response = auth_client.get("/api/auth/login/requests")
    assert response.status_code == 403


def test_admin_tools_status_endpoints(auth_client):
    backups_res = auth_client.get("/api/admin/backups")
    assert backups_res.status_code == 200
    backups_payload = backups_res.get_json() or {}
    assert "backups" in backups_payload
    assert "auto_backup" in backups_payload

    updates_res = auth_client.get("/api/admin/updates/check")
    assert updates_res.status_code in {200, 500}


def test_access_code_login_success(client, monkeypatch):
    api_mod._access_login_attempts.clear()
    monkeypatch.setattr(api_mod, "_current_access_login_code", lambda: "dev-access-123")

    response = client.post("/api/auth/login/code", json={"access_code": "dev-access-123"})
    assert response.status_code == 200
    payload = response.get_json() or {}
    assert payload.get("ok") is True
    assert payload.get("user") == "admin"
    assert payload.get("can_approve_requests") is False

    protected = client.get("/api/po")
    assert protected.status_code == 200


def test_access_code_login_invalid_code(client, monkeypatch):
    api_mod._access_login_attempts.clear()
    monkeypatch.setattr(api_mod, "_current_access_login_code", lambda: "dev-access-123")

    response = client.post("/api/auth/login/code", json={"access_code": "wrong-code"})
    assert response.status_code == 403
    payload = response.get_json() or {}
    assert "remaining_attempts" in payload
