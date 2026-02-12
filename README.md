# PO Management System (Python, Offline)

This is a local, offline-ready PO management system built with Python + Flask. It uses SQLite by default and can use PostgreSQL if you set `DATABASE_URL`. It provides instant preview, saving/loading, and PDF export using the `PO.pdf` template.

## Architecture

- App factory: `po_app/__init__.py`
- OOP config object: `po_app/config.py` (`AppSettings`)
- OOP DB manager: `po_app/db.py` (`DatabaseManager`)
- OOP repositories:
  - `po_app/services/po_repository.py` (`PORepository`)
  - `po_app/services/auth_repository.py` (`AuthRepository`)
- OOP maintenance services:
  - `po_app/services/maintenance.py` (`BackupService`, `PackageUpdateService`)
- OOP auth/session services:
  - `po_app/services/auth_flow.py` (`PasskeyRepository`, `AuthFlowService`)
- API routes: `po_app/routes/api.py`
- Main UI route: `po_app/routes/main.py`
- Frontend: `templates/index.html`, `static/app.js`, `static/styles.css`

## Run

1. Install dependencies:

```bash
python -m pip install -r requirements.txt
```

2. Start the server (SQLite default):

```bash
python app.py
```

Default bind values are configurable through env:
- `HOST` (default `0.0.0.0`)
- `PORT` (default `5000`)

3. Optional: use PostgreSQL instead of SQLite:

```bash
$env:DATABASE_URL="postgresql://user:password@localhost:5432/po_db"
python app.py
```

4. Auto-load PostgreSQL (no typing each time):
   - Copy `.env.example` to `.env` and replace `YOUR_PASSWORD`:

```text
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/po_db
SECRET_KEY=change-this-to-a-long-random-secret
PASSKEY_RP_NAME=PO Management
PASSKEY_RP_ID=localhost
```

Then just run:

```bash
python app.py
```

5. Open in your browser:

```text
http://127.0.0.1:5000
```

## GitHub Pages Demo (Static)

This repo includes a static demo in `docs/` that can be hosted on GitHub Pages.
It shows the main PO form UI and live preview only (no backend, no database, no save API).

1. Push your repository to GitHub.
2. In GitHub: `Settings` -> `Pages`.
3. Under `Build and deployment`:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` (or your default branch)
   - `Folder`: `/docs`
4. Save and wait for deployment.
5. Open your demo URL:

```text
https://<your-username>.github.io/<your-repo-name>/
```

Important:
- Frontend code on GitHub Pages is always downloadable/viewable by visitors.
- Do not put secrets in `docs/` files.
- Keep real backend/auth/database logic only in server-side code (not GitHub Pages).

## Share With Friend (Windows One-Click)

If you want your friend to run this project quickly:

1. Send the project folder as a zip file.
2. Tell your friend to extract it and double-click:

```text
run_website.bat
```

If launched without arguments, `run_website.bat` shows an interactive menu (start/check/fallback/env options).
The menu also includes an option to install Python via `winget` if Python is missing.
The menu also includes option `10` to install PostgreSQL and configure local `DATABASE_URL` in `.env`.

The launcher will:
- detect Python
- create `.venv` automatically
- install requirements only when needed (first run or when requirements/Python version changed)
- create `.env` automatically (if missing)
- start the website

Useful flags:

```text
run_website.bat -SkipInstall
run_website.bat -ForceInstall
run_website.bat -PersistCliEnv
run_website.bat -AllowSqliteFallback
```

- `-SkipInstall`: skip dependency installation
- `-ForceInstall`: always reinstall dependencies
- `-PersistCliEnv`: save `PO_HOME`, `PO_VENV`, and add `.venv\Scripts` to user `PATH` for easier CLI usage
- `-AllowSqliteFallback`: if PostgreSQL is configured but unreachable, run temporarily with SQLite

PostgreSQL note:
- If `DATABASE_URL=postgresql://...` is set, launcher now requires PostgreSQL to be reachable and will stop with an error when it is not reachable.

### Required software on your friend's PC

- Windows 10/11
- Python 3.9+ (recommended 3.10+)
- Internet connection (first run only, for `pip install`)
- Browser (Chrome/Edge/Firefox)

Optional:
- PostgreSQL (only if they want `DATABASE_URL=postgresql://...`; otherwise it runs with SQLite automatically)

If Python is missing, install it first:

```powershell
winget install -e --id Python.Python.3.11
```

## Production / Hosting

For Linux hosting behind a reverse proxy:

```bash
gunicorn -c gunicorn.conf.py wsgi:app
```

Or use the included `Procfile`:

```text
web: gunicorn -c gunicorn.conf.py wsgi:app
```

For Windows service hosting:

```bash
waitress-serve --host=0.0.0.0 --port=8000 wsgi:app
```

Recommended production env:

```env
APP_ENV=production
SECRET_KEY=long-random-secret
SESSION_COOKIE_SECURE=1
SESSION_COOKIE_SAMESITE=Lax
TRUST_PROXY_HEADERS=1
PASSKEY_RP_ID=your-domain.com
HOST=0.0.0.0
PORT=8000
```

## Tests

Run API smoke tests:

```bash
pytest -q
```

## Passkeys (WebAuthn)

- Passkey auth is enabled for all PO API routes.
- On first launch, creating the first passkey requires `FIRST_ADMIN_SETUP_CODE` from `.env`.
- After first passkey is created, further registration requires an authenticated session.
- Open with `http://localhost:5000` for passkeys.
- `127.0.0.1` and custom IP domains can trigger "invalid domain" in WebAuthn.
- For production, use HTTPS and set `PASSKEY_RP_ID` to your real domain.

## Maintenance (Backups + Updates)

- Database Tools modal now includes:
  - Create/restore backups
  - Auto-backup status
  - Python package update check/apply
- Auto-backup runs on successful save when due.

Environment options:

```env
AUTO_BACKUP_ENABLED=1
AUTO_BACKUP_INTERVAL_HOURS=24
AUTO_BACKUP_RETENTION_DAYS=30
```

- Keep OS updates enabled on the host machine (Windows Update / Linux package updates).
- After applying Python updates from the UI, restart the app service.

## Data

Saved records are stored in SQLite by default (`po.db`). Configure PostgreSQL with `DATABASE_URL` if you want a server database.

## PDF Template

The server-side export uses `PO.pdf` as the background template. Place your blank form at the project root with that filename.
If a logo exists at `static/img/po.jpg`, it will be embedded in the export.
The border grid is drawn by the app to match your original template, so `PO.pdf` should be blank.

## Signatures

Place optional signature images here (PNG recommended, transparent background):
- `static/img/signatures/form_creator.png`
- `static/img/signatures/production_manager.png`
- `static/img/signatures/manager.png`

You can draw live signatures beside each name; those are saved with the PO and used in the export.

## Files

- `app.py` (entry point)
- `wsgi.py` (WSGI entry point for hosting)
- `gunicorn.conf.py` (gunicorn production config)
- `po_app/` (application package)
- `po_app/services/auth_flow.py` (auth/session/login-approval services)
- `po_app/services/maintenance.py` (backup/update services)
- `tests/test_api_smoke.py` (API smoke tests)
- `templates/index.html`
- `static/styles.css`
- `static/app.js`

## DB Scripts

Backup:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup_db.ps1
```

List backups:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore_db.ps1 -ListOnly
```

Restore latest:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore_db.ps1 -Latest
```
