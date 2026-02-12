from __future__ import annotations

from ..config import USE_POSTGRES
from ..db import get_db


class AuthRepository:
    def __init__(self, *, use_postgres: bool = USE_POSTGRES):
        self.use_postgres = use_postgres

    def has_any_passkey(self) -> bool:
        conn = get_db()
        try:
            if self.use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute("SELECT COUNT(*) AS c FROM passkey_credentials")
                        row = cur.fetchone()
                        return bool(int(row["c"] if row else 0))
            row = conn.execute("SELECT COUNT(*) AS c FROM passkey_credentials").fetchone()
            return bool(int(row["c"] if row else 0))
        except Exception:
            return False
        finally:
            try:
                conn.close()
            except Exception:
                pass

