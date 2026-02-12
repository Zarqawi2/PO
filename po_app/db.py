from __future__ import annotations

import sqlite3
from datetime import datetime, timezone

from .config import DB_PATH, DB_URL, USE_POSTGRES

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except Exception:
    psycopg2 = None
    RealDictCursor = None

try:
    import psycopg
    from psycopg.rows import dict_row
except Exception:
    psycopg = None
    dict_row = None


class DatabaseManager:
    def __init__(self, *, db_url: str, db_path, use_postgres: bool):
        self.db_url = db_url
        self.db_path = db_path
        self.use_postgres = use_postgres

    def connect(self):
        if self.use_postgres:
            if psycopg2 is not None:
                return psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)
            if psycopg is not None:
                return psycopg.connect(self.db_url, row_factory=dict_row)
            raise RuntimeError(
                "PostgreSQL driver not installed. Run: pip install psycopg[binary]"
            )
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self) -> None:
        conn = self.connect()
        try:
            if self.use_postgres:
                self._init_postgres(conn)
            else:
                self._init_sqlite(conn)
        finally:
            conn.close()

    def _init_postgres(self, conn):
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS purchase_orders (
                        id SERIAL PRIMARY KEY,
                        created_at TIMESTAMPTZ NOT NULL,
                        updated_at TIMESTAMPTZ NOT NULL,
                        form_no TEXT,
                        po_date TEXT,
                        to_name TEXT,
                        company_name TEXT,
                        items_count INTEGER DEFAULT 0,
                        payload TEXT NOT NULL,
                        UNIQUE (form_no)
                    )
                    """
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS deleted_purchase_orders (
                        id SERIAL PRIMARY KEY,
                        original_po_id INTEGER,
                        deleted_at TIMESTAMPTZ NOT NULL,
                        created_at TIMESTAMPTZ,
                        updated_at TIMESTAMPTZ,
                        form_no TEXT,
                        po_date TEXT,
                        to_name TEXT,
                        company_name TEXT,
                        items_count INTEGER DEFAULT 0,
                        payload TEXT NOT NULL
                    )
                    """
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS passkey_credentials (
                        id SERIAL PRIMARY KEY,
                        username TEXT NOT NULL,
                        user_handle TEXT NOT NULL,
                        credential_id TEXT NOT NULL UNIQUE,
                        public_key TEXT NOT NULL,
                        sign_count BIGINT NOT NULL DEFAULT 0,
                        is_approval_device BOOLEAN NOT NULL DEFAULT FALSE,
                        created_at TIMESTAMPTZ NOT NULL,
                        updated_at TIMESTAMPTZ NOT NULL
                    )
                    """
                )
                cur.execute(
                    """
                    ALTER TABLE passkey_credentials
                    ADD COLUMN IF NOT EXISTS is_approval_device BOOLEAN NOT NULL DEFAULT FALSE
                    """
                )
                cur.execute(
                    """
                    UPDATE passkey_credentials
                    SET is_approval_device = TRUE
                    WHERE id = (
                        SELECT id
                        FROM passkey_credentials
                        ORDER BY created_at ASC NULLS LAST, id ASC
                        LIMIT 1
                    )
                      AND NOT EXISTS (
                          SELECT 1
                          FROM passkey_credentials
                          WHERE is_approval_device = TRUE
                      )
                    """
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS active_auth_sessions (
                        session_id TEXT PRIMARY KEY,
                        username TEXT NOT NULL,
                        can_manage_login_requests BOOLEAN NOT NULL DEFAULT FALSE,
                        last_seen TIMESTAMPTZ NOT NULL
                    )
                    """
                )
                cur.execute(
                    """
                    ALTER TABLE active_auth_sessions
                    ADD COLUMN IF NOT EXISTS can_manage_login_requests BOOLEAN NOT NULL DEFAULT FALSE
                    """
                )
                cur.execute(
                    """
                    WITH chosen AS (
                        SELECT session_id
                        FROM active_auth_sessions
                        WHERE can_manage_login_requests = TRUE
                        ORDER BY last_seen DESC, session_id ASC
                        LIMIT 1
                    )
                    UPDATE active_auth_sessions
                    SET can_manage_login_requests = CASE
                        WHEN session_id = (SELECT session_id FROM chosen) THEN TRUE
                        ELSE FALSE
                    END
                    WHERE can_manage_login_requests = TRUE
                    """
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS login_approval_requests (
                        id TEXT PRIMARY KEY,
                        username TEXT NOT NULL,
                        credential_id TEXT NOT NULL,
                        requester_session_id TEXT NOT NULL,
                        ip TEXT,
                        user_agent TEXT,
                        created_at TIMESTAMPTZ NOT NULL,
                        expires_at TIMESTAMPTZ NOT NULL,
                        status TEXT NOT NULL,
                        decision_by TEXT,
                        decision_at TIMESTAMPTZ,
                        reason TEXT
                    )
                    """
                )
                self._create_postgres_indexes(cur)

    def _create_postgres_indexes(self, cur):
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_purchase_orders_updated_at
            ON purchase_orders (updated_at DESC)
            """
        )
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_deleted_purchase_orders_deleted_at
            ON deleted_purchase_orders (deleted_at DESC)
            """
        )
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_active_auth_sessions_last_seen
            ON active_auth_sessions (last_seen DESC)
            """
        )
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_active_auth_sessions_manage_last_seen
            ON active_auth_sessions (can_manage_login_requests, last_seen DESC)
            """
        )
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_login_approval_requests_status_created
            ON login_approval_requests (status, created_at DESC)
            """
        )
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_login_approval_requests_expires_at
            ON login_approval_requests (expires_at)
            """
        )

    def _init_sqlite(self, conn):
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS purchase_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                form_no TEXT,
                po_date TEXT,
                to_name TEXT,
                company_name TEXT,
                items_count INTEGER DEFAULT 0,
                payload TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS deleted_purchase_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_po_id INTEGER,
                deleted_at TEXT NOT NULL,
                created_at TEXT,
                updated_at TEXT,
                form_no TEXT,
                po_date TEXT,
                to_name TEXT,
                company_name TEXT,
                items_count INTEGER DEFAULT 0,
                payload TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS passkey_credentials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                user_handle TEXT NOT NULL,
                credential_id TEXT NOT NULL UNIQUE,
                public_key TEXT NOT NULL,
                sign_count INTEGER NOT NULL DEFAULT 0,
                is_approval_device INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        columns = {
            str(row[1]).strip().lower()
            for row in conn.execute("PRAGMA table_info(passkey_credentials)").fetchall()
        }
        if "is_approval_device" not in columns:
            conn.execute(
                """
                ALTER TABLE passkey_credentials
                ADD COLUMN is_approval_device INTEGER NOT NULL DEFAULT 0
                """
            )
        has_approval = conn.execute(
            """
            SELECT 1
            FROM passkey_credentials
            WHERE is_approval_device = 1
            LIMIT 1
            """
        ).fetchone()
        if not has_approval:
            conn.execute(
                """
                UPDATE passkey_credentials
                SET is_approval_device = 1
                WHERE id = (
                    SELECT id
                    FROM passkey_credentials
                    ORDER BY datetime(created_at) ASC, id ASC
                    LIMIT 1
                )
                """
            )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS active_auth_sessions (
                session_id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                can_manage_login_requests INTEGER NOT NULL DEFAULT 0,
                last_seen TEXT NOT NULL
            )
            """
        )
        active_columns = {
            str(row[1]).strip().lower()
            for row in conn.execute("PRAGMA table_info(active_auth_sessions)").fetchall()
        }
        if "can_manage_login_requests" not in active_columns:
            conn.execute(
                """
                ALTER TABLE active_auth_sessions
                ADD COLUMN can_manage_login_requests INTEGER NOT NULL DEFAULT 0
                """
            )
        conn.execute(
            """
            WITH chosen AS (
                SELECT session_id
                FROM active_auth_sessions
                WHERE can_manage_login_requests = 1
                ORDER BY datetime(last_seen) DESC, session_id ASC
                LIMIT 1
            )
            UPDATE active_auth_sessions
            SET can_manage_login_requests = CASE
                WHEN session_id = (SELECT session_id FROM chosen) THEN 1
                ELSE 0
            END
            WHERE can_manage_login_requests = 1
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS login_approval_requests (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                credential_id TEXT NOT NULL,
                requester_session_id TEXT NOT NULL,
                ip TEXT,
                user_agent TEXT,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                status TEXT NOT NULL,
                decision_by TEXT,
                decision_at TEXT,
                reason TEXT
            )
            """
        )
        self._create_sqlite_indexes(conn)
        conn.commit()

    def _create_sqlite_indexes(self, conn):
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_purchase_orders_updated_at
            ON purchase_orders (updated_at)
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_deleted_purchase_orders_deleted_at
            ON deleted_purchase_orders (deleted_at)
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_active_auth_sessions_last_seen
            ON active_auth_sessions (last_seen)
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_active_auth_sessions_manage_last_seen
            ON active_auth_sessions (can_manage_login_requests, last_seen)
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_login_approval_requests_status_created
            ON login_approval_requests (status, created_at)
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_login_approval_requests_expires_at
            ON login_approval_requests (expires_at)
            """
        )


_database_manager = DatabaseManager(
    db_url=DB_URL,
    db_path=DB_PATH,
    use_postgres=USE_POSTGRES,
)


def get_db():
    return _database_manager.connect()


def init_db() -> None:
    _database_manager.init_db()


def iso(value):
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat().replace("+00:00", "Z")
    return str(value)

