from __future__ import annotations

import json
from datetime import datetime, timezone

from ..config import USE_POSTGRES
from ..db import get_db, iso


class PONotFoundError(Exception):
    pass


class POFormNoConflictError(Exception):
    def __init__(self, existing_id: int):
        super().__init__(f"Form number already exists ({existing_id})")
        self.existing_id = existing_id


class PORepository:
    def __init__(self, *, use_postgres: bool = USE_POSTGRES):
        self.use_postgres = use_postgres

    @staticmethod
    def _row_to_dict(row):
        if row is None:
            return None
        if isinstance(row, dict):
            return dict(row)
        try:
            return dict(row)
        except Exception:
            return None

    def list_pos(self) -> list[dict]:
        conn = get_db()
        try:
            if self.use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            SELECT id, form_no, po_date, to_name, company_name, items_count, updated_at
                            FROM purchase_orders
                            ORDER BY updated_at DESC, id DESC
                            """
                        )
                        rows = cur.fetchall() or []
            else:
                rows = conn.execute(
                    """
                    SELECT id, form_no, po_date, to_name, company_name, items_count, updated_at
                    FROM purchase_orders
                    ORDER BY datetime(updated_at) DESC, id DESC
                    """
                ).fetchall()
        finally:
            conn.close()

        result: list[dict] = []
        for row in rows:
            data = self._row_to_dict(row) or {}
            data["updated_at"] = iso(data.get("updated_at"))
            result.append(data)
        return result

    def sync_status(self) -> dict[str, object]:
        conn = get_db()
        try:
            if self.use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            SELECT COUNT(*) AS c, MAX(updated_at) AS latest
                            FROM purchase_orders
                            """
                        )
                        po_row = self._row_to_dict(cur.fetchone()) or {}
                        cur.execute(
                            """
                            SELECT COUNT(*) AS c, MAX(deleted_at) AS latest
                            FROM deleted_purchase_orders
                            """
                        )
                        trash_row = self._row_to_dict(cur.fetchone()) or {}
            else:
                po_row = self._row_to_dict(
                    conn.execute(
                        """
                        SELECT COUNT(*) AS c, MAX(updated_at) AS latest
                        FROM purchase_orders
                        """
                    ).fetchone()
                ) or {}
                trash_row = self._row_to_dict(
                    conn.execute(
                        """
                        SELECT COUNT(*) AS c, MAX(deleted_at) AS latest
                        FROM deleted_purchase_orders
                        """
                    ).fetchone()
                ) or {}
        finally:
            conn.close()

        return {
            "saved_count": int(po_row.get("c") or 0),
            "trash_count": int(trash_row.get("c") or 0),
            "latest_saved_at": iso(po_row.get("latest")),
            "latest_trash_at": iso(trash_row.get("latest")),
        }

    def list_trash(self) -> list[dict]:
        conn = get_db()
        try:
            if self.use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            SELECT id, original_po_id, form_no, po_date, to_name, company_name,
                                   items_count, deleted_at
                            FROM deleted_purchase_orders
                            ORDER BY deleted_at DESC, id DESC
                            """
                        )
                        rows = cur.fetchall() or []
            else:
                rows = conn.execute(
                    """
                    SELECT id, original_po_id, form_no, po_date, to_name, company_name,
                           items_count, deleted_at
                    FROM deleted_purchase_orders
                    ORDER BY datetime(deleted_at) DESC, id DESC
                    """
                ).fetchall()
        finally:
            conn.close()

        result: list[dict] = []
        for row in rows:
            data = self._row_to_dict(row) or {}
            data["deleted_at"] = iso(data.get("deleted_at"))
            result.append(data)
        return result

    def get_po(self, po_id: int) -> dict | None:
        conn = get_db()
        try:
            if self.use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "SELECT id, payload, updated_at FROM purchase_orders WHERE id = %s",
                            (po_id,),
                        )
                        row = cur.fetchone()
            else:
                row = conn.execute(
                    "SELECT id, payload, updated_at FROM purchase_orders WHERE id = ?",
                    (po_id,),
                ).fetchone()
        finally:
            conn.close()
        if not row:
            return None
        data = self._row_to_dict(row) or {}
        payload = json.loads(data.get("payload") or "{}")
        if not isinstance(payload, dict):
            payload = {}
        payload["id"] = data.get("id")
        payload["updated_at"] = iso(data.get("updated_at"))
        return payload

    def save_po(
        self,
        *,
        fields: dict,
        items: list,
        signatures: dict,
        report_style: dict,
        po_id: int | None,
    ) -> dict[str, object]:
        now = datetime.now(timezone.utc)
        form_no = (fields.get("formNo") or "").strip()
        po_date = (fields.get("date") or "").strip()
        to_name = (fields.get("to") or "").strip()
        company_name = (fields.get("companyName") or "").strip()
        items_count = len(items)
        target_id = int(po_id) if po_id is not None else None

        payload = {
            "fields": fields,
            "items": items,
            "signatures": signatures,
            "reportStyle": report_style,
        }

        conn = get_db()
        try:
            if self.use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        if form_no:
                            cur.execute(
                                "SELECT id FROM purchase_orders WHERE form_no = %s AND id != %s",
                                (form_no, target_id or -1),
                            )
                            row = cur.fetchone()
                            if row:
                                data = self._row_to_dict(row) or {}
                                raise POFormNoConflictError(int(data.get("id") or 0))

                        if target_id:
                            cur.execute(
                                """
                                UPDATE purchase_orders
                                SET updated_at = %s, form_no = %s, po_date = %s, to_name = %s,
                                    company_name = %s, items_count = %s, payload = %s
                                WHERE id = %s
                                """,
                                (
                                    now,
                                    form_no,
                                    po_date,
                                    to_name,
                                    company_name,
                                    items_count,
                                    json.dumps(payload),
                                    target_id,
                                ),
                            )
                        else:
                            cur.execute(
                                """
                                INSERT INTO purchase_orders
                                (created_at, updated_at, form_no, po_date, to_name, company_name, items_count, payload)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                                RETURNING id
                                """,
                                (
                                    now,
                                    now,
                                    form_no,
                                    po_date,
                                    to_name,
                                    company_name,
                                    items_count,
                                    json.dumps(payload),
                                ),
                            )
                            new_row = self._row_to_dict(cur.fetchone()) or {}
                            target_id = int(new_row.get("id") or 0)
            else:
                now_text = iso(now)
                if form_no:
                    row = conn.execute(
                        "SELECT id FROM purchase_orders WHERE form_no = ? AND id != ?",
                        (form_no, target_id or -1),
                    ).fetchone()
                    if row:
                        data = self._row_to_dict(row) or {}
                        raise POFormNoConflictError(int(data.get("id") or 0))

                if target_id:
                    conn.execute(
                        """
                        UPDATE purchase_orders
                        SET updated_at = ?, form_no = ?, po_date = ?, to_name = ?, company_name = ?,
                            items_count = ?, payload = ?
                        WHERE id = ?
                        """,
                        (
                            now_text,
                            form_no,
                            po_date,
                            to_name,
                            company_name,
                            items_count,
                            json.dumps(payload),
                            target_id,
                        ),
                    )
                else:
                    conn.execute(
                        """
                        INSERT INTO purchase_orders
                        (created_at, updated_at, form_no, po_date, to_name, company_name, items_count, payload)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            now_text,
                            now_text,
                            form_no,
                            po_date,
                            to_name,
                            company_name,
                            items_count,
                            json.dumps(payload),
                        ),
                    )
                    target_id = int(conn.execute("SELECT last_insert_rowid()").fetchone()[0])
                conn.commit()
        finally:
            conn.close()

        return {"id": target_id, "saved_at": iso(now), "updated_at": iso(now)}

    def delete_po(self, po_id: int) -> int:
        now = datetime.now(timezone.utc)
        conn = get_db()
        try:
            if self.use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            SELECT id, created_at, updated_at, form_no, po_date, to_name,
                                   company_name, items_count, payload
                            FROM purchase_orders
                            WHERE id = %s
                            """,
                            (po_id,),
                        )
                        row = self._row_to_dict(cur.fetchone())
                        if not row:
                            raise PONotFoundError("PO not found")
                        cur.execute(
                            """
                            INSERT INTO deleted_purchase_orders
                            (original_po_id, deleted_at, created_at, updated_at, form_no, po_date,
                             to_name, company_name, items_count, payload)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            RETURNING id
                            """,
                            (
                                row["id"],
                                now,
                                row["created_at"],
                                row["updated_at"],
                                row["form_no"],
                                row["po_date"],
                                row["to_name"],
                                row["company_name"],
                                row["items_count"],
                                row["payload"],
                            ),
                        )
                        inserted = self._row_to_dict(cur.fetchone()) or {}
                        trashed_id = int(inserted.get("id") or 0)
                        cur.execute("DELETE FROM purchase_orders WHERE id = %s", (po_id,))
                        return trashed_id
            else:
                row = self._row_to_dict(
                    conn.execute(
                        """
                        SELECT id, created_at, updated_at, form_no, po_date, to_name,
                               company_name, items_count, payload
                        FROM purchase_orders
                        WHERE id = ?
                        """,
                        (po_id,),
                    ).fetchone()
                )
                if not row:
                    raise PONotFoundError("PO not found")
                now_text = iso(now)
                conn.execute(
                    """
                    INSERT INTO deleted_purchase_orders
                    (original_po_id, deleted_at, created_at, updated_at, form_no, po_date,
                     to_name, company_name, items_count, payload)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        row["id"],
                        now_text,
                        row["created_at"],
                        row["updated_at"],
                        row["form_no"],
                        row["po_date"],
                        row["to_name"],
                        row["company_name"],
                        row["items_count"],
                        row["payload"],
                    ),
                )
                trashed_id = int(conn.execute("SELECT last_insert_rowid()").fetchone()[0])
                conn.execute("DELETE FROM purchase_orders WHERE id = ?", (po_id,))
                conn.commit()
                return trashed_id
        finally:
            conn.close()

    def restore_po(self, trash_id: int) -> int:
        now = datetime.now(timezone.utc)
        conn = get_db()
        try:
            if self.use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            SELECT id, created_at, updated_at, form_no, po_date, to_name,
                                   company_name, items_count, payload
                            FROM deleted_purchase_orders
                            WHERE id = %s
                            """,
                            (trash_id,),
                        )
                        row = self._row_to_dict(cur.fetchone())
                        if not row:
                            raise PONotFoundError("Trash record not found")

                        form_no = (row.get("form_no") or "").strip()
                        if form_no:
                            cur.execute(
                                "SELECT id FROM purchase_orders WHERE form_no = %s",
                                (form_no,),
                            )
                            existing = self._row_to_dict(cur.fetchone())
                            if existing:
                                raise POFormNoConflictError(int(existing.get("id") or 0))

                        created_at = row.get("created_at") or now
                        cur.execute(
                            """
                            INSERT INTO purchase_orders
                            (created_at, updated_at, form_no, po_date, to_name, company_name, items_count, payload)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            RETURNING id
                            """,
                            (
                                created_at,
                                now,
                                row.get("form_no"),
                                row.get("po_date"),
                                row.get("to_name"),
                                row.get("company_name"),
                                row.get("items_count"),
                                row.get("payload"),
                            ),
                        )
                        inserted = self._row_to_dict(cur.fetchone()) or {}
                        po_id = int(inserted.get("id") or 0)
                        cur.execute(
                            "DELETE FROM deleted_purchase_orders WHERE id = %s",
                            (trash_id,),
                        )
                        return po_id
            else:
                row = self._row_to_dict(
                    conn.execute(
                        """
                        SELECT id, created_at, updated_at, form_no, po_date, to_name,
                               company_name, items_count, payload
                        FROM deleted_purchase_orders
                        WHERE id = ?
                        """,
                        (trash_id,),
                    ).fetchone()
                )
                if not row:
                    raise PONotFoundError("Trash record not found")

                form_no = (row.get("form_no") or "").strip()
                if form_no:
                    existing = self._row_to_dict(
                        conn.execute(
                            "SELECT id FROM purchase_orders WHERE form_no = ?",
                            (form_no,),
                        ).fetchone()
                    )
                    if existing:
                        raise POFormNoConflictError(int(existing.get("id") or 0))

                now_text = iso(now)
                created_at = row.get("created_at") or now_text
                conn.execute(
                    """
                    INSERT INTO purchase_orders
                    (created_at, updated_at, form_no, po_date, to_name, company_name, items_count, payload)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        created_at,
                        now_text,
                        row.get("form_no"),
                        row.get("po_date"),
                        row.get("to_name"),
                        row.get("company_name"),
                        row.get("items_count"),
                        row.get("payload"),
                    ),
                )
                po_id = int(conn.execute("SELECT last_insert_rowid()").fetchone()[0])
                conn.execute("DELETE FROM deleted_purchase_orders WHERE id = ?", (trash_id,))
                conn.commit()
                return po_id
        finally:
            conn.close()

    def purge_po(self, trash_id: int):
        conn = get_db()
        try:
            if self.use_postgres:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "DELETE FROM deleted_purchase_orders WHERE id = %s",
                            (trash_id,),
                        )
            else:
                conn.execute("DELETE FROM deleted_purchase_orders WHERE id = ?", (trash_id,))
                conn.commit()
        finally:
            conn.close()

