from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

from ..config import LOGO_PATH, SIGNATURES


def _format_date(value: str) -> str:
    if not value:
        return ""
    try:
        from datetime import datetime

        date = datetime.fromisoformat(value)
    except ValueError:
        return value
    day = str(int(date.strftime("%d")))
    return f"{day} {date.strftime('%B %Y')}"


def _fit_text(text: str, max_width: float, font_name: str, font_size: float) -> str:
    if not text:
        return ""
    if stringWidth(text, font_name, font_size) <= max_width:
        return text
    ellipsis = "..."
    trimmed = text
    while trimmed and stringWidth(trimmed + ellipsis, font_name, font_size) > max_width:
        trimmed = trimmed[:-1]
    return (trimmed + ellipsis) if trimmed else ""


def _wrap_text(text: str, max_width: float, font_name: str, font_size: float) -> list[str]:
    if not text:
        return [""]
    words = str(text).split()
    if not words:
        return [""]
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
            continue
        if current:
            lines.append(current)
            current = ""
        if stringWidth(word, font_name, font_size) <= max_width:
            current = word
            continue
        chunk = ""
        for ch in word:
            cand = chunk + ch
            if stringWidth(cand, font_name, font_size) <= max_width:
                chunk = cand
            else:
                if chunk:
                    lines.append(chunk)
                chunk = ch
        current = chunk
    if current:
        lines.append(current)
    return lines


def _parse_hex_color(value: str | None, fallback: colors.Color) -> colors.Color:
    raw = str(value or "").strip()
    if not raw:
        return fallback
    if not raw.startswith("#"):
        raw = f"#{raw}"
    if len(raw) != 7:
        return fallback
    try:
        int(raw[1:], 16)
    except ValueError:
        return fallback
    try:
        return colors.HexColor(raw)
    except Exception:
        return fallback


def _coerce_bool(value, default: bool = True) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    text = str(value).strip().lower()
    if text in {"1", "true", "yes", "on"}:
        return True
    if text in {"0", "false", "no", "off"}:
        return False
    return default


def _muted_color_from_main(main_color: colors.Color) -> colors.Color:
    red = float(getattr(main_color, "red", 0.06))
    green = float(getattr(main_color, "green", 0.1))
    blue = float(getattr(main_color, "blue", 0.18))
    luminance = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue)
    if luminance < 0.45:
        lift = 0.42
        return colors.Color(
            red + ((1 - red) * lift),
            green + ((1 - green) * lift),
            blue + ((1 - blue) * lift),
        )
    drop = 0.55
    return colors.Color(red * drop, green * drop, blue * drop)


def _center_text(
    pdf_canvas: canvas.Canvas,
    text: str,
    left: float,
    right: float,
    y: float,
    font_name: str,
    font_size: float,
    pad: float,
) -> None:
    max_width = max(0, (right - left) - (2 * pad))
    fitted = _fit_text(text, max_width, font_name, font_size)
    center_x = (left + right) / 2
    pdf_canvas.setFont(font_name, font_size)
    pdf_canvas.drawCentredString(center_x, y, fitted)


def _data_url_to_bytes(data_url: str | None) -> bytes | None:
    if not data_url:
        return None
    if not data_url.startswith("data:"):
        return None
    try:
        header, b64data = data_url.split(",", 1)
    except ValueError:
        return None
    if "base64" not in header:
        return None
    try:
        return base64.b64decode(b64data)
    except Exception:
        return None


def _draw_signature(
    pdf_canvas: canvas.Canvas,
    image_path: Path,
    data_url: str,
    x: float,
    y_center: float,
    max_width: float,
    max_height: float,
) -> None:
    image_bytes = _data_url_to_bytes(data_url)
    if image_bytes:
        try:
            img = ImageReader(BytesIO(image_bytes))
            img_w, img_h = img.getSize()
            scale = min(max_width / img_w, max_height / img_h)
            draw_w = img_w * scale
            draw_h = img_h * scale
            draw_x = x + (max_width - draw_w) / 2
            draw_y = y_center - (draw_h / 2)
            pdf_canvas.drawImage(
                img,
                draw_x,
                draw_y,
                width=draw_w,
                height=draw_h,
                mask="auto",
                preserveAspectRatio=True,
                anchor="c",
            )
            return
        except Exception:
            pass

    if image_path.exists():
        try:
            img = ImageReader(str(image_path))
            img_w, img_h = img.getSize()
            scale = min(max_width / img_w, max_height / img_h)
            draw_w = img_w * scale
            draw_h = img_h * scale
            draw_x = x + (max_width - draw_w) / 2
            draw_y = y_center - (draw_h / 2)
            pdf_canvas.drawImage(
                img,
                draw_x,
                draw_y,
                width=draw_w,
                height=draw_h,
                mask="auto",
                preserveAspectRatio=True,
                anchor="c",
            )
        except Exception:
            pass


def build_pdf(
    fields: dict,
    items: list[dict],
    signatures: dict | None = None,
    report_style: dict | None = None,
) -> bytes:
    report_style = report_style or {}
    density = str(report_style.get("density") or "normal").strip().lower()
    if density not in {"compact", "normal", "comfortable"}:
        density = "normal"

    table_theme = str(report_style.get("tableTheme") or "zebra").strip().lower()
    if table_theme not in {"zebra", "solid"}:
        table_theme = "zebra"

    title_align = str(report_style.get("titleAlign") or "center").strip().lower()
    if title_align not in {"center", "left"}:
        title_align = "center"

    try:
        font_scale = int(report_style.get("fontScale", 100))
    except (TypeError, ValueError):
        font_scale = 100
    font_scale = max(90, min(120, font_scale))
    font_factor = font_scale / 100.0
    density_factor_map = {"compact": 0.88, "normal": 1.0, "comfortable": 1.12}
    density_factor = density_factor_map.get(density, 1.0)
    title_text = str(report_style.get("titleText") or "").strip() or "PURCHASING ORDER"
    note_text = (
        str(report_style.get("noteText") or "").strip()
        or "Kindly present your offer for the following items:"
    )
    empty_items_text = str(report_style.get("emptyText") or "").strip() or "No items yet"
    form_label = str(report_style.get("formLabel") or "").strip() or "form no."
    date_label = str(report_style.get("dateLabel") or "").strip() or "Date"
    to_label = str(report_style.get("toLabel") or "").strip() or "To :"
    postal_label = str(report_style.get("postalLabel") or "").strip() or "POSTAL CODE :"
    show_row_number = _coerce_bool(report_style.get("showRowNumber"), True)
    show_signatures = _coerce_bool(report_style.get("showSignatures"), False)
    logo_data_url = str(report_style.get("logoDataUrl") or "").strip()
    signature_title = str(report_style.get("signatureTitle") or "").strip() or "Signature"
    sign_label_form_creator = (
        str(report_style.get("signLabelFormCreator") or "").strip() or "Form Creator"
    )
    sign_label_production_manager = (
        str(report_style.get("signLabelProductionManager") or "").strip()
        or "Production Manager"
    )
    sign_label_manager = str(report_style.get("signLabelManager") or "").strip() or "Manager"

    header_index = str(report_style.get("headIndex") or "").strip() or "#"
    header_model = str(report_style.get("headModel") or "").strip() or "NO (Model)"
    header_item = str(report_style.get("headItem") or "").strip() or "Item"
    header_qty = str(report_style.get("headQty") or "").strip() or "Qty"
    header_unit = str(report_style.get("headUnit") or "").strip() or "Unit"
    header_plan = str(report_style.get("headPlan") or "").strip() or "Plan No"
    show_logo = _coerce_bool(report_style.get("showLogo"), True)
    logo_align = str(report_style.get("logoAlign") or "left").strip().lower()
    if logo_align not in {"left", "center", "right"}:
        logo_align = "left"

    try:
        logo_scale = int(report_style.get("logoScale", 100))
    except (TypeError, ValueError):
        logo_scale = 100
    logo_scale = max(60, min(180, logo_scale))

    page_bg_color = _parse_hex_color(report_style.get("paperColor"), colors.HexColor("#FFFFFF"))
    text_main_color = _parse_hex_color(report_style.get("textColor"), colors.HexColor("#0F172A"))
    text_muted_color = _muted_color_from_main(text_main_color)
    table_outer_border_color = _parse_hex_color(
        report_style.get("tableBorderOuter"),
        colors.HexColor("#CBD5E1"),
    )
    table_inner_border_color = _parse_hex_color(
        report_style.get("tableBorderInner"),
        colors.HexColor("#E2E8F0"),
    )
    table_header_bg_color = _parse_hex_color(
        report_style.get("tableHeaderBg"),
        colors.HexColor("#0F172A"),
    )
    table_header_text_color = _parse_hex_color(
        report_style.get("tableHeaderText"),
        colors.HexColor("#FFFFFF"),
    )
    table_row_odd_bg = _parse_hex_color(
        report_style.get("tableRowOdd"),
        colors.HexColor("#FFFFFF"),
    )
    parsed_row_even = _parse_hex_color(
        report_style.get("tableRowEven"),
        colors.HexColor("#F8FAFC"),
    )
    table_row_even_bg = table_row_odd_bg if table_theme == "solid" else parsed_row_even

    page_w, page_h = A4
    margin_x = 36
    margin_y = 36
    band_height = 74
    header_gap = 12
    line_gap = 12 * font_factor
    title_font = 16 * font_factor
    body_font = 10 * font_factor
    small_font = 9 * font_factor

    items = [
        row
        for row in items
        if any(
            str(row.get(key, "")).strip()
            for key in ("model", "item", "qty", "unit", "plan")
        )
    ]
    signatures = signatures or {}

    table_width = page_w - (2 * margin_x)
    if show_row_number:
        table_columns = [
            {"key": "number", "label": header_index, "ratio": 0.06},
            {"key": "model", "label": header_model, "ratio": 0.18},
            {"key": "item", "label": header_item, "ratio": 0.40},
            {"key": "qty", "label": header_qty, "ratio": 0.10},
            {"key": "unit", "label": header_unit, "ratio": 0.10},
            {"key": "plan", "label": header_plan, "ratio": 0.16},
        ]
    else:
        table_columns = [
            {"key": "model", "label": header_model, "ratio": 0.20},
            {"key": "item", "label": header_item, "ratio": 0.44},
            {"key": "qty", "label": header_qty, "ratio": 0.11},
            {"key": "unit", "label": header_unit, "ratio": 0.10},
            {"key": "plan", "label": header_plan, "ratio": 0.15},
        ]

    col_widths = [table_width * col["ratio"] for col in table_columns]
    col_x = [margin_x]
    for width in col_widths:
        col_x.append(col_x[-1] + width)
    item_col_idx = next(
        (index for index, column in enumerate(table_columns) if column["key"] == "item"),
        1,
    )

    header_h = 26 * density_factor
    row_h = 24 * density_factor
    item_font_name = "Helvetica-Bold"
    item_font_size = body_font
    item_line_height = body_font + (4 * density_factor)
    max_item_lines = 10
    row_pad_v = 8 * density_factor
    sig_block_height = max(86, 90 * font_factor)
    sig_block_gap = 24
    sig_bottom_margin = 18

    overlay_buffer = BytesIO()
    pdf_canvas = canvas.Canvas(overlay_buffer, pagesize=A4)

    postal_code_value = str(fields.get("postalCode", "")).strip()
    postal_line = f"{postal_label} {postal_code_value}".strip()
    company_lines = [
        fields.get("companyName", ""),
        fields.get("companyLine1", ""),
        fields.get("companyLine2", ""),
        fields.get("companyLine3", ""),
        postal_line,
    ]
    company_lines = [line for line in company_lines if line]

    def header_bottom_y() -> float:
        top_y = page_h - margin_y
        band_bottom = top_y - band_height
        content_y = band_bottom - header_gap
        left_y = content_y
        if company_lines:
            left_y = content_y - (line_gap * len(company_lines))
        meta_y = content_y - (line_gap * 2)
        return min(left_y, meta_y) - 6

    def draw_header() -> float:
        top_y = page_h - margin_y
        band_bottom = top_y - band_height

        pdf_canvas.setFillColor(page_bg_color)
        pdf_canvas.setStrokeColor(page_bg_color)
        pdf_canvas.rect(
            margin_x,
            band_bottom,
            table_width,
            band_height,
            fill=1,
            stroke=1,
        )

        logo_right = margin_x
        if show_logo:
            try:
                logo = None
                logo_bytes = _data_url_to_bytes(logo_data_url)
                if logo_bytes:
                    logo = ImageReader(BytesIO(logo_bytes))
                elif LOGO_PATH.exists():
                    logo = ImageReader(str(LOGO_PATH))
                if logo is None:
                    raise ValueError("No logo source")
                logo_w, logo_h = logo.getSize()
                target_h = band_height - 6
                target_w = 132 * (logo_scale / 100.0)
                scale = min(target_w / logo_w, target_h / logo_h)
                draw_w = logo_w * scale
                draw_h = logo_h * scale
                if logo_align == "center":
                    draw_x = margin_x + ((table_width - draw_w) / 2)
                elif logo_align == "right":
                    draw_x = margin_x + table_width - draw_w - 8
                else:
                    draw_x = margin_x + 8
                logo_right = draw_x + draw_w
                pdf_canvas.drawImage(
                    logo,
                    draw_x,
                    band_bottom + (band_height - draw_h) / 2,
                    width=draw_w,
                    height=draw_h,
                    mask="auto",
                )
            except Exception:
                pass

        pdf_canvas.setFillColor(text_main_color)
        pdf_canvas.setFont("Helvetica-Bold", title_font)
        title_y = band_bottom + (band_height / 2) - (title_font / 2) + 4
        if title_align == "left":
            title_x = margin_x + 4
            if show_logo and logo_align == "left":
                title_x = max(title_x, logo_right + 12)
            max_title_width = max(20, (margin_x + table_width) - title_x - 4)
            fitted_title = _fit_text(title_text, max_title_width, "Helvetica-Bold", title_font)
            pdf_canvas.drawString(title_x, title_y, fitted_title)
        else:
            pdf_canvas.drawCentredString(
                page_w / 2,
                title_y,
                title_text,
            )

        content_y = band_bottom - header_gap

        left_y = content_y
        if company_lines:
            pdf_canvas.setFillColor(text_main_color)
            pdf_canvas.setFont("Helvetica-Bold", body_font)
            pdf_canvas.drawString(margin_x, left_y, company_lines[0])
            left_y -= line_gap
            pdf_canvas.setFont("Helvetica", small_font)
            for line in company_lines[1:]:
                pdf_canvas.drawString(margin_x, left_y, line)
                left_y -= line_gap

        meta_y = content_y
        form_no = fields.get("formNo", "")
        po_date = _format_date(fields.get("date", ""))
        pdf_canvas.setFillColor(text_main_color)
        pdf_canvas.setFont("Helvetica", small_font)
        pdf_canvas.drawRightString(
            page_w - margin_x,
            meta_y,
            f"{form_label} : {form_no}",
        )
        meta_y -= line_gap
        pdf_canvas.drawRightString(
            page_w - margin_x,
            meta_y,
            f"{date_label} : {po_date}",
        )

        return min(left_y, meta_y) - 6

    item_col_width = col_widths[item_col_idx] - 12

    def build_row_info(row: dict) -> dict:
        item_text = str(row.get("item", "") or "")
        lines = _wrap_text(item_text, item_col_width, item_font_name, item_font_size)
        if len(lines) > max_item_lines:
            lines = lines[:max_item_lines]
            lines[-1] = _fit_text(
                f"{lines[-1]}...",
                item_col_width,
                item_font_name,
                item_font_size,
            )
        text_height = len(lines) * item_line_height
        height = max(row_h, text_height + row_pad_v)
        return {"row": row, "lines": lines, "height": height}

    def row_text_y(row_bottom: float, font_size: float) -> float:
        return row_bottom + (row_h / 2) - (font_size * 0.35)

    def header_text_y(table_top: float, font_size: float) -> float:
        return (table_top - (header_h / 2)) - (font_size * 0.35)

    def draw_table(table_top: float, page_rows: list[dict], row_offset: int) -> float:
        total_height = sum(row["height"] for row in page_rows) if page_rows else row_h
        table_bottom_y = table_top - header_h - total_height

        # Header background
        pdf_canvas.setFillColor(table_header_bg_color)
        pdf_canvas.rect(
            margin_x,
            table_top - header_h,
            table_width,
            header_h,
            fill=1,
            stroke=0,
        )

        # Zebra rows
        y_cursor = table_top - header_h
        for idx, row_info in enumerate(page_rows):
            row_top = y_cursor
            row_bottom = row_top - row_info["height"]
            pdf_canvas.setFillColor(table_row_odd_bg if idx % 2 == 0 else table_row_even_bg)
            pdf_canvas.rect(
                margin_x,
                row_bottom,
                table_width,
                row_info["height"],
                fill=1,
                stroke=0,
            )
            y_cursor = row_bottom

        # Outer border
        pdf_canvas.setStrokeColor(table_outer_border_color)
        pdf_canvas.setLineWidth(1.0)
        pdf_canvas.rect(
            margin_x,
            table_bottom_y,
            table_width,
            header_h + total_height,
            fill=0,
            stroke=1,
        )

        # Inner grid (vertical + horizontal)
        pdf_canvas.setStrokeColor(table_inner_border_color)
        pdf_canvas.setLineWidth(0.75)
        for x in col_x[1:-1]:
            pdf_canvas.line(x, table_top, x, table_bottom_y)
        pdf_canvas.line(
            margin_x,
            table_top - header_h,
            margin_x + table_width,
            table_top - header_h,
        )

        y_cursor = table_top - header_h
        for row_info in page_rows:
            y_cursor -= row_info["height"]
            pdf_canvas.line(margin_x, y_cursor, margin_x + table_width, y_cursor)
        if not page_rows:
            pdf_canvas.line(
                margin_x,
                table_top - header_h - row_h,
                margin_x + table_width,
                table_top - header_h - row_h,
            )

        pdf_canvas.setFillColor(table_header_text_color)
        headers = [column["label"] for column in table_columns]
        header_y = header_text_y(table_top, small_font)
        for i, title in enumerate(headers):
            _center_text(
                pdf_canvas,
                title,
                col_x[i],
                col_x[i + 1],
                header_y,
                "Helvetica-Bold",
                small_font,
                4,
            )

        if not page_rows:
            pdf_canvas.setFillColor(text_muted_color)
            row_bottom = table_top - header_h - row_h
            row_y = row_text_y(row_bottom, body_font)
            _center_text(
                pdf_canvas,
                empty_items_text,
                col_x[0],
                col_x[-1],
                row_y,
                "Helvetica",
                body_font,
                6,
            )
            return table_bottom_y

        pdf_canvas.setFillColor(text_main_color)
        for idx, row_info in enumerate(page_rows):
            row_top = table_top - header_h - sum(r["height"] for r in page_rows[:idx])
            row_bottom = row_top - row_info["height"]
            row_center_y = row_bottom + (row_info["height"] / 2) - (body_font * 0.35)

            for i, column in enumerate(table_columns):
                col_key = column["key"]
                if col_key == "item":
                    continue
                if col_key == "number":
                    value = str(row_offset + idx + 1)
                else:
                    value = str(row_info["row"].get(col_key, ""))
                _center_text(
                    pdf_canvas,
                    value,
                    col_x[i],
                    col_x[i + 1],
                    row_center_y,
                    "Helvetica-Bold",
                    body_font,
                    6,
                )

            lines = row_info["lines"]
            text_height = len(lines) * item_line_height
            start_y = row_bottom + (row_info["height"] - text_height) / 2 + (
                item_line_height - item_font_size
            ) / 2
            for line_idx, line in enumerate(lines):
                line_y = start_y + (line_idx * item_line_height)
                _center_text(
                    pdf_canvas,
                    line,
                    col_x[item_col_idx],
                    col_x[item_col_idx + 1],
                    line_y,
                    item_font_name,
                    item_font_size,
                    6,
                )

        return table_bottom_y

    def draw_signatures_block(block_top: float) -> None:
        col_width = table_width / 3
        sig_block_top = block_top
        sig_block_bottom = sig_block_top - sig_block_height
        heading_y = sig_block_top - 8
        label_y = heading_y - 16
        name_y = label_y - 14
        sig_box_top = name_y - 6
        sig_box_bottom = sig_block_bottom + 8
        sig_box_height = max(sig_box_top - sig_box_bottom, 12)

        pdf_canvas.setStrokeColor(table_outer_border_color)
        pdf_canvas.setLineWidth(1)

        labels = [
            (sign_label_form_creator, fields.get("formCreator", ""), "form_creator"),
            (
                sign_label_production_manager,
                fields.get("productionManager", ""),
                "production_manager",
            ),
            (sign_label_manager, fields.get("manager", ""), "manager"),
        ]

        pdf_canvas.setFillColor(text_main_color)
        pdf_canvas.setFont("Helvetica-Bold", body_font)
        pdf_canvas.drawCentredString(margin_x + (table_width / 2), heading_y, signature_title)

        for idx, (label, name, key) in enumerate(labels):
            col_left = margin_x + (idx * col_width)
            col_right = col_left + col_width
            inner_left = col_left + 6
            inner_right = col_right - 6
            pdf_canvas.setFillColor(text_main_color)
            _center_text(
                pdf_canvas,
                label,
                inner_left,
                inner_right,
                label_y,
                "Helvetica-Bold",
                small_font,
                2,
            )

            name_line = _fit_text(name or "", inner_right - inner_left, "Helvetica", small_font)
            _center_text(
                pdf_canvas,
                name_line,
                inner_left,
                inner_right,
                name_y,
                "Helvetica",
                small_font,
                2,
            )

            sig_x = col_left + 6
            sig_center_y = (sig_box_bottom + sig_box_top) / 2
            sig_w = col_width - 12
            sig_h = sig_box_height
            _draw_signature(
                pdf_canvas,
                SIGNATURES[key],
                signatures.get(
                    "formCreator" if key == "form_creator" else
                    "productionManager" if key == "production_manager" else
                    "manager",
                    "",
                ),
                sig_x,
                sig_center_y,
                sig_w,
                sig_h,
            )

    table_top_first = header_bottom_y() - 6 - 16 - 16
    table_top_plain = page_h - margin_y - 10
    table_bottom_full = margin_y + 10
    table_bottom_last = (
        margin_y + sig_bottom_margin + sig_block_height + sig_block_gap
        if show_signatures
        else table_bottom_full
    )
    available_first = table_top_first - table_bottom_full - header_h
    available_plain = table_top_plain - table_bottom_full - header_h
    available_last_first = table_top_first - table_bottom_last - header_h
    available_last_plain = table_top_plain - table_bottom_last - header_h
    available_for_lines = min(available_last_first, available_last_plain)
    if available_for_lines > 0:
        max_item_lines = max(
            max_item_lines,
            min(40, int((available_for_lines - row_pad_v) / item_line_height)),
        )

    row_infos = [build_row_info(row) for row in items]

    def paginate(rows: list[dict], capacity: float) -> list[list[dict]]:
        pages: list[list[dict]] = []
        i = 0
        while i < len(rows):
            remaining = capacity
            page: list[dict] = []
            while i < len(rows) and rows[i]["height"] <= remaining:
                page.append(rows[i])
                remaining -= rows[i]["height"]
                i += 1
            if not page and i < len(rows):
                page.append(rows[i])
                i += 1
            pages.append(page)
        return pages

    def paginate_rows(rows: list[dict]) -> list[list[dict]]:
        if not rows:
            return [[]]
        pages: list[list[dict]] = []
        i = 0

        remaining = available_first
        page: list[dict] = []
        while i < len(rows) and rows[i]["height"] <= remaining:
            page.append(rows[i])
            remaining -= rows[i]["height"]
            i += 1
        if not page and i < len(rows):
            page.append(rows[i])
            i += 1
        pages.append(page)

        while i < len(rows):
            remaining = available_plain
            page = []
            while i < len(rows) and rows[i]["height"] <= remaining:
                page.append(rows[i])
                remaining -= rows[i]["height"]
                i += 1
            if not page and i < len(rows):
                page.append(rows[i])
                i += 1
            pages.append(page)
        return pages

    pages = paginate_rows(row_infos)
    if pages:
        last_page = pages[-1]
        last_capacity = available_last_first if len(pages) == 1 else available_last_plain
        last_height = sum(row["height"] for row in last_page)
        if last_height > last_capacity:
            overflow = last_height - last_capacity
            moved_height = 0.0
            new_page: list[dict] = []
            while last_page and moved_height < overflow:
                row_info = last_page.pop()
                new_page.insert(0, row_info)
                moved_height += row_info["height"]
            if not last_page:
                pages[-1] = new_page
            else:
                pages.append(new_page)

    total_pages = len(pages)
    row_offset = 0

    for page_index, page_rows in enumerate(pages):
        is_last_page = page_index == total_pages - 1
        pdf_canvas.setFillColor(page_bg_color)
        pdf_canvas.rect(0, 0, page_w, page_h, fill=1, stroke=0)

        if page_index == 0:
            header_bottom = draw_header()
            to_y = header_bottom - 6
            pdf_canvas.setFillColor(text_main_color)
            pdf_canvas.setFont("Helvetica-Bold", body_font)
            pdf_canvas.drawString(margin_x, to_y, to_label)
            label_w = stringWidth(to_label, "Helvetica-Bold", body_font)
            pdf_canvas.setFont("Helvetica", body_font)
            pdf_canvas.drawString(margin_x + label_w + 6, to_y, fields.get("to", ""))

            note_y = to_y - 16
            pdf_canvas.setFillColor(text_muted_color)
            pdf_canvas.setFont("Helvetica", small_font)
            pdf_canvas.drawString(
                margin_x,
                note_y,
                note_text,
            )
            table_top = note_y - 16
        else:
            table_top = table_top_plain

        table_bottom_y = draw_table(table_top, page_rows, row_offset)
        row_offset += len(page_rows)

        if is_last_page and show_signatures:
            sig_top = table_bottom_y - sig_block_gap
            draw_signatures_block(sig_top)

        pdf_canvas.setFont("Helvetica", 8)
        pdf_canvas.setFillColor(text_muted_color)
        pdf_canvas.drawRightString(
            page_w - margin_x,
            margin_y / 2,
            f"Page {page_index + 1}/{total_pages}",
        )
        pdf_canvas.showPage()

    pdf_canvas.save()
    overlay_buffer.seek(0)
    return overlay_buffer.read()
