from __future__ import annotations

import json
import os
import hmac
import time
from datetime import datetime, timezone
from functools import wraps

from io import BytesIO

from flask import Blueprint, jsonify, request, send_file, session

from ..config import (
    AUTH_DISABLED,
    AUTO_BACKUP_ENABLED,
    AUTO_BACKUP_INTERVAL_HOURS,
    AUTO_BACKUP_RETENTION_DAYS,
    BASE_DIR,
    FIRST_ADMIN_SETUP_CODE,
    PASSKEY_RP_ID,
    PASSKEY_RP_NAME,
    USE_POSTGRES,
)
from ..db import get_db, iso
from ..services.auth_flow import AuthFlowService, PasskeyRepository
from ..services.pdf import build_pdf
from ..services.maintenance import (
    BackupService,
    BackupValidationError,
    MaintenanceError,
    MaintenanceScriptRunner,
    PackageUpdateService,
)
from ..services.po_repository import POFormNoConflictError, PONotFoundError, PORepository

bp = Blueprint("api", __name__)
BACKUP_DIR = BASE_DIR / "backups"
SCRIPT_DIR = BASE_DIR / "scripts"
FIRST_ADMIN_MAX_ATTEMPTS = 3
FIRST_ADMIN_LOCK_SECONDS_STEPS = (10, 30, 60, 120, 300)
_first_admin_setup_attempts: dict[str, dict[str, float | int]] = {}
ACCESS_LOGIN_MAX_ATTEMPTS = 5
ACCESS_LOGIN_LOCK_SECONDS_STEPS = (10, 30, 60, 120, 300)
_access_login_attempts: dict[str, dict[str, float | int]] = {}
LOGIN_APPROVAL_TTL_SECONDS = 120
LOGIN_APPROVAL_DECISION_TTL_SECONDS = 180
ACTIVE_AUTH_SESSION_TTL_SECONDS = 300
APPROVER_ONLINE_WINDOW_SECONDS = 12
_po_repository = PORepository(use_postgres=USE_POSTGRES)
_passkey_repository = PasskeyRepository(use_postgres=USE_POSTGRES)
_auth_flow_service = AuthFlowService(
    passkey_repository=_passkey_repository,
    use_postgres=USE_POSTGRES,
    login_approval_ttl_seconds=LOGIN_APPROVAL_TTL_SECONDS,
    login_approval_decision_ttl_seconds=LOGIN_APPROVAL_DECISION_TTL_SECONDS,
    active_auth_session_ttl_seconds=ACTIVE_AUTH_SESSION_TTL_SECONDS,
    approver_online_window_seconds=APPROVER_ONLINE_WINDOW_SECONDS,
)
_maintenance_runner = MaintenanceScriptRunner(base_dir=BASE_DIR, script_dir=SCRIPT_DIR)
_backup_service = BackupService(
    backup_dir=BACKUP_DIR,
    runner=_maintenance_runner,
    auto_backup_enabled=AUTO_BACKUP_ENABLED,
    auto_backup_interval_hours=AUTO_BACKUP_INTERVAL_HOURS,
    auto_backup_retention_days=AUTO_BACKUP_RETENTION_DAYS,
)
_update_service = PackageUpdateService(runner=_maintenance_runner)


def _current_first_admin_setup_code() -> str:
    env_path = BASE_DIR / ".env"
    if env_path.exists():
        try:
            from dotenv import dotenv_values

            env_values = dotenv_values(env_path)
            value = str(env_values.get("FIRST_ADMIN_SETUP_CODE") or "").strip()
            if value:
                return value
        except Exception:
            pass
    return FIRST_ADMIN_SETUP_CODE


def _client_rate_limit_key() -> str:
    forwarded_for = (request.headers.get("X-Forwarded-For") or "").strip()
    if forwarded_for:
        first_ip = forwarded_for.split(",")[0].strip()
        if first_ip:
            return first_ip
    return (request.remote_addr or "unknown").strip() or "unknown"


def _first_admin_setup_locked_seconds() -> int:
    key = _client_rate_limit_key()
    entry = _first_admin_setup_attempts.get(key)
    if not entry:
        return 0
    locked_until = float(entry.get("locked_until") or 0)
    now = time.time()
    if locked_until <= now:
        entry["locked_until"] = 0.0
        _first_admin_setup_attempts[key] = entry
        return 0
    return max(1, int(locked_until - now))


def _record_first_admin_setup_failure() -> dict[str, int | bool]:
    key = _client_rate_limit_key()
    now = time.time()
    entry = _first_admin_setup_attempts.get(key) or {
        "fails": 0,
        "locked_until": 0.0,
        "lock_level": 0,
    }
    locked_until = float(entry.get("locked_until") or 0)
    if locked_until <= now:
        entry["locked_until"] = 0.0
    entry["fails"] = int(entry.get("fails") or 0) + 1

    if entry["fails"] >= FIRST_ADMIN_MAX_ATTEMPTS:
        lock_level = int(entry.get("lock_level") or 0)
        step_index = min(lock_level, len(FIRST_ADMIN_LOCK_SECONDS_STEPS) - 1)
        retry_after = int(FIRST_ADMIN_LOCK_SECONDS_STEPS[step_index])
        entry["fails"] = 0
        entry["lock_level"] = lock_level + 1
        entry["locked_until"] = now + retry_after
        _first_admin_setup_attempts[key] = entry
        return {
            "locked": True,
            "retry_after": retry_after,
            "remaining": 0,
        }

    remaining = max(0, FIRST_ADMIN_MAX_ATTEMPTS - int(entry["fails"]))
    _first_admin_setup_attempts[key] = entry
    return {"locked": False, "retry_after": 0, "remaining": remaining}


def _clear_first_admin_setup_failures():
    key = _client_rate_limit_key()
    _first_admin_setup_attempts.pop(key, None)


def _current_access_login_code() -> str:
    env_path = BASE_DIR / ".env"
    if env_path.exists():
        try:
            from dotenv import dotenv_values

            env_values = dotenv_values(env_path)
            for key in ("ACCESS_LOGIN_CODE", "AUTH_LOGIN_CODE"):
                value = str(env_values.get(key) or "").strip()
                if value:
                    return value
        except Exception:
            pass
    for key in ("ACCESS_LOGIN_CODE", "AUTH_LOGIN_CODE"):
        value = str(os.getenv(key) or "").strip()
        if value:
            return value
    return _current_first_admin_setup_code()


def _access_login_locked_seconds() -> int:
    key = _client_rate_limit_key()
    entry = _access_login_attempts.get(key)
    if not entry:
        return 0
    locked_until = float(entry.get("locked_until") or 0)
    now = time.time()
    if locked_until <= now:
        entry["locked_until"] = 0.0
        _access_login_attempts[key] = entry
        return 0
    return max(1, int(locked_until - now))


def _record_access_login_failure() -> dict[str, int | bool]:
    key = _client_rate_limit_key()
    now = time.time()
    entry = _access_login_attempts.get(key) or {
        "fails": 0,
        "locked_until": 0.0,
        "lock_level": 0,
    }
    locked_until = float(entry.get("locked_until") or 0)
    if locked_until <= now:
        entry["locked_until"] = 0.0
    entry["fails"] = int(entry.get("fails") or 0) + 1

    if entry["fails"] >= ACCESS_LOGIN_MAX_ATTEMPTS:
        lock_level = int(entry.get("lock_level") or 0)
        step_index = min(lock_level, len(ACCESS_LOGIN_LOCK_SECONDS_STEPS) - 1)
        retry_after = int(ACCESS_LOGIN_LOCK_SECONDS_STEPS[step_index])
        entry["fails"] = 0
        entry["lock_level"] = lock_level + 1
        entry["locked_until"] = now + retry_after
        _access_login_attempts[key] = entry
        return {
            "locked": True,
            "retry_after": retry_after,
            "remaining": 0,
        }

    remaining = max(0, ACCESS_LOGIN_MAX_ATTEMPTS - int(entry["fails"]))
    _access_login_attempts[key] = entry
    return {"locked": False, "retry_after": 0, "remaining": remaining}


def _clear_access_login_failures():
    key = _client_rate_limit_key()
    _access_login_attempts.pop(key, None)


def _ensure_auth_session_id() -> str:
    return _auth_flow_service.ensure_auth_session_id(session)


def _db_row_to_dict(row):
    return _auth_flow_service.row_to_dict(row)


def _to_datetime(value):
    return _auth_flow_service.to_datetime(value)


def _to_bool(value) -> bool:
    return _auth_flow_service.to_bool(value)


def _passkey_row_is_approval_device(row) -> bool:
    return _passkey_repository.is_approval_device(row)


def _session_credential_is_approval_device() -> bool:
    return _auth_flow_service.session_credential_is_approval_device(session)


def _current_session_can_manage_login_requests() -> bool:
    return _auth_flow_service.current_session_can_manage_login_requests(session)


def _set_session_login_approval_capability(can_manage: bool):
    _auth_flow_service.set_session_login_approval_capability(session, can_manage)


def _seconds_until(value) -> int:
    return _auth_flow_service.seconds_until(value)


def _cleanup_auth_flow_state(now_ts: float | None = None):
    _auth_flow_service.cleanup_auth_flow_state(now_ts=now_ts)


def _touch_active_auth_session(
    user: str | None,
    *,
    can_manage_login_requests: bool | None = None,
):
    _auth_flow_service.touch_active_auth_session(
        session,
        user,
        can_manage_login_requests=can_manage_login_requests,
    )


def _drop_active_auth_session():
    _auth_flow_service.drop_active_auth_session(session)


def _has_other_active_authenticated_session() -> bool:
    return _auth_flow_service.has_other_active_authenticated_session(session)


def _has_other_online_approver_session(
    online_window_seconds: int = APPROVER_ONLINE_WINDOW_SECONDS,
) -> bool:
    return _auth_flow_service.has_other_online_approver_session(
        session,
        online_window_seconds=online_window_seconds,
    )


def _create_login_approval_request(username: str, credential_id: str) -> dict[str, object]:
    return _auth_flow_service.create_login_approval_request(
        session,
        username=username,
        credential_id=credential_id,
        requester_ip=_client_rate_limit_key(),
        requester_ua=str(request.headers.get("User-Agent") or "").strip()[:220],
    )


def _cancel_pending_login_requests_for_credential(
    credential_id: str,
    *,
    reason: str = "",
) -> int:
    return _auth_flow_service.cancel_pending_login_requests_for_credential(
        credential_id,
        reason=reason,
    )


def _set_login_approval_decision(
    request_id: str,
    *,
    approved: bool,
    decision_by: str,
    reason: str = "",
) -> tuple[dict[str, object] | None, str | None]:
    return _auth_flow_service.set_login_approval_decision(
        request_id,
        approved=approved,
        decision_by=decision_by,
        reason=reason,
    )


def _get_login_approval_request(request_id: str):
    return _auth_flow_service.get_login_approval_request(request_id)


def _expected_rp_id() -> str:
    if PASSKEY_RP_ID:
        return PASSKEY_RP_ID
    host = request.host.split(":")[0].strip().lower()
    if host in {"127.0.0.1", "::1", "[::1]"}:
        return "localhost"
    return host


def _expected_origin() -> str:
    return f"{request.scheme}://{request.host}"


def _load_webauthn():
    try:
        from webauthn import (
            generate_authentication_options,
            generate_registration_options,
            options_to_json,
            verify_authentication_response,
            verify_registration_response,
        )
        from webauthn.helpers import base64url_to_bytes, bytes_to_base64url
        from webauthn.helpers.structs import (
            AuthenticatorSelectionCriteria,
            AuthenticatorAttachment,
            PublicKeyCredentialDescriptor,
            PublicKeyCredentialHint,
            ResidentKeyRequirement,
            UserVerificationRequirement,
        )
    except Exception as exc:
        raise RuntimeError(
            "webauthn package is missing. Run: pip install webauthn"
        ) from exc
    return {
        "generate_authentication_options": generate_authentication_options,
        "generate_registration_options": generate_registration_options,
        "options_to_json": options_to_json,
        "verify_authentication_response": verify_authentication_response,
        "verify_registration_response": verify_registration_response,
        "base64url_to_bytes": base64url_to_bytes,
        "bytes_to_base64url": bytes_to_base64url,
        "AuthenticatorSelectionCriteria": AuthenticatorSelectionCriteria,
        "AuthenticatorAttachment": AuthenticatorAttachment,
        "PublicKeyCredentialHint": PublicKeyCredentialHint,
        "ResidentKeyRequirement": ResidentKeyRequirement,
        "PublicKeyCredentialDescriptor": PublicKeyCredentialDescriptor,
        "UserVerificationRequirement": UserVerificationRequirement,
    }


def _passkey_count() -> int:
    return _passkey_repository.count()


def _list_passkeys(username: str | None = None):
    return _passkey_repository.list(username=username)


def _get_passkey_by_credential(credential_id: str):
    return _passkey_repository.get_by_credential(credential_id)


def _upsert_passkey(
    username: str,
    user_handle: str,
    credential_id: str,
    public_key: str,
    sign_count: int,
) -> bool:
    return _passkey_repository.upsert(
        username=username,
        user_handle=user_handle,
        credential_id=credential_id,
        public_key=public_key,
        sign_count=sign_count,
    )


def _update_sign_count(credential_id: str, sign_count: int):
    _passkey_repository.update_sign_count(credential_id, sign_count)


def require_auth(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        if AUTH_DISABLED:
            return fn(*args, **kwargs)
        auth_user = session.get("auth_user")
        if not auth_user:
            return jsonify({"error": "Unauthorized"}), 401
        _touch_active_auth_session(str(auth_user))
        return fn(*args, **kwargs)

    return wrapped


@bp.get("/auth/status")
def auth_status():
    if AUTH_DISABLED:
        return jsonify(
            {
                "authenticated": True,
                "user": "admin",
                "has_passkey": _passkey_count() > 0,
                "first_admin_setup_ready": bool(_current_first_admin_setup_code()),
                "login_approval": {
                    "required": False,
                    "can_approve_requests": False,
                    "pending_state": "none",
                    "pending_expires_in": 0,
                },
                "code_login": {
                    "enabled": False,
                },
                "maintenance": {
                    "auto_backup_enabled": AUTO_BACKUP_ENABLED,
                    "auto_backup_interval_hours": AUTO_BACKUP_INTERVAL_HOURS,
                    "auto_backup_retention_days": AUTO_BACKUP_RETENTION_DAYS,
                },
            }
        )

    has_passkey = _passkey_count() > 0
    first_admin_setup_ready = bool(_current_first_admin_setup_code())
    code_login_enabled = bool(_current_access_login_code())
    auth_user = session.get("auth_user", "")
    if auth_user:
        _touch_active_auth_session(str(auth_user))

    pending_request_id = str(session.get("pending_login_request_id") or "").strip()
    _cleanup_auth_flow_state()
    pending_state = "none"
    pending_expires_in = 0
    if pending_request_id and not auth_user:
        entry = _get_login_approval_request(pending_request_id)
        if entry:
            pending_state = str(entry.get("status") or "pending")
            if pending_state == "pending":
                pending_expires_in = _seconds_until(entry.get("expires_at"))
        else:
            pending_state = "expired"
    can_approve_requests = bool(auth_user) and _current_session_can_manage_login_requests()

    return jsonify(
        {
            "authenticated": bool(auth_user),
            "user": auth_user,
            "has_passkey": has_passkey,
            "first_admin_setup_ready": first_admin_setup_ready,
            "login_approval": {
                "required": True,
                "can_approve_requests": can_approve_requests,
                "pending_state": pending_state,
                "pending_expires_in": pending_expires_in,
            },
            "code_login": {
                "enabled": code_login_enabled,
            },
            "maintenance": {
                "auto_backup_enabled": AUTO_BACKUP_ENABLED,
                "auto_backup_interval_hours": AUTO_BACKUP_INTERVAL_HOURS,
                "auto_backup_retention_days": AUTO_BACKUP_RETENTION_DAYS,
            },
        }
    )


@bp.post("/auth/logout")
def auth_logout():
    pending_request_id = str(session.get("pending_login_request_id") or "").strip()
    if pending_request_id:
        _set_login_approval_decision(
            pending_request_id,
            approved=False,
            decision_by="system",
            reason="Login request canceled.",
        )
    _drop_active_auth_session()
    session.pop("auth_user", None)
    session.pop("auth_at", None)
    session.pop("webauthn_reg_challenge", None)
    session.pop("webauthn_reg_username", None)
    session.pop("webauthn_reg_user_handle", None)
    session.pop("webauthn_auth_challenge", None)
    session.pop("pending_login_request_id", None)
    session.pop("auth_credential_id", None)
    session.pop("can_manage_login_requests", None)
    return jsonify({"ok": True})


@bp.post("/auth/register/options")
def auth_register_options():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "admin").strip()
    setup_code = (data.get("setup_code") or "").strip()
    setup_code_expected = _current_first_admin_setup_code()
    if not username:
        return jsonify({"error": "Username is required"}), 400

    passkey_count = _passkey_count()
    if passkey_count == 0 and not session.get("auth_user"):
        if not setup_code_expected:
            return (
                jsonify(
                    {
                        "error": "First-admin setup is unavailable. Contact the administrator."
                    }
                ),
                503,
            )
        locked_seconds = _first_admin_setup_locked_seconds()
        if locked_seconds > 0:
            return (
                jsonify(
                    {
                        "locked": True,
                        "retry_after": locked_seconds,
                        "error": (
                            "Too many incorrect setup code attempts. "
                            f"Try again in {locked_seconds}s."
                        )
                    }
                ),
                429,
            )
        if not hmac.compare_digest(setup_code, setup_code_expected):
            failure = _record_first_admin_setup_failure()
            if bool(failure.get("locked")):
                retry_after = int(
                    failure.get("retry_after") or FIRST_ADMIN_LOCK_SECONDS_STEPS[0]
                )
                return (
                    jsonify(
                        {
                            "locked": True,
                            "retry_after": retry_after,
                            "error": (
                                "Too many incorrect setup code attempts. "
                                f"Try again in {retry_after}s."
                            )
                        }
                    ),
                    429,
                )
            remaining = int(failure.get("remaining") or 0)
            return (
                jsonify(
                    {
                        "locked": False,
                        "remaining_attempts": remaining,
                        "error": f"Invalid setup code. {remaining} attempt(s) left.",
                    }
                ),
                403,
            )
        _clear_first_admin_setup_failures()
    elif passkey_count > 0 and not session.get("auth_user"):
        return jsonify({"error": "Unauthorized"}), 401

    try:
        webauthn = _load_webauthn()
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    generate_registration_options = webauthn["generate_registration_options"]
    options_to_json = webauthn["options_to_json"]
    bytes_to_base64url = webauthn["bytes_to_base64url"]
    base64url_to_bytes = webauthn["base64url_to_bytes"]
    PublicKeyCredentialDescriptor = webauthn["PublicKeyCredentialDescriptor"]
    AuthenticatorSelectionCriteria = webauthn["AuthenticatorSelectionCriteria"]
    AuthenticatorAttachment = webauthn["AuthenticatorAttachment"]
    PublicKeyCredentialHint = webauthn["PublicKeyCredentialHint"]
    ResidentKeyRequirement = webauthn["ResidentKeyRequirement"]
    UserVerificationRequirement = webauthn["UserVerificationRequirement"]

    user_handle_bytes = os.urandom(16)
    existing = _list_passkeys(username=username)
    exclude_credentials = [
        PublicKeyCredentialDescriptor(id=base64url_to_bytes(row["credential_id"]))
        for row in existing
    ]
    options = generate_registration_options(
        rp_id=_expected_rp_id(),
        rp_name=PASSKEY_RP_NAME,
        user_id=user_handle_bytes,
        user_name=username,
        user_display_name=username,
        exclude_credentials=exclude_credentials,
        hints=[PublicKeyCredentialHint.CLIENT_DEVICE],
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM,
            user_verification=UserVerificationRequirement.REQUIRED,
            resident_key=ResidentKeyRequirement.PREFERRED,
        ),
    )

    session["webauthn_reg_challenge"] = bytes_to_base64url(options.challenge)
    session["webauthn_reg_username"] = username
    session["webauthn_reg_user_handle"] = bytes_to_base64url(user_handle_bytes)

    return jsonify(json.loads(options_to_json(options)))


@bp.post("/auth/register/verify")
def auth_register_verify():
    challenge_b64 = session.get("webauthn_reg_challenge")
    username = session.get("webauthn_reg_username")
    user_handle = session.get("webauthn_reg_user_handle")
    if not challenge_b64 or not username or not user_handle:
        return jsonify({"error": "Registration session expired"}), 400

    data = request.get_json(silent=True) or {}
    try:
        webauthn = _load_webauthn()
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    verify_registration_response = webauthn["verify_registration_response"]
    base64url_to_bytes = webauthn["base64url_to_bytes"]
    bytes_to_base64url = webauthn["bytes_to_base64url"]

    try:
        verification = verify_registration_response(
            credential=data,
            expected_challenge=base64url_to_bytes(challenge_b64),
            expected_rp_id=_expected_rp_id(),
            expected_origin=_expected_origin(),
            require_user_verification=True,
        )
        credential_id = bytes_to_base64url(verification.credential_id)
        public_key = bytes_to_base64url(verification.credential_public_key)
        sign_count = int(verification.sign_count)
        is_approval_device = _upsert_passkey(
            username=username,
            user_handle=user_handle,
            credential_id=credential_id,
            public_key=public_key,
            sign_count=sign_count,
        )
    except Exception as exc:
        return jsonify({"error": f"Registration verification failed: {exc}"}), 400
    finally:
        session.pop("webauthn_reg_challenge", None)
        session.pop("webauthn_reg_username", None)
        session.pop("webauthn_reg_user_handle", None)

    session.pop("pending_login_request_id", None)
    session.permanent = True
    session["auth_user"] = username
    session["auth_credential_id"] = credential_id
    _set_session_login_approval_capability(bool(is_approval_device))
    session["auth_at"] = iso(datetime.now(timezone.utc))
    _touch_active_auth_session(username)
    effective_can_manage = _current_session_can_manage_login_requests()
    return jsonify(
        {
            "ok": True,
            "user": username,
            "can_approve_requests": bool(effective_can_manage),
        }
    )


@bp.post("/auth/login/options")
def auth_login_options():
    if _passkey_count() == 0:
        return jsonify({"error": "No passkey is registered yet"}), 400

    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip() or None

    try:
        webauthn = _load_webauthn()
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    generate_authentication_options = webauthn["generate_authentication_options"]
    options_to_json = webauthn["options_to_json"]
    base64url_to_bytes = webauthn["base64url_to_bytes"]
    bytes_to_base64url = webauthn["bytes_to_base64url"]
    PublicKeyCredentialDescriptor = webauthn["PublicKeyCredentialDescriptor"]
    UserVerificationRequirement = webauthn["UserVerificationRequirement"]

    creds = _list_passkeys(username=username)
    allow_credentials = [
        PublicKeyCredentialDescriptor(id=base64url_to_bytes(row["credential_id"]))
        for row in creds
    ]
    options = generate_authentication_options(
        rp_id=_expected_rp_id(),
        allow_credentials=allow_credentials,
        user_verification=UserVerificationRequirement.REQUIRED,
    )
    session["webauthn_auth_challenge"] = bytes_to_base64url(options.challenge)
    return jsonify(json.loads(options_to_json(options)))


@bp.post("/auth/login/verify")
def auth_login_verify():
    challenge_b64 = session.get("webauthn_auth_challenge")
    if not challenge_b64:
        return jsonify({"error": "Authentication session expired"}), 400

    data = request.get_json(silent=True) or {}
    credential_id = (data.get("id") or "").strip()
    if not credential_id:
        return jsonify({"error": "Credential id is missing"}), 400

    row = _get_passkey_by_credential(credential_id)
    if not row:
        return jsonify({"error": "Unknown credential"}), 400

    try:
        webauthn = _load_webauthn()
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    verify_authentication_response = webauthn["verify_authentication_response"]
    base64url_to_bytes = webauthn["base64url_to_bytes"]

    try:
        verification = verify_authentication_response(
            credential=data,
            expected_challenge=base64url_to_bytes(challenge_b64),
            expected_rp_id=_expected_rp_id(),
            expected_origin=_expected_origin(),
            credential_public_key=base64url_to_bytes(row["public_key"]),
            credential_current_sign_count=int(row["sign_count"] or 0),
            require_user_verification=True,
        )
        _update_sign_count(credential_id, int(verification.new_sign_count))
    except Exception as exc:
        return jsonify({"error": f"Login verification failed: {exc}"}), 400
    finally:
        session.pop("webauthn_auth_challenge", None)

    username = str(row["username"] or "admin")
    can_approve_requests = _passkey_row_is_approval_device(row)
    if can_approve_requests:
        _cancel_pending_login_requests_for_credential(
            credential_id,
            reason="Superseded by trusted approver sign-in.",
        )
    if _has_other_online_approver_session():
        _set_session_login_approval_capability(False)
        request_entry = _create_login_approval_request(username, credential_id)
        return jsonify(
            {
                "ok": True,
                "pending_approval": True,
                "request_id": request_entry["id"],
                "expires_in": LOGIN_APPROVAL_TTL_SECONDS,
                "message": "Login request sent for admin approval.",
            }
        )

    session.pop("pending_login_request_id", None)
    session.permanent = True
    session["auth_user"] = username
    session["auth_credential_id"] = credential_id
    _set_session_login_approval_capability(bool(can_approve_requests))
    session["auth_at"] = iso(datetime.now(timezone.utc))
    _touch_active_auth_session(username)
    effective_can_manage = _current_session_can_manage_login_requests()
    return jsonify(
        {
            "ok": True,
            "user": username,
            "can_approve_requests": bool(effective_can_manage),
        }
    )


@bp.post("/auth/login/code")
def auth_login_code():
    expected_code = _current_access_login_code()
    if not expected_code:
        return jsonify({"error": "Access-code login is disabled on this server."}), 503

    locked_seconds = _access_login_locked_seconds()
    if locked_seconds > 0:
        return (
            jsonify(
                {
                    "locked": True,
                    "retry_after": locked_seconds,
                    "error": (
                        "Too many incorrect access-code attempts. "
                        f"Try again in {locked_seconds}s."
                    ),
                }
            ),
            429,
        )

    data = request.get_json(silent=True) or {}
    access_code = str(data.get("access_code") or "").strip()
    username = str(data.get("username") or "admin").strip() or "admin"
    if not access_code or not hmac.compare_digest(access_code, expected_code):
        failure = _record_access_login_failure()
        if bool(failure.get("locked")):
            retry_after = int(
                failure.get("retry_after") or ACCESS_LOGIN_LOCK_SECONDS_STEPS[0]
            )
            return (
                jsonify(
                    {
                        "locked": True,
                        "retry_after": retry_after,
                        "error": (
                            "Too many incorrect access-code attempts. "
                            f"Try again in {retry_after}s."
                        ),
                    }
                ),
                429,
            )
        remaining = int(failure.get("remaining") or 0)
        return (
            jsonify(
                {
                    "locked": False,
                    "remaining_attempts": remaining,
                    "error": f"Invalid access code. {remaining} attempt(s) left.",
                }
            ),
            403,
        )

    _clear_access_login_failures()
    _cleanup_auth_flow_state()
    session.pop("pending_login_request_id", None)
    session.pop("webauthn_reg_challenge", None)
    session.pop("webauthn_reg_username", None)
    session.pop("webauthn_reg_user_handle", None)
    session.pop("webauthn_auth_challenge", None)
    session.pop("auth_credential_id", None)
    session.permanent = True
    session["auth_user"] = username
    _set_session_login_approval_capability(False)
    session["auth_at"] = iso(datetime.now(timezone.utc))
    _touch_active_auth_session(username, can_manage_login_requests=False)
    return jsonify(
        {
            "ok": True,
            "user": username,
            "can_approve_requests": False,
            "auth_method": "access_code",
        }
    )


@bp.get("/auth/login/pending")
def auth_login_pending():
    auth_user = str(session.get("auth_user") or "").strip()
    if auth_user:
        _touch_active_auth_session(auth_user)
        can_approve_requests = _current_session_can_manage_login_requests()
        return jsonify(
            {
                "status": "approved",
                "authenticated": True,
                "user": auth_user,
                "can_approve_requests": can_approve_requests,
            }
        )

    request_id = str(session.get("pending_login_request_id") or "").strip()
    if not request_id:
        return jsonify({"status": "none", "authenticated": False})

    _cleanup_auth_flow_state()
    entry = _get_login_approval_request(request_id)
    if not entry:
        session.pop("pending_login_request_id", None)
        return jsonify(
            {
                "status": "rejected",
                "authenticated": False,
                "error": "Login request expired or not found.",
            }
        )

    status = str(entry.get("status") or "pending")
    username = str(entry.get("username") or "admin")
    reason = str(entry.get("reason") or "Login request was rejected.")
    if status == "pending" and _seconds_until(entry.get("expires_at")) <= 0:
        _set_login_approval_decision(
            request_id,
            approved=False,
            decision_by="system",
            reason="Login approval timed out.",
        )
        entry = _get_login_approval_request(request_id) or {}
        status = str(entry.get("status") or "rejected")
        reason = str(entry.get("reason") or "Login approval timed out.")

    if status == "approved":
        approved_credential_id = str(entry.get("credential_id") or "").strip()
        approved_can_manage = False
        if approved_credential_id:
            approved_row = _get_passkey_by_credential(approved_credential_id)
            approved_can_manage = _passkey_row_is_approval_device(approved_row)
            if approved_row:
                session["auth_credential_id"] = approved_credential_id
            else:
                session.pop("auth_credential_id", None)
        else:
            session.pop("auth_credential_id", None)
        session.permanent = True
        session["auth_user"] = username
        _set_session_login_approval_capability(bool(approved_can_manage))
        session["auth_at"] = iso(datetime.now(timezone.utc))
        session.pop("pending_login_request_id", None)
        _touch_active_auth_session(username)
        effective_can_manage = _current_session_can_manage_login_requests()
        return jsonify(
            {
                "status": "approved",
                "authenticated": True,
                "user": username,
                "can_approve_requests": bool(effective_can_manage),
            }
        )

    if status == "rejected":
        session.pop("pending_login_request_id", None)
        return jsonify(
            {
                "status": "rejected",
                "authenticated": False,
                "error": reason or "Login request was rejected.",
            }
        )

    return jsonify(
        {
            "status": "pending",
            "authenticated": False,
            "request_id": request_id,
            "expires_in": _seconds_until(entry.get("expires_at")),
        }
    )


@bp.get("/auth/login/requests")
@require_auth
def list_login_approval_requests():
    if not _current_session_can_manage_login_requests():
        return (
            jsonify(
                {
                    "error": (
                        "This passkey/device is not allowed to approve or reject sign-in requests."
                    )
                }
            ),
            403,
        )
    rows = _auth_flow_service.list_pending_login_approval_requests()
    return jsonify({"requests": rows})


@bp.post("/auth/login/requests/<request_id>/approve")
@require_auth
def approve_login_approval_request(request_id: str):
    if not _current_session_can_manage_login_requests():
        return (
            jsonify(
                {
                    "error": (
                        "This passkey/device is not allowed to approve or reject sign-in requests."
                    )
                }
            ),
            403,
        )
    request_id = str(request_id or "").strip()
    if not request_id:
        return jsonify({"error": "Request id is required"}), 400
    auth_user = str(session.get("auth_user") or "admin")
    entry, err = _set_login_approval_decision(
        request_id,
        approved=True,
        decision_by=auth_user,
    )
    if err == "not_found":
        return jsonify({"error": "Login request not found"}), 404
    if err == "already_decided":
        return jsonify({"error": "Login request already decided"}), 409
    if not entry:
        return jsonify({"error": "Could not approve login request"}), 500
    return jsonify({"ok": True, "status": "approved", "request_id": request_id})


@bp.post("/auth/login/requests/<request_id>/reject")
@require_auth
def reject_login_approval_request(request_id: str):
    if not _current_session_can_manage_login_requests():
        return (
            jsonify(
                {
                    "error": (
                        "This passkey/device is not allowed to approve or reject sign-in requests."
                    )
                }
            ),
            403,
        )
    request_id = str(request_id or "").strip()
    if not request_id:
        return jsonify({"error": "Request id is required"}), 400
    data = request.get_json(silent=True) or {}
    reason = str(data.get("reason") or "").strip()
    auth_user = str(session.get("auth_user") or "admin")
    entry, err = _set_login_approval_decision(
        request_id,
        approved=False,
        decision_by=auth_user,
        reason=reason or "Rejected by administrator.",
    )
    if err == "not_found":
        return jsonify({"error": "Login request not found"}), 404
    if err == "already_decided":
        return jsonify({"error": "Login request already decided"}), 409
    if not entry:
        return jsonify({"error": "Could not reject login request"}), 500
    return jsonify({"ok": True, "status": "rejected", "request_id": request_id})


@bp.get("/po")
@require_auth
def list_pos():
    return jsonify(_po_repository.list_pos())


@bp.get("/sync/status")
@require_auth
def sync_status():
    return jsonify(_po_repository.sync_status())


@bp.get("/po/trash")
@require_auth
def list_trash():
    return jsonify(_po_repository.list_trash())


@bp.get("/po/<int:po_id>")
@require_auth
def get_po(po_id: int):
    payload = _po_repository.get_po(po_id)
    if not payload:
        return jsonify({"error": "Not found"}), 404
    return jsonify(payload)


@bp.post("/po")
@require_auth
def save_po():
    data = request.get_json(silent=True) or {}
    fields = data.get("fields") or {}
    items = data.get("items") or []
    signatures = data.get("signatures") or {}
    report_style = data.get("reportStyle") or {}
    po_id = data.get("id")
    try:
        result = _po_repository.save_po(
            fields=fields,
            items=items,
            signatures=signatures,
            report_style=report_style,
            po_id=po_id,
        )
    except POFormNoConflictError as exc:
        return (
            jsonify({"error": "Form number already exists", "existing_id": exc.existing_id}),
            409,
        )
    _backup_service.run_auto_backup_if_due()
    return jsonify(result)


@bp.post("/po/export")
@require_auth
def export_po():
    data = request.get_json(silent=True) or {}
    fields = data.get("fields") or {}
    items = data.get("items") or []
    signatures = data.get("signatures") or {}
    report_style = data.get("reportStyle") or {}
    pdf_bytes = build_pdf(fields, items, signatures, report_style)
    filename = "PO.pdf"
    return send_file(
        BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=filename,
    )


@bp.get("/po/<int:po_id>/export")
@require_auth
def export_po_by_id(po_id: int):
    conn = get_db()
    if USE_POSTGRES:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT payload, form_no FROM purchase_orders WHERE id = %s",
                    (po_id,),
                )
                row = cur.fetchone()
    else:
        row = conn.execute(
            "SELECT payload, form_no FROM purchase_orders WHERE id = ?",
            (po_id,),
        ).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Not found"}), 404
    payload = json.loads(row["payload"])
    fields = payload.get("fields") or {}
    items = payload.get("items") or []
    signatures = payload.get("signatures") or {}
    report_style = payload.get("reportStyle") or {}
    pdf_bytes = build_pdf(fields, items, signatures, report_style)
    form_no = (row["form_no"] or "").strip()
    filename = f"PO_{form_no}.pdf" if form_no else f"PO_{po_id}.pdf"
    return send_file(
        BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=filename,
    )


@bp.delete("/po/<int:po_id>")
@require_auth
def delete_po(po_id: int):
    try:
        trashed_id = _po_repository.delete_po(po_id)
    except PONotFoundError:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"ok": True, "trashed_id": trashed_id})


@bp.post("/po/trash/<int:trash_id>/restore")
@require_auth
def restore_po(trash_id: int):
    try:
        po_id = _po_repository.restore_po(trash_id)
    except PONotFoundError:
        return jsonify({"error": "Not found"}), 404
    except POFormNoConflictError as exc:
        return (
            jsonify({"error": "Form number already exists", "existing_id": exc.existing_id}),
            409,
        )
    return jsonify({"ok": True, "id": po_id})


@bp.delete("/po/trash/<int:trash_id>")
@require_auth
def purge_po(trash_id: int):
    _po_repository.purge_po(trash_id)
    return jsonify({"ok": True})


@bp.get("/admin/backups")
@require_auth
def list_backups():
    return jsonify(_backup_service.list_backups_payload())


@bp.post("/admin/backups/create")
@require_auth
def create_backup():
    try:
        payload = _backup_service.create_backup()
    except MaintenanceError as exc:
        return jsonify({"error": str(exc)}), 500
    return jsonify(payload)


@bp.post("/admin/backups/restore")
@require_auth
def restore_backup():
    data = request.get_json(silent=True) or {}
    file_name = (data.get("filename") or "").strip()
    if not file_name:
        return jsonify({"error": "Backup file is required"}), 400

    try:
        payload = _backup_service.restore_backup(file_name)
    except BackupValidationError as exc:
        return jsonify({"error": str(exc)}), 400
    except FileNotFoundError:
        return jsonify({"error": "Backup file not found"}), 404
    except MaintenanceError as exc:
        return jsonify({"error": str(exc)}), 500

    return jsonify(payload)


@bp.delete("/admin/backups/<file_name>")
@require_auth
def delete_backup(file_name: str):
    try:
        payload = _backup_service.delete_backup(file_name)
    except BackupValidationError as exc:
        return jsonify({"error": str(exc)}), 400
    except FileNotFoundError:
        return jsonify({"error": "Backup file not found"}), 404
    except MaintenanceError as exc:
        return jsonify({"error": str(exc)}), 500
    return jsonify(payload)


@bp.get("/admin/updates/check")
@require_auth
def check_updates():
    try:
        payload = _update_service.check_updates()
    except MaintenanceError as exc:
        return jsonify({"error": str(exc)}), 500
    return jsonify(payload)


@bp.post("/admin/updates/apply")
@require_auth
def apply_updates():
    data = request.get_json(silent=True) or {}
    upgrade_pip = bool(data.get("upgrade_pip", True))
    upgrade_requirements = bool(data.get("upgrade_requirements", True))
    try:
        payload = _update_service.apply_updates(
            upgrade_pip=upgrade_pip,
            upgrade_requirements=upgrade_requirements,
        )
    except MaintenanceError as exc:
        return jsonify({"error": str(exc)}), 500
    return jsonify(payload)
