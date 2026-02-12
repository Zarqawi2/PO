from __future__ import annotations

from pathlib import Path

from flask import Blueprint, render_template, session

from ..config import BASE_DIR
from ..config import AUTH_CODE_ONLY
from ..config import AUTH_DISABLED
from ..services.auth_repository import AuthRepository

bp = Blueprint("main", __name__)


class MainPageContextService:
    def __init__(self, *, base_dir: Path, auth_repository: AuthRepository):
        self._static_dir = base_dir / "static"
        self._auth_repository = auth_repository

    @staticmethod
    def _asset_version(file_path: Path) -> str:
        try:
            return str(int(file_path.stat().st_mtime))
        except OSError:
            return "1"

    def build_index_context(self, *, authenticated: bool) -> dict[str, object]:
        return {
            "css_version": self._asset_version(self._static_dir / "styles.css"),
            "js_version": self._asset_version(self._static_dir / "app.js"),
            "initial_authenticated": authenticated,
            "initial_has_passkey": self._auth_repository.has_any_passkey(),
            "auth_code_only": AUTH_CODE_ONLY,
        }


_main_page_context = MainPageContextService(
    base_dir=BASE_DIR,
    auth_repository=AuthRepository(),
)


@bp.get("/")
def index():
    initial_authenticated = AUTH_DISABLED or bool(session.get("auth_user"))
    context = _main_page_context.build_index_context(authenticated=initial_authenticated)
    return render_template("index.html", **context)
