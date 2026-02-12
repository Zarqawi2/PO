from __future__ import annotations

from datetime import timedelta

from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix

from .config import (
    BASE_DIR,
    IS_PRODUCTION,
    SECRET_KEY,
    SESSION_COOKIE_SAMESITE,
    SESSION_COOKIE_SECURE,
    TRUST_PROXY_HEADERS,
)
from .db import init_db
from .routes.api import bp as api_bp
from .routes.main import bp as main_bp


def create_app() -> Flask:
    app = Flask(
        __name__,
        template_folder=str(BASE_DIR / "templates"),
        static_folder=str(BASE_DIR / "static"),
    )
    app.config.update(
        SECRET_KEY=SECRET_KEY,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE=SESSION_COOKIE_SAMESITE,
        SESSION_COOKIE_SECURE=bool(SESSION_COOKIE_SECURE),
        SESSION_COOKIE_NAME="po_session",
        PERMANENT_SESSION_LIFETIME=timedelta(hours=12),
        PREFERRED_URL_SCHEME="https" if SESSION_COOKIE_SECURE else "http",
    )
    if IS_PRODUCTION:
        app.config["TEMPLATES_AUTO_RELOAD"] = False

    if TRUST_PROXY_HEADERS:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix="/api")

    init_db()
    return app
