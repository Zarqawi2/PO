from __future__ import annotations

import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from ..db import iso


class MaintenanceError(RuntimeError):
    pass


class BackupValidationError(ValueError):
    pass


class MaintenanceScriptRunner:
    def __init__(self, *, base_dir: Path, script_dir: Path):
        self._base_dir = base_dir
        self._script_dir = script_dir
        self._powershell = ""

    def _resolve_powershell(self) -> str:
        if self._powershell:
            return self._powershell
        for candidate in ("powershell.exe", "powershell", "pwsh.exe", "pwsh"):
            if shutil.which(candidate):
                self._powershell = candidate
                return candidate
        raise MaintenanceError("PowerShell was not found on this server")

    @staticmethod
    def _combine_output(stdout: str, stderr: str) -> str:
        return "\n".join(
            part.strip() for part in (stdout, stderr) if part and part.strip()
        ).strip()

    def run_script(self, script_name: str, args: list[str] | None = None) -> tuple[int, str]:
        script_path = self._script_dir / script_name
        if not script_path.exists():
            raise MaintenanceError(f"Missing script: {script_name}")
        command = [
            self._resolve_powershell(),
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(script_path),
            "-ProjectRoot",
            str(self._base_dir),
        ]
        if args:
            command.extend(args)
        process = subprocess.run(
            command,
            cwd=str(self._base_dir),
            capture_output=True,
            text=True,
            check=False,
        )
        return process.returncode, self._combine_output(process.stdout, process.stderr)

    def run_python(self, args: list[str], timeout_seconds: int = 900) -> tuple[int, str]:
        process = subprocess.run(
            [sys.executable, *args],
            cwd=str(self._base_dir),
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            check=False,
        )
        return process.returncode, self._combine_output(process.stdout, process.stderr)


class BackupService:
    def __init__(
        self,
        *,
        backup_dir: Path,
        runner: MaintenanceScriptRunner,
        auto_backup_enabled: bool,
        auto_backup_interval_hours: int,
        auto_backup_retention_days: int,
    ):
        self._backup_dir = backup_dir
        self._runner = runner
        self._auto_backup_enabled = auto_backup_enabled
        self._auto_backup_interval_hours = auto_backup_interval_hours
        self._auto_backup_retention_days = auto_backup_retention_days

    def safe_backup_name(self, file_name: str) -> str:
        clean_name = Path(file_name).name
        if clean_name != file_name:
            raise BackupValidationError("Invalid backup file name")
        if not clean_name.lower().endswith(".dump"):
            raise BackupValidationError("Backup file must end with .dump")
        return clean_name

    def list_backup_files(self) -> list[dict[str, object]]:
        self._backup_dir.mkdir(parents=True, exist_ok=True)
        result: list[dict[str, object]] = []
        for file_path in sorted(
            self._backup_dir.glob("*.dump"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        ):
            stat = file_path.stat()
            updated_at = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
            result.append(
                {
                    "name": file_path.name,
                    "size": stat.st_size,
                    "updated_at": iso(updated_at),
                    "updated_ts": stat.st_mtime,
                }
            )
        return result

    def list_backups_payload(self) -> dict[str, object]:
        backups = self.list_backup_files()
        public_backups = [
            {"name": item["name"], "size": item["size"], "updated_at": item["updated_at"]}
            for item in backups
        ]
        last_backup = public_backups[0]["updated_at"] if public_backups else ""
        return {
            "backups": public_backups,
            "auto_backup": {
                "enabled": self._auto_backup_enabled,
                "interval_hours": self._auto_backup_interval_hours,
                "retention_days": self._auto_backup_retention_days,
                "last_backup_at": last_backup,
            },
        }

    def prune_old_backups(self, retention_days: int | None = None) -> int:
        days = self._auto_backup_retention_days if retention_days is None else retention_days
        if days <= 0:
            return 0
        now_ts = datetime.now(timezone.utc).timestamp()
        cutoff_ts = now_ts - (days * 86400)
        removed = 0
        for file_path in self._backup_dir.glob("*.dump"):
            try:
                if file_path.stat().st_mtime < cutoff_ts:
                    file_path.unlink(missing_ok=True)
                    removed += 1
            except Exception:
                continue
        return removed

    def run_auto_backup_if_due(self) -> dict[str, object]:
        if not self._auto_backup_enabled:
            return {"ran": False, "reason": "disabled"}
        backups = self.list_backup_files()
        now_ts = datetime.now(timezone.utc).timestamp()
        interval_seconds = self._auto_backup_interval_hours * 3600
        if backups:
            latest_ts = float(backups[0]["updated_ts"])
            if (now_ts - latest_ts) < interval_seconds:
                return {"ran": False, "reason": "not_due"}
        try:
            code, output = self._runner.run_script("backup_db.ps1")
        except MaintenanceError:
            return {"ran": False, "reason": "script_error"}
        if code != 0:
            return {"ran": False, "reason": "backup_failed", "output": output}
        removed = self.prune_old_backups()
        return {"ran": True, "removed_old": removed}

    def create_backup(self) -> dict[str, object]:
        code, output = self._runner.run_script("backup_db.ps1")
        if code != 0:
            raise MaintenanceError(output or "Backup failed")
        self.prune_old_backups()
        created_file = ""
        for line in output.splitlines():
            marker = "Backup created:"
            if marker in line:
                created_file = Path(line.split(marker, 1)[1].strip()).name
                break
        if not created_file:
            latest = sorted(self._backup_dir.glob("*.dump"), key=lambda p: p.stat().st_mtime, reverse=True)
            if latest:
                created_file = latest[0].name
        return {"ok": True, "file": created_file, "output": output}

    def restore_backup(self, file_name: str) -> dict[str, object]:
        safe_name = self.safe_backup_name(str(file_name or "").strip())
        backup_path = self._backup_dir / safe_name
        if not backup_path.exists():
            raise FileNotFoundError("Backup file not found")
        code, output = self._runner.run_script(
            "restore_db.ps1",
            ["-BackupFile", safe_name, "-Force"],
        )
        if code != 0:
            raise MaintenanceError(output or "Restore failed")
        return {"ok": True, "file": safe_name, "output": output}

    def delete_backup(self, file_name: str) -> dict[str, object]:
        raw_name = str(file_name or "").strip()
        if not raw_name:
            raise BackupValidationError("Backup file is required")
        safe_name = self.safe_backup_name(raw_name)
        backup_path = self._backup_dir / safe_name
        if not backup_path.exists():
            raise FileNotFoundError("Backup file not found")
        try:
            backup_path.unlink()
        except OSError as exc:
            raise MaintenanceError("Could not delete backup file") from exc
        return {"ok": True, "file": safe_name}


class PackageUpdateService:
    def __init__(self, *, runner: MaintenanceScriptRunner):
        self._runner = runner
        self._runtime_packages = {
            "flask",
            "werkzeug",
            "jinja2",
            "click",
            "itsdangerous",
            "blinker",
        }

    @staticmethod
    def _normalize_rows(rows: object) -> list[dict[str, str]]:
        if not isinstance(rows, list):
            return []
        clean: list[dict[str, str]] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            name = str(row.get("name", "")).strip()
            if not name:
                continue
            clean.append(
                {
                    "name": name,
                    "version": str(row.get("version", "")),
                    "latest_version": str(row.get("latest_version", "")),
                }
            )
        return clean

    def collect_outdated(self) -> tuple[list[dict[str, str]] | None, str]:
        code, output = self._runner.run_python(["-m", "pip", "list", "--outdated", "--format=json"])
        if code != 0:
            return None, output or "Failed to check updates"
        try:
            rows = json.loads(output or "[]")
        except json.JSONDecodeError:
            rows = []
        return self._normalize_rows(rows), ""

    def check_updates(self) -> dict[str, object]:
        clean_rows, error = self.collect_outdated()
        if clean_rows is None:
            raise MaintenanceError(error)
        return {
            "python": sys.version.split()[0],
            "outdated_count": len(clean_rows),
            "outdated": clean_rows,
        }

    def apply_updates(self, *, upgrade_pip: bool = True, upgrade_requirements: bool = True) -> dict[str, object]:
        outputs: list[str] = []
        if upgrade_pip:
            code, out = self._runner.run_python(["-m", "pip", "install", "--upgrade", "pip"])
            outputs.append(out or "pip upgrade finished")
            if code != 0:
                raise MaintenanceError(out or "pip upgrade failed")

        outdated, error = self.collect_outdated()
        if outdated is None:
            raise MaintenanceError(error)

        package_names = [row["name"] for row in outdated if row["name"].lower() != "pip"]
        non_runtime = [name for name in package_names if name.lower() not in self._runtime_packages]
        runtime = [name for name in package_names if name.lower() in self._runtime_packages]
        ordered_packages = [*non_runtime, *runtime]
        updated_count = 0

        if ordered_packages and upgrade_requirements:
            code, out = self._runner.run_python(
                ["-m", "pip", "install", "--upgrade", *ordered_packages],
                timeout_seconds=1800,
            )
            outputs.append(out or f"Upgraded {len(ordered_packages)} package(s)")
            if code != 0:
                raise MaintenanceError(out or "package upgrade failed")
            updated_count = len(ordered_packages)
        else:
            outputs.append("No package updates available.")

        remaining, _ = self.collect_outdated()
        if remaining is None:
            remaining = []
        remaining = [row for row in remaining if row["name"].lower() != "pip"]
        return {
            "ok": True,
            "message": "Update completed",
            "updated_count": updated_count,
            "remaining_count": len(remaining),
            "remaining": remaining[:20],
            "output": "\n\n".join(outputs),
        }
