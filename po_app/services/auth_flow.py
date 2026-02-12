from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, MutableMapping

from ..config import USE_POSTGRES
from ..db import get_db, iso


class PasskeyRepository:
    def __init__(self, *, use_postgres: bool = USE_POSTGRES):
        self.use_postgres = use_postgres

    @staticmethod
    def row_to_dict(row):
        if row is None:
            return None
        if isinstance(row, dict):
            return dict(row)
        try:
            return dict(row)
        except Exception:
            return None

    @staticmethod
    def to_bool(value) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return int(value) != 0
        text = str(value or "").strip().lower()
        return text in {"1", "true", "t", "yes", "on"}

    def is_approval_device(self, row) -> bool:
        data = self.row_to_dict(row) or {}
        return self.to_bool(data.get("is_approval_device"))

    def count(self) -> int:
        conn = get_db()
        try:
            if self.use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute("SELECT COUNT(*) AS c FROM passkey_credentials")
                        row = cur.fetchone()
                        return int(row["c"] if row else 0)
            row = conn.execute("SELECT COUNT(*) AS c FROM passkey_credentials").fetchone()
            return int(row["c"] if row else 0)
        finally:
            conn.close()

    def list(self, username: str | None = None):
        conn = get_db()
        try:
            if self.use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        if username:
                            cur.execute(
                                """
                                SELECT
                                    id,
                                    username,
                                    user_handle,
                                    credential_id,
                                    public_key,
                                    sign_count,
                                    is_approval_device
                                FROM passkey_credentials
                                WHERE username = %s
                                ORDER BY id ASC
                                """,
                                (username,),
                            )
                        else:
                            cur.execute(
                                """
                                SELECT
                                    id,
                                    username,
                                    user_handle,
                                    credential_id,
                                    public_key,
                                    sign_count,
                                    is_approval_device
                                FROM passkey_credentials
                                ORDER BY id ASC
                                """
                            )
                        return cur.fetchall()
            if username:
                rows = conn.execute(
                    """
                    SELECT
                        id,
                        username,
                        user_handle,
                        credential_id,
                        public_key,
                        sign_count,
                        is_approval_device
                    FROM passkey_credentials
                    WHERE username = ?
                    ORDER BY id ASC
                    """,
                    (username,),
                ).fetchall()
                return rows
            rows = conn.execute(
                """
                SELECT
                    id,
                    username,
                    user_handle,
                    credential_id,
                    public_key,
                    sign_count,
                    is_approval_device
                FROM passkey_credentials
                ORDER BY id ASC
                """
            ).fetchall()
            return rows
        finally:
            conn.close()

    def get_by_credential(self, credential_id: str):
        conn = get_db()
        try:
            if self.use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            SELECT
                                id,
                                username,
                                user_handle,
                                credential_id,
                                public_key,
                                sign_count,
                                is_approval_device
                            FROM passkey_credentials
                            WHERE credential_id = %s
                            """,
                            (credential_id,),
                        )
                        return cur.fetchone()
            row = conn.execute(
                """
                SELECT
                    id,
                    username,
                    user_handle,
                    credential_id,
                    public_key,
                    sign_count,
                    is_approval_device
                FROM passkey_credentials
                WHERE credential_id = ?
                """,
                (credential_id,),
            ).fetchone()
            return row
        finally:
            conn.close()

    def upsert(
        self,
        *,
        username: str,
        user_handle: str,
        credential_id: str,
        public_key: str,
        sign_count: int,
    ) -> bool:
        now = datetime.now(timezone.utc)
        conn = get_db()
        try:
            if self.use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            SELECT is_approval_device
                            FROM passkey_credentials
                            WHERE credential_id = %s
                            """,
                            (credential_id,),
                        )
                        existing = self.row_to_dict(cur.fetchone())
                        if existing:
                            is_approval_device = self.to_bool(existing.get("is_approval_device"))
                            cur.execute(
                                """
                                UPDATE passkey_credentials
                                SET username = %s,
                                    user_handle = %s,
                                    public_key = %s,
                                    sign_count = %s,
                                    updated_at = %s
                                WHERE credential_id = %s
                                """,
                                (
                                    username,
                                    user_handle,
                                    public_key,
                                    sign_count,
                                    now,
                                    credential_id,
                                ),
                            )
                            return is_approval_device

                        cur.execute(
                            """
                            SELECT 1
                            FROM passkey_credentials
                            WHERE is_approval_device = TRUE
                            LIMIT 1
                            """
                        )
                        is_approval_device = cur.fetchone() is None
                        cur.execute(
                            """
                            INSERT INTO passkey_credentials
                            (
                                username,
                                user_handle,
                                credential_id,
                                public_key,
                                sign_count,
                                is_approval_device,
                                created_at,
                                updated_at
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            """,
                            (
                                username,
                                user_handle,
                                credential_id,
                                public_key,
                                sign_count,
                                is_approval_device,
                                now,
                                now,
                            ),
                        )
                return bool(is_approval_device)

            now_text = iso(now)
            existing = self.row_to_dict(
                conn.execute(
                    """
                    SELECT is_approval_device
                    FROM passkey_credentials
                    WHERE credential_id = ?
                    """,
                    (credential_id,),
                ).fetchone()
            )
            if existing:
                is_approval_device = self.to_bool(existing.get("is_approval_device"))
                conn.execute(
                    """
                    UPDATE passkey_credentials
                    SET username = ?,
                        user_handle = ?,
                        public_key = ?,
                        sign_count = ?,
                        updated_at = ?
                    WHERE credential_id = ?
                    """,
                    (
                        username,
                        user_handle,
                        public_key,
                        sign_count,
                        now_text,
                        credential_id,
                    ),
                )
                conn.commit()
                return is_approval_device

            has_approval = conn.execute(
                """
                SELECT 1
                FROM passkey_credentials
                WHERE is_approval_device = 1
                LIMIT 1
                """
            ).fetchone()
            is_approval_device = has_approval is None
            conn.execute(
                """
                INSERT INTO passkey_credentials
                (
                    username,
                    user_handle,
                    credential_id,
                    public_key,
                    sign_count,
                    is_approval_device,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    username,
                    user_handle,
                    credential_id,
                    public_key,
                    sign_count,
                    1 if is_approval_device else 0,
                    now_text,
                    now_text,
                ),
            )
            conn.commit()
            return bool(is_approval_device)
        finally:
            conn.close()

    def update_sign_count(self, credential_id: str, sign_count: int):
        now = datetime.now(timezone.utc)
        conn = get_db()
        try:
            if self.use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            UPDATE passkey_credentials
                            SET sign_count = %s, updated_at = %s
                            WHERE credential_id = %s
                            """,
                            (sign_count, now, credential_id),
                        )
                return
            conn.execute(
                """
                UPDATE passkey_credentials
                SET sign_count = ?, updated_at = ?
                WHERE credential_id = ?
                """,
                (sign_count, iso(now), credential_id),
            )
            conn.commit()
        finally:
            conn.close()


class AuthFlowService:
    def __init__(
        self,
        *,
        passkey_repository: PasskeyRepository,
        use_postgres: bool = USE_POSTGRES,
        login_approval_ttl_seconds: int = 120,
        login_approval_decision_ttl_seconds: int = 180,
        active_auth_session_ttl_seconds: int = 300,
        approver_online_window_seconds: int = 12,
    ):
        self._passkey_repository = passkey_repository
        self._use_postgres = use_postgres
        self.login_approval_ttl_seconds = max(30, int(login_approval_ttl_seconds))
        self._login_approval_decision_ttl_seconds = max(30, int(login_approval_decision_ttl_seconds))
        self._active_auth_session_ttl_seconds = max(30, int(active_auth_session_ttl_seconds))
        self.approver_online_window_seconds = max(5, int(approver_online_window_seconds))

    @staticmethod
    def row_to_dict(row):
        return PasskeyRepository.row_to_dict(row)

    @staticmethod
    def to_bool(value) -> bool:
        return PasskeyRepository.to_bool(value)

    @staticmethod
    def to_datetime(value):
        if value is None:
            return None
        if isinstance(value, datetime):
            if value.tzinfo is None:
                return value.replace(tzinfo=timezone.utc)
            return value
        text = str(value).strip()
        if not text:
            return None
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        try:
            parsed = datetime.fromisoformat(text)
        except ValueError:
            return None
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed

    def seconds_until(self, value) -> int:
        dt_value = self.to_datetime(value)
        if not dt_value:
            return 0
        return max(0, int((dt_value - datetime.now(timezone.utc)).total_seconds()))

    def set_session_login_approval_capability(
        self,
        session_store: MutableMapping[str, Any],
        can_manage: bool,
    ):
        session_store["can_manage_login_requests"] = bool(can_manage)

    def ensure_auth_session_id(self, session_store: MutableMapping[str, Any]) -> str:
        session_id = str(session_store.get("auth_session_id") or "").strip()
        if session_id:
            return session_id
        session_id = secrets.token_urlsafe(18)
        session_store["auth_session_id"] = session_id
        return session_id

    def session_credential_is_approval_device(self, session_store: MutableMapping[str, Any]) -> bool:
        credential_id = str(session_store.get("auth_credential_id") or "").strip()
        if not credential_id:
            return False
        row = self._passkey_repository.get_by_credential(credential_id)
        return self._passkey_repository.is_approval_device(row)

    def current_session_can_manage_login_requests(
        self,
        session_store: MutableMapping[str, Any],
    ) -> bool:
        session_id = str(session_store.get("auth_session_id") or "").strip()
        if not session_id:
            self.set_session_login_approval_capability(session_store, False)
            return False
        conn = get_db()
        try:
            if self._use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            SELECT can_manage_login_requests
                            FROM active_auth_sessions
                            WHERE session_id = %s
                            """,
                            (session_id,),
                        )
                        row = self.row_to_dict(cur.fetchone())
            else:
                row = self.row_to_dict(
                    conn.execute(
                        """
                        SELECT can_manage_login_requests
                        FROM active_auth_sessions
                        WHERE session_id = ?
                        """,
                        (session_id,),
                    ).fetchone()
                )
            can_manage = self.to_bool((row or {}).get("can_manage_login_requests"))
            self.set_session_login_approval_capability(session_store, can_manage)
            return can_manage
        finally:
            conn.close()

    def cleanup_auth_flow_state(self, now_ts: float | None = None):
        now_dt = (
            datetime.fromtimestamp(float(now_ts), tz=timezone.utc)
            if now_ts is not None
            else datetime.now(timezone.utc)
        )
        now_iso = iso(now_dt)
        active_cutoff_dt = now_dt - timedelta(seconds=self._active_auth_session_ttl_seconds)
        active_cutoff_iso = iso(active_cutoff_dt)
        decision_cutoff_dt = now_dt - timedelta(seconds=self._login_approval_decision_ttl_seconds)
        decision_cutoff_iso = iso(decision_cutoff_dt)

        conn = get_db()
        try:
            if self._use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "DELETE FROM active_auth_sessions WHERE last_seen < %s",
                            (active_cutoff_dt,),
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
                            UPDATE login_approval_requests
                            SET status = 'rejected',
                                decision_by = 'system',
                                decision_at = %s,
                                reason = 'Login approval timed out.'
                            WHERE status = 'pending'
                              AND expires_at < %s
                            """,
                            (now_dt, now_dt),
                        )
                        cur.execute(
                            """
                            DELETE FROM login_approval_requests
                            WHERE status <> 'pending'
                              AND decision_at IS NOT NULL
                              AND decision_at < %s
                            """,
                            (decision_cutoff_dt,),
                        )
                return

            conn.execute(
                "DELETE FROM active_auth_sessions WHERE last_seen < ?",
                (active_cutoff_iso,),
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
                UPDATE login_approval_requests
                SET status = 'rejected',
                    decision_by = 'system',
                    decision_at = ?,
                    reason = 'Login approval timed out.'
                WHERE status = 'pending'
                  AND expires_at < ?
                """,
                (now_iso, now_iso),
            )
            conn.execute(
                """
                DELETE FROM login_approval_requests
                WHERE status <> 'pending'
                  AND decision_at IS NOT NULL
                  AND decision_at < ?
                """,
                (decision_cutoff_iso,),
            )
            conn.commit()
        finally:
            conn.close()
    def touch_active_auth_session(
        self,
        session_store: MutableMapping[str, Any],
        user: str | None,
        *,
        can_manage_login_requests: bool | None = None,
    ):
        username = str(user or "").strip()
        if not username:
            return
        can_manage = (
            self.to_bool(can_manage_login_requests)
            if can_manage_login_requests is not None
            else self.session_credential_is_approval_device(session_store)
        )
        self.cleanup_auth_flow_state()
        session_id = self.ensure_auth_session_id(session_store)
        now_dt = datetime.now(timezone.utc)
        now_iso = iso(now_dt)
        online_cutoff_dt = now_dt - timedelta(seconds=self.approver_online_window_seconds)
        online_cutoff_iso = iso(online_cutoff_dt)
        conn = get_db()
        try:
            if self._use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        if can_manage:
                            cur.execute(
                                """
                                SELECT session_id
                                FROM active_auth_sessions
                                WHERE session_id <> %s
                                  AND can_manage_login_requests = TRUE
                                  AND last_seen >= %s
                                ORDER BY last_seen DESC, session_id ASC
                                LIMIT 1
                                """,
                                (session_id, online_cutoff_dt),
                            )
                            owner_row = self.row_to_dict(cur.fetchone())
                            if owner_row:
                                can_manage = False
                        if can_manage:
                            cur.execute(
                                """
                                UPDATE active_auth_sessions
                                SET can_manage_login_requests = FALSE
                                WHERE session_id <> %s
                                  AND can_manage_login_requests = TRUE
                                """,
                                (session_id,),
                            )
                        cur.execute(
                            """
                            INSERT INTO active_auth_sessions (
                                session_id,
                                username,
                                can_manage_login_requests,
                                last_seen
                            )
                            VALUES (%s, %s, %s, %s)
                            ON CONFLICT (session_id)
                            DO UPDATE SET
                                username = EXCLUDED.username,
                                can_manage_login_requests = EXCLUDED.can_manage_login_requests,
                                last_seen = EXCLUDED.last_seen
                            """,
                            (session_id, username, bool(can_manage), now_dt),
                        )
                self.set_session_login_approval_capability(session_store, bool(can_manage))
                return

            if can_manage:
                owner_row = self.row_to_dict(
                    conn.execute(
                        """
                        SELECT session_id
                        FROM active_auth_sessions
                        WHERE session_id <> ?
                          AND can_manage_login_requests = 1
                          AND last_seen >= ?
                        ORDER BY datetime(last_seen) DESC, session_id ASC
                        LIMIT 1
                        """,
                        (session_id, online_cutoff_iso),
                    ).fetchone()
                )
                if owner_row:
                    can_manage = False
            if can_manage:
                conn.execute(
                    """
                    UPDATE active_auth_sessions
                    SET can_manage_login_requests = 0
                    WHERE session_id <> ?
                      AND can_manage_login_requests = 1
                    """,
                    (session_id,),
                )
            conn.execute(
                """
                INSERT INTO active_auth_sessions (
                    session_id,
                    username,
                    can_manage_login_requests,
                    last_seen
                )
                VALUES (?, ?, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET
                    username = excluded.username,
                    can_manage_login_requests = excluded.can_manage_login_requests,
                    last_seen = excluded.last_seen
                """,
                (session_id, username, 1 if can_manage else 0, now_iso),
            )
            conn.commit()
            self.set_session_login_approval_capability(session_store, bool(can_manage))
        finally:
            conn.close()

    def drop_active_auth_session(self, session_store: MutableMapping[str, Any]):
        session_id = str(session_store.get("auth_session_id") or "").strip()
        if session_id:
            conn = get_db()
            try:
                if self._use_postgres:
                    with conn:
                        with conn.cursor() as cur:
                            cur.execute(
                                "DELETE FROM active_auth_sessions WHERE session_id = %s",
                                (session_id,),
                            )
                else:
                    conn.execute(
                        "DELETE FROM active_auth_sessions WHERE session_id = ?",
                        (session_id,),
                    )
                    conn.commit()
            finally:
                conn.close()
        session_store.pop("auth_session_id", None)
        session_store.pop("auth_credential_id", None)
        session_store.pop("can_manage_login_requests", None)

    def has_other_active_authenticated_session(self, session_store: MutableMapping[str, Any]) -> bool:
        self.cleanup_auth_flow_state()
        current_session_id = str(session_store.get("auth_session_id") or "").strip()
        conn = get_db()
        try:
            if self._use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        if current_session_id:
                            cur.execute(
                                """
                                SELECT COUNT(*) AS c
                                FROM active_auth_sessions
                                WHERE session_id <> %s
                                """,
                                (current_session_id,),
                            )
                        else:
                            cur.execute("SELECT COUNT(*) AS c FROM active_auth_sessions")
                        row = cur.fetchone()
                        return int(row["c"] if row else 0) > 0

            if current_session_id:
                row = conn.execute(
                    """
                    SELECT COUNT(*) AS c
                    FROM active_auth_sessions
                    WHERE session_id <> ?
                    """,
                    (current_session_id,),
                ).fetchone()
            else:
                row = conn.execute("SELECT COUNT(*) AS c FROM active_auth_sessions").fetchone()
            return int(row["c"] if row else 0) > 0
        finally:
            conn.close()

    def has_other_online_approver_session(
        self,
        session_store: MutableMapping[str, Any],
        *,
        online_window_seconds: int | None = None,
    ) -> bool:
        self.cleanup_auth_flow_state()
        current_session_id = str(session_store.get("auth_session_id") or "").strip()
        window_seconds = max(
            5,
            int(
                online_window_seconds
                if online_window_seconds is not None
                else self.approver_online_window_seconds
            ),
        )
        cutoff_dt = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
        cutoff_iso = iso(cutoff_dt)
        conn = get_db()
        try:
            if self._use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        if current_session_id:
                            cur.execute(
                                """
                                SELECT COUNT(*) AS c
                                FROM active_auth_sessions
                                WHERE session_id <> %s
                                  AND can_manage_login_requests = TRUE
                                  AND last_seen >= %s
                                """,
                                (current_session_id, cutoff_dt),
                            )
                        else:
                            cur.execute(
                                """
                                SELECT COUNT(*) AS c
                                FROM active_auth_sessions
                                WHERE can_manage_login_requests = TRUE
                                  AND last_seen >= %s
                                """,
                                (cutoff_dt,),
                            )
                        row = cur.fetchone()
                        return int(row["c"] if row else 0) > 0

            if current_session_id:
                row = conn.execute(
                    """
                    SELECT COUNT(*) AS c
                    FROM active_auth_sessions
                    WHERE session_id <> ?
                      AND can_manage_login_requests = 1
                      AND last_seen >= ?
                    """,
                    (current_session_id, cutoff_iso),
                ).fetchone()
            else:
                row = conn.execute(
                    """
                    SELECT COUNT(*) AS c
                    FROM active_auth_sessions
                    WHERE can_manage_login_requests = 1
                      AND last_seen >= ?
                    """,
                    (cutoff_iso,),
                ).fetchone()
            return int(row["c"] if row else 0) > 0
        finally:
            conn.close()

    def create_login_approval_request(
        self,
        session_store: MutableMapping[str, Any],
        *,
        username: str,
        credential_id: str,
        requester_ip: str,
        requester_ua: str,
    ) -> dict[str, object]:
        self.cleanup_auth_flow_state()
        previous_request_id = str(session_store.get("pending_login_request_id") or "").strip()
        requester_session_id = self.ensure_auth_session_id(session_store)
        now_dt = datetime.now(timezone.utc)
        now_iso = iso(now_dt)
        expires_dt = now_dt + timedelta(seconds=self.login_approval_ttl_seconds)
        expires_iso = iso(expires_dt)
        request_id = secrets.token_urlsafe(18)

        conn = get_db()
        try:
            if self._use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        if previous_request_id:
                            cur.execute(
                                """
                                UPDATE login_approval_requests
                                SET status = 'rejected',
                                    decision_by = 'system',
                                    decision_at = %s,
                                    reason = 'Superseded by a newer login request.'
                                WHERE id = %s
                                  AND status = 'pending'
                                """,
                                (now_dt, previous_request_id),
                            )
                        cur.execute(
                            """
                            INSERT INTO login_approval_requests (
                                id, username, credential_id, requester_session_id, ip, user_agent,
                                created_at, expires_at, status, decision_by, decision_at, reason
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending', NULL, NULL, '')
                            """,
                            (
                                request_id,
                                username,
                                credential_id,
                                requester_session_id,
                                requester_ip,
                                requester_ua,
                                now_dt,
                                expires_dt,
                            ),
                        )
            else:
                if previous_request_id:
                    conn.execute(
                        """
                        UPDATE login_approval_requests
                        SET status = 'rejected',
                            decision_by = 'system',
                            decision_at = ?,
                            reason = 'Superseded by a newer login request.'
                        WHERE id = ?
                          AND status = 'pending'
                        """,
                        (now_iso, previous_request_id),
                    )
                conn.execute(
                    """
                    INSERT INTO login_approval_requests (
                        id, username, credential_id, requester_session_id, ip, user_agent,
                        created_at, expires_at, status, decision_by, decision_at, reason
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, '')
                    """,
                    (
                        request_id,
                        username,
                        credential_id,
                        requester_session_id,
                        requester_ip,
                        requester_ua,
                        now_iso,
                        expires_iso,
                    ),
                )
                conn.commit()
        finally:
            conn.close()

        session_store["pending_login_request_id"] = request_id
        return {
            "id": request_id,
            "username": username,
            "credential_id": credential_id,
            "created_at": now_iso,
            "expires_at": expires_iso,
        }
    def cancel_pending_login_requests_for_credential(
        self,
        credential_id: str,
        *,
        reason: str = "",
    ) -> int:
        credential = str(credential_id or "").strip()
        if not credential:
            return 0
        self.cleanup_auth_flow_state()
        now_dt = datetime.now(timezone.utc)
        now_iso = iso(now_dt)
        next_reason = (reason or "").strip() or "Canceled by system."

        conn = get_db()
        try:
            if self._use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            UPDATE login_approval_requests
                            SET status = 'rejected',
                                decision_by = 'system',
                                decision_at = %s,
                                reason = %s
                            WHERE credential_id = %s
                              AND status = 'pending'
                            """,
                            (now_dt, next_reason, credential),
                        )
                        return max(0, int(cur.rowcount or 0))

            cur = conn.execute(
                """
                UPDATE login_approval_requests
                SET status = 'rejected',
                    decision_by = 'system',
                    decision_at = ?,
                    reason = ?
                WHERE credential_id = ?
                  AND status = 'pending'
                """,
                (now_iso, next_reason, credential),
            )
            conn.commit()
            return max(0, int(cur.rowcount or 0))
        finally:
            conn.close()

    def set_login_approval_decision(
        self,
        request_id: str,
        *,
        approved: bool,
        decision_by: str,
        reason: str = "",
    ) -> tuple[dict[str, object] | None, str | None]:
        if not request_id:
            return None, "missing"
        self.cleanup_auth_flow_state()
        now_dt = datetime.now(timezone.utc)
        now_iso = iso(now_dt)
        next_status = "approved" if approved else "rejected"
        next_reason = "" if approved else (reason.strip() or "Rejected by administrator.")
        actor = (decision_by or "admin").strip()

        conn = get_db()
        try:
            if self._use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            UPDATE login_approval_requests
                            SET status = 'rejected',
                                decision_by = 'system',
                                decision_at = %s,
                                reason = 'Login approval timed out.'
                            WHERE id = %s
                              AND status = 'pending'
                              AND expires_at < %s
                            """,
                            (now_dt, request_id, now_dt),
                        )
                        cur.execute(
                            "SELECT * FROM login_approval_requests WHERE id = %s",
                            (request_id,),
                        )
                        row = self.row_to_dict(cur.fetchone())
                        if not row:
                            return None, "not_found"
                        if str(row.get("status") or "pending") != "pending":
                            return row, "already_decided"
                        cur.execute(
                            """
                            UPDATE login_approval_requests
                            SET status = %s,
                                decision_by = %s,
                                decision_at = %s,
                                reason = %s
                            WHERE id = %s
                            """,
                            (next_status, actor, now_dt, next_reason, request_id),
                        )
                        cur.execute(
                            "SELECT * FROM login_approval_requests WHERE id = %s",
                            (request_id,),
                        )
                        return self.row_to_dict(cur.fetchone()), None

            conn.execute(
                """
                UPDATE login_approval_requests
                SET status = 'rejected',
                    decision_by = 'system',
                    decision_at = ?,
                    reason = 'Login approval timed out.'
                WHERE id = ?
                  AND status = 'pending'
                  AND expires_at < ?
                """,
                (now_iso, request_id, now_iso),
            )
            row = self.row_to_dict(
                conn.execute(
                    "SELECT * FROM login_approval_requests WHERE id = ?",
                    (request_id,),
                ).fetchone()
            )
            if not row:
                conn.commit()
                return None, "not_found"
            if str(row.get("status") or "pending") != "pending":
                conn.commit()
                return row, "already_decided"
            conn.execute(
                """
                UPDATE login_approval_requests
                SET status = ?,
                    decision_by = ?,
                    decision_at = ?,
                    reason = ?
                WHERE id = ?
                """,
                (next_status, actor, now_iso, next_reason, request_id),
            )
            updated = self.row_to_dict(
                conn.execute(
                    "SELECT * FROM login_approval_requests WHERE id = ?",
                    (request_id,),
                ).fetchone()
            )
            conn.commit()
            return updated, None
        finally:
            conn.close()

    def get_login_approval_request(self, request_id: str):
        if not request_id:
            return None
        conn = get_db()
        try:
            if self._use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "SELECT * FROM login_approval_requests WHERE id = %s",
                            (request_id,),
                        )
                        return self.row_to_dict(cur.fetchone())
            row = conn.execute(
                "SELECT * FROM login_approval_requests WHERE id = ?",
                (request_id,),
            ).fetchone()
            return self.row_to_dict(row)
        finally:
            conn.close()

    def list_pending_login_approval_requests(self) -> list[dict[str, object]]:
        self.cleanup_auth_flow_state()
        rows: list[dict[str, object]] = []
        conn = get_db()
        try:
            if self._use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            SELECT id, username, ip, user_agent, created_at, expires_at
                            FROM login_approval_requests
                            WHERE status = 'pending'
                            ORDER BY created_at DESC
                            """
                        )
                        raw_rows = cur.fetchall() or []
            else:
                raw_rows = conn.execute(
                    """
                    SELECT id, username, ip, user_agent, created_at, expires_at
                    FROM login_approval_requests
                    WHERE status = 'pending'
                    ORDER BY created_at DESC
                    """
                ).fetchall()
            for row in raw_rows:
                data = self.row_to_dict(row) or {}
                rows.append(
                    {
                        "id": str(data.get("id") or ""),
                        "user": str(data.get("username") or "admin"),
                        "ip": str(data.get("ip") or ""),
                        "user_agent": str(data.get("user_agent") or ""),
                        "created_at": str(data.get("created_at") or ""),
                        "expires_at": str(data.get("expires_at") or ""),
                        "expires_in": self.seconds_until(data.get("expires_at")),
                    }
                )
        finally:
            conn.close()
        return rows
