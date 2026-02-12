from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int, *, minimum: int | None = None) -> int:
    raw = os.getenv(name, str(default)).strip()
    try:
        value = int(raw)
    except ValueError:
        value = default
    if minimum is not None:
        value = max(minimum, value)
    return value


@dataclass(frozen=True)
class AppSettings:
    app_env: str
    is_production: bool
    base_dir: Path
    db_url: str
    db_path: Path
    use_postgres: bool
    secret_key: str
    passkey_rp_name: str
    passkey_rp_id: str
    first_admin_setup_code: str
    auto_backup_enabled: bool
    auto_backup_interval_hours: int
    auto_backup_retention_days: int
    template_path: Path
    logo_path: Path
    signature_dir: Path
    signatures: dict[str, Path]
    flask_debug: bool
    flask_use_reloader: bool
    host: str
    port: int
    session_cookie_secure: bool
    session_cookie_samesite: str
    trust_proxy_headers: bool
    auth_disabled: bool
    auth_code_only: bool


def load_settings() -> AppSettings:
    base_dir = Path(__file__).resolve().parent.parent
    env_path = base_dir / ".env"
    if env_path.exists():
        try:
            from dotenv import load_dotenv

            load_dotenv(env_path)
        except Exception:
            pass

    app_env = (os.getenv("APP_ENV") or os.getenv("FLASK_ENV") or "development").strip().lower()
    is_production = app_env in {"production", "staging"}
    db_url = os.getenv("DATABASE_URL", "").strip()
    signature_dir = base_dir / "static" / "img" / "signatures"
    same_site = os.getenv("SESSION_COOKIE_SAMESITE", "Lax").strip().title() or "Lax"
    if same_site not in {"Lax", "Strict", "None"}:
        same_site = "Lax"

    return AppSettings(
        base_dir=base_dir,
        app_env=app_env,
        is_production=is_production,
        db_url=db_url,
        db_path=base_dir / "po.db",
        use_postgres=db_url.lower().startswith("postgresql"),
        secret_key=os.getenv("SECRET_KEY", "po-dev-secret-change-me"),
        passkey_rp_name=os.getenv("PASSKEY_RP_NAME", "PO Management"),
        passkey_rp_id=os.getenv("PASSKEY_RP_ID", "").strip().lower(),
        first_admin_setup_code=os.getenv("FIRST_ADMIN_SETUP_CODE", "").strip(),
        auto_backup_enabled=_env_bool("AUTO_BACKUP_ENABLED", True),
        auto_backup_interval_hours=_env_int(
            "AUTO_BACKUP_INTERVAL_HOURS",
            24,
            minimum=1,
        ),
        auto_backup_retention_days=_env_int(
            "AUTO_BACKUP_RETENTION_DAYS",
            30,
            minimum=1,
        ),
        template_path=base_dir / "PO.pdf",
        logo_path=base_dir / "static" / "img" / "po.jpg",
        signature_dir=signature_dir,
        signatures={
            "form_creator": signature_dir / "form_creator.png",
            "production_manager": signature_dir / "production_manager.png",
            "manager": signature_dir / "manager.png",
        },
        flask_debug=_env_bool("FLASK_DEBUG", False),
        flask_use_reloader=_env_bool("FLASK_USE_RELOADER", False),
        host=os.getenv("HOST", "0.0.0.0").strip() or "0.0.0.0",
        port=_env_int("PORT", 5000, minimum=1),
        session_cookie_secure=_env_bool("SESSION_COOKIE_SECURE", is_production),
        session_cookie_samesite=same_site,
        trust_proxy_headers=_env_bool("TRUST_PROXY_HEADERS", is_production),
        auth_disabled=_env_bool("AUTH_DISABLED", False),
        auth_code_only=_env_bool("AUTH_CODE_ONLY", False),
    )


settings = load_settings()

# Backward compatible module-level constants.
APP_ENV = settings.app_env
IS_PRODUCTION = settings.is_production
BASE_DIR = settings.base_dir
DB_URL = settings.db_url
DB_PATH = settings.db_path
USE_POSTGRES = settings.use_postgres
SECRET_KEY = settings.secret_key
PASSKEY_RP_NAME = settings.passkey_rp_name
PASSKEY_RP_ID = settings.passkey_rp_id
FIRST_ADMIN_SETUP_CODE = settings.first_admin_setup_code
AUTO_BACKUP_ENABLED = settings.auto_backup_enabled
AUTO_BACKUP_INTERVAL_HOURS = settings.auto_backup_interval_hours
AUTO_BACKUP_RETENTION_DAYS = settings.auto_backup_retention_days
TEMPLATE_PATH = settings.template_path
LOGO_PATH = settings.logo_path
SIGNATURE_DIR = settings.signature_dir
SIGNATURES = settings.signatures
FLASK_DEBUG = settings.flask_debug
FLASK_USE_RELOADER = settings.flask_use_reloader
HOST = settings.host
PORT = settings.port
SESSION_COOKIE_SECURE = settings.session_cookie_secure
SESSION_COOKIE_SAMESITE = settings.session_cookie_samesite
TRUST_PROXY_HEADERS = settings.trust_proxy_headers
AUTH_DISABLED = settings.auth_disabled
AUTH_CODE_ONLY = settings.auth_code_only
