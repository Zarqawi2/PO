param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [switch]$SkipInstall,
  [switch]$ForceInstall,
  [switch]$PersistCliEnv,
  [switch]$AllowSqliteFallback,
  [switch]$NoBrowser,
  [switch]$CheckOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$POSTGRES_FAILURE_EXIT_CODE = 31

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function New-RandomToken {
  param([int]$Length = 64)
  $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  $builder = New-Object System.Text.StringBuilder
  for ($i = 0; $i -lt $Length; $i++) {
    $idx = Get-Random -Minimum 0 -Maximum $chars.Length
    [void]$builder.Append($chars[$idx])
  }
  return $builder.ToString()
}

function Read-EnvFile {
  param([string]$Path)
  $map = @{}
  if (-not (Test-Path $Path)) {
    return $map
  }
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) {
      return
    }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) {
      return
    }
    $key = $line.Substring(0, $idx).Trim()
    $key = $key.Trim([char]0xFEFF)
    $value = $line.Substring($idx + 1).Trim()
    $map[$key] = $value
  }
  return $map
}

function Set-SessionCliEnvironment {
  param(
    [string]$ProjectRootPath,
    [string]$VenvDirPath
  )
  $scriptsDir = Join-Path $VenvDirPath "Scripts"
  $env:PO_HOME = $ProjectRootPath
  $env:PO_VENV = $VenvDirPath
  $env:VIRTUAL_ENV = $VenvDirPath
  $env:PYTHONUTF8 = "1"
  if ($env:PATH -notlike "*$scriptsDir*") {
    $env:PATH = "$scriptsDir;$env:PATH"
  }
}

function Ensure-UserPathEntry {
  param([string]$PathEntry)
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $parts = @()
  if ($userPath) {
    $parts = $userPath.Split(";") | ForEach-Object { $_.Trim() } | Where-Object { $_ }
  }
  if ($parts -contains $PathEntry) {
    return $false
  }
  $newPath = if ([string]::IsNullOrWhiteSpace($userPath)) { $PathEntry } else { "$userPath;$PathEntry" }
  [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
  return $true
}

function Find-Python {
  function Test-PythonCandidate {
    param(
      [string]$ExePath,
      [string[]]$PrefixArgs = @()
    )

    try {
      $args = @($PrefixArgs + @("--version"))
      $versionLine = (& $ExePath @args 2>&1 | Select-Object -First 1).ToString()
      if ($LASTEXITCODE -ne 0) {
        return $null
      }
      if ($versionLine -notmatch "Python\s+\d+\.\d+\.\d+") {
        return $null
      }
      return [PSCustomObject]@{
        Exe = $ExePath
        PrefixArgs = $PrefixArgs
      }
    } catch {
      return $null
    }
  }

  $py = Get-Command py -ErrorAction SilentlyContinue
  if ($py) {
    $validPy = Test-PythonCandidate -ExePath $py.Source -PrefixArgs @("-3")
    if ($validPy) {
      return $validPy
    }
  }

  $python = Get-Command python -ErrorAction SilentlyContinue
  if ($python) {
    $validPython = Test-PythonCandidate -ExePath $python.Source -PrefixArgs @()
    if ($validPython) {
      return $validPython
    }
  }

  return $null
}

function Invoke-Checked {
  param(
    [string]$Exe,
    [string[]]$ArgumentList,
    [string]$ErrorText
  )
  & $Exe @ArgumentList
  if ($LASTEXITCODE -ne 0) {
    throw "$ErrorText (exit code $LASTEXITCODE)."
  }
}

function Test-TcpPort {
  param(
    [string]$ComputerName,
    [int]$Port,
    [int]$TimeoutMs = 1200
  )

  try {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
      $iar = $client.BeginConnect($ComputerName, $Port, $null, $null)
      if (-not $iar.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) {
        return $false
      }
      $client.EndConnect($iar) | Out-Null
      return $client.Connected
    } finally {
      $client.Dispose()
    }
  } catch {
    return $false
  }
}

function Is-LocalDbHost {
  param([string]$HostName)
  $hostText = [string]$HostName
  return $hostText -in @("127.0.0.1", "localhost", "::1", "[::1]")
}

function Try-StartLocalPostgresService {
  param(
    [string]$DbHost,
    [int]$DbPort
  )

  if (-not (Is-LocalDbHost -HostName $DbHost)) {
    return $false
  }

  $services = @()
  try {
    $services = @(Get-Service -ErrorAction Stop | Where-Object {
      $_.Name -like "postgresql*" -or $_.DisplayName -like "*PostgreSQL*"
    })
  } catch {
    return $false
  }

  if (-not $services -or $services.Count -eq 0) {
    return $false
  }

  $startedAny = $false
  foreach ($svc in $services) {
    if ($svc.Status -eq "Running") {
      continue
    }
    try {
      Start-Service -Name $svc.Name -ErrorAction Stop
      $startedAny = $true
    } catch {
      # Ignore individual service start failures; try other service names.
    }
  }

  if (-not $startedAny) {
    return $false
  }

  for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Milliseconds 600
    if (Test-TcpPort -ComputerName $DbHost -Port $DbPort) {
      return $true
    }
  }
  return $false
}

function Test-PostgresQuery {
  param(
    [string]$PythonExe,
    [string]$DatabaseUrl,
    [ref]$FailureReason
  )

  $FailureReason.Value = ""
  $tmpBase = "po_pgcheck_" + [Guid]::NewGuid().ToString("N")
  $tmpScript = Join-Path ([System.IO.Path]::GetTempPath()) ($tmpBase + ".py")
  $checkScript = @'
import sys

url = sys.argv[1]
try:
    import psycopg
except Exception as exc:
    print("psycopg import failed: " + str(exc))
    sys.exit(3)

try:
    conn = psycopg.connect(url, connect_timeout=4)
    with conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
except Exception as exc:
    print(str(exc))
    sys.exit(2)

print("ok")
'@

  try {
    Set-Content -Path $tmpScript -Value $checkScript -Encoding UTF8
    # Use call operator so paths containing spaces are passed safely as arguments.
    $outputLines = & $PythonExe @($tmpScript, $DatabaseUrl) 2>&1
    $exitCode = $LASTEXITCODE
    if ($null -eq $outputLines) {
      $output = ""
    } else {
      $output = (($outputLines | ForEach-Object { $_.ToString().Trim() }) | Where-Object { $_ }) -join [Environment]::NewLine
    }
  } finally {
    Remove-Item -Path $tmpScript -Force -ErrorAction SilentlyContinue
  }

  if ($exitCode -eq 0) {
    return $true
  }

  $reason = [string]$output
  if ([string]::IsNullOrWhiteSpace($reason)) {
    $reason = "Authentication or database validation failed."
  }
  $FailureReason.Value = $reason
  return $false
}

function Ensure-PostgresDatabaseExists {
  param(
    [string]$PythonExe,
    [string]$DatabaseUrl,
    [string]$ProjectRootPath,
    [ref]$FailureReason
  )

  $FailureReason.Value = ""
  $tmpBase = "po_pgensuredb_" + [Guid]::NewGuid().ToString("N")
  $tmpScript = Join-Path ([System.IO.Path]::GetTempPath()) ($tmpBase + ".py")
  $checkScript = @'
import os
import sys
from urllib.parse import urlparse, urlunparse

url = sys.argv[1]

try:
    import psycopg
except Exception as exc:
    print("psycopg import failed: " + str(exc))
    sys.exit(3)

try:
    target = urlparse(url)
    if target.scheme.lower() != "postgresql":
        print("DATABASE_URL must start with postgresql://")
        sys.exit(4)
except Exception as exc:
    print("Invalid DATABASE_URL: " + str(exc))
    sys.exit(4)

try:
    with psycopg.connect(url, connect_timeout=4) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
    print("ok")
    sys.exit(0)
except Exception as exc:
    text = str(exc)
    missing_db = ("does not exist" in text.lower() and "database" in text.lower())
    if not missing_db:
        print(text)
        sys.exit(2)

try:
    admin_url = urlunparse((
        target.scheme,
        target.netloc,
        "/postgres",
        "",
        target.query or "",
        "",
    ))
    db_name = target.path.lstrip("/")
    if not db_name:
        print("Target database name is missing in DATABASE_URL.")
        sys.exit(5)

    with psycopg.connect(admin_url, connect_timeout=4, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
            exists = cur.fetchone()
            if not exists:
                safe_db = db_name.replace('"', '""')
                cur.execute(f'CREATE DATABASE "{safe_db}"')
    print("created_or_exists")
except Exception as exc:
    print("Failed to auto-create DB: " + str(exc))
    sys.exit(6)

try:
    with psycopg.connect(url, connect_timeout=4) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
    print("ok")
    sys.exit(0)
except Exception as exc:
    print(str(exc))
    sys.exit(2)
'@

  try {
    Set-Content -Path $tmpScript -Value $checkScript -Encoding UTF8
    $outputLines = & $PythonExe @($tmpScript, $DatabaseUrl) 2>&1
    $exitCode = $LASTEXITCODE
    if ($null -eq $outputLines) {
      $output = ""
    } else {
      $output = (($outputLines | ForEach-Object { $_.ToString().Trim() }) | Where-Object { $_ }) -join [Environment]::NewLine
    }
  } finally {
    Remove-Item -Path $tmpScript -Force -ErrorAction SilentlyContinue
  }

  if ($exitCode -eq 0) {
    return $true
  }

  $reason = [string]$output
  if ([string]::IsNullOrWhiteSpace($reason)) {
    $reason = "Automatic PostgreSQL database check/bootstrap failed."
  }
  $FailureReason.Value = $reason
  return $false
}

function Ensure-PostgresSchema {
  param(
    [string]$PythonExe,
    [string]$DatabaseUrl,
    [string]$ProjectRootPath,
    [ref]$FailureReason
  )

  $FailureReason.Value = ""
  $tmpBase = "po_pgschema_" + [Guid]::NewGuid().ToString("N")
  $tmpScript = Join-Path ([System.IO.Path]::GetTempPath()) ($tmpBase + ".py")
  $schemaScript = @'
import os
import sys

db_url = sys.argv[1]
project_root = sys.argv[2]
sys.path.insert(0, project_root)
os.environ["DATABASE_URL"] = db_url

from po_app.db import init_db

init_db()
print("ok")
'@

  try {
    Set-Content -Path $tmpScript -Value $schemaScript -Encoding UTF8
    $outputLines = & $PythonExe @($tmpScript, $DatabaseUrl, $ProjectRootPath) 2>&1
    $exitCode = $LASTEXITCODE
    if ($null -eq $outputLines) {
      $output = ""
    } else {
      $output = (($outputLines | ForEach-Object { $_.ToString().Trim() }) | Where-Object { $_ }) -join [Environment]::NewLine
    }
  } finally {
    Remove-Item -Path $tmpScript -Force -ErrorAction SilentlyContinue
  }

  if ($exitCode -eq 0) {
    return $true
  }

  $reason = [string]$output
  if ([string]::IsNullOrWhiteSpace($reason)) {
    $reason = "Automatic PostgreSQL schema initialization failed."
  }
  $FailureReason.Value = $reason
  return $false
}

function Show-PostgresConnectionHelp {
  param(
    [string]$DbUrl,
    [string]$DbHost,
    [int]$DbPort,
    [string]$Reason
  )

  $safeDbUrl = $DbUrl
  if (-not [string]::IsNullOrWhiteSpace($safeDbUrl)) {
    $safeDbUrl = $safeDbUrl -replace '://([^:/\s]+):[^@]*@', '://$1:***@'
  }

  Write-Host ""
  Write-Host "============================================================" -ForegroundColor Red
  Write-Host "  PostgreSQL connection failed (required by DATABASE_URL)" -ForegroundColor Red
  Write-Host "============================================================" -ForegroundColor Red
  if (-not [string]::IsNullOrWhiteSpace($Reason)) {
    Write-Host "Reason   : $Reason" -ForegroundColor Yellow
  }
  if (-not [string]::IsNullOrWhiteSpace($DbHost)) {
    Write-Host "Target   : ${DbHost}:$DbPort" -ForegroundColor Yellow
  }
  if (-not [string]::IsNullOrWhiteSpace($safeDbUrl)) {
    Write-Host "DB URL   : $safeDbUrl" -ForegroundColor Yellow
  }
  Write-Host ""
  Write-Host "Quick fixes:" -ForegroundColor Cyan
  Write-Host "  1) Start PostgreSQL service."
  Write-Host "  2) Verify .env DATABASE_URL username/password/db name."
  Write-Host "  3) Ensure PostgreSQL listens on 127.0.0.1:5432 (or your port)."
  Write-Host "  4) Test with: psql -h $DbHost -p $DbPort -U <user> -d <db>"
  Write-Host ""
  Write-Host "Temporary fallback (optional): run_website.bat -AllowSqliteFallback" -ForegroundColor DarkYellow
  Write-Host "============================================================" -ForegroundColor Red
}

Write-Step "Project root: $ProjectRoot"
if ($SkipInstall -and $ForceInstall) {
  throw "Use either -SkipInstall or -ForceInstall, not both."
}

$pythonInfo = Find-Python
if (-not $pythonInfo) {
  throw "Python was not found. Install Python 3.9+ and retry."
}

$versionArgs = @($pythonInfo.PrefixArgs + @("--version"))
$versionText = (& $pythonInfo.Exe @versionArgs 2>&1 | Select-Object -First 1).ToString()
if ($versionText -notmatch "Python\s+(\d+)\.(\d+)\.(\d+)") {
  throw "Unable to detect Python version from: $versionText"
}

$major = [int]$Matches[1]
$minor = [int]$Matches[2]
if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 9)) {
  throw "Python 3.9+ is required. Current version: $versionText"
}

Write-Host "Using $versionText ($($pythonInfo.Exe))"

$venvDir = Join-Path $ProjectRoot ".venv"
$venvPython = Join-Path $venvDir "Scripts\python.exe"
$requirementsPath = Join-Path $ProjectRoot "requirements.txt"
$requirementsStampPath = Join-Path $venvDir ".requirements.stamp"
$envPath = Join-Path $ProjectRoot ".env"

if (-not (Test-Path $venvPython)) {
  Write-Step "Creating virtual environment"
  $venvArgs = @($pythonInfo.PrefixArgs + @("-m", "venv", $venvDir))
  Invoke-Checked -Exe $pythonInfo.Exe -ArgumentList $venvArgs -ErrorText "Failed to create virtual environment"
}

$requirementsHash = (Get-FileHash -Path $requirementsPath -Algorithm SHA256).Hash.ToLowerInvariant()
$requirementsStamp = "$major.$minor|$requirementsHash"
$installReason = ""
$shouldInstallDependencies = $true

if ($ForceInstall) {
  $installReason = "forced by -ForceInstall"
} elseif ($SkipInstall) {
  $shouldInstallDependencies = $false
  $installReason = "skipped by -SkipInstall"
} elseif (-not (Test-Path $requirementsStampPath)) {
  $installReason = "first run on this machine (no dependency stamp)"
} else {
  $existingStamp = (Get-Content $requirementsStampPath -Raw).Trim()
  if ($existingStamp -eq $requirementsStamp) {
    & $venvPython -m pip --version *> $null
    if ($LASTEXITCODE -eq 0) {
      $shouldInstallDependencies = $false
      $installReason = "already installed and requirements unchanged"
    } else {
      $installReason = "pip check failed in existing venv"
    }
  } else {
    $installReason = "requirements or Python version changed"
  }
}

if ($shouldInstallDependencies) {
  Write-Step "Installing Python dependencies ($installReason)"
  Invoke-Checked -Exe $venvPython -ArgumentList @("-m", "pip", "install", "--upgrade", "pip", "setuptools", "wheel") -ErrorText "pip bootstrap failed"
  Invoke-Checked -Exe $venvPython -ArgumentList @("-m", "pip", "install", "-r", $requirementsPath) -ErrorText "Dependency installation failed"
  Set-Content -Path $requirementsStampPath -Value $requirementsStamp -Encoding ASCII
} else {
  Write-Host "Dependencies install skipped: $installReason"
}

Set-SessionCliEnvironment -ProjectRootPath $ProjectRoot -VenvDirPath $venvDir
Write-Host "CLI env: PO_HOME=$env:PO_HOME"

if ($PersistCliEnv) {
  Write-Step "Persisting CLI environment variables (current Windows user)"
  [Environment]::SetEnvironmentVariable("PO_HOME", $ProjectRoot, "User")
  [Environment]::SetEnvironmentVariable("PO_VENV", $venvDir, "User")
  $userPathUpdated = Ensure-UserPathEntry -PathEntry (Join-Path $venvDir "Scripts")
  if ($userPathUpdated) {
    Write-Host "Added .venv\\Scripts to USER Path."
  } else {
    Write-Host ".venv\\Scripts already exists in USER Path."
  }
  Write-Host "Persistent env configured. Open a new terminal to apply it."
}

if (-not (Test-Path $envPath)) {
  Write-Step "Creating local .env (SQLite + localhost defaults)"
  $secret = New-RandomToken -Length 64
  $setupCode = "FASC_$((New-RandomToken -Length 32))"
  $accessCode = New-RandomToken -Length 72

  @"
APP_ENV=development
DATABASE_URL=
SECRET_KEY=$secret
PASSKEY_RP_NAME=PO Management
PASSKEY_RP_ID=localhost
FIRST_ADMIN_SETUP_CODE=$setupCode
ACCESS_LOGIN_CODE=$accessCode
AUTO_BACKUP_ENABLED=1
AUTO_BACKUP_INTERVAL_HOURS=24
AUTO_BACKUP_RETENTION_DAYS=30
HOST=127.0.0.1
PORT=5000
SESSION_COOKIE_SECURE=0
SESSION_COOKIE_SAMESITE=Lax
TRUST_PROXY_HEADERS=0
FLASK_DEBUG=0
FLASK_USE_RELOADER=0
AUTH_DISABLED=1
"@ | Set-Content -Path $envPath -Encoding UTF8

  Write-Host ".env created: $envPath"
}

$envMap = Read-EnvFile -Path $envPath
$dbUrl = ""
if ($envMap.ContainsKey("DATABASE_URL")) {
  $dbUrl = [string]$envMap["DATABASE_URL"]
}

$usingPostgres = $dbUrl -match "^\s*postgresql://"
if ($usingPostgres) {
  $dbUri = $null
  try {
    $dbUri = [System.Uri]$dbUrl
  } catch {
    if ($AllowSqliteFallback) {
      Write-Warning "DATABASE_URL check failed ($($_.Exception.Message)). Using SQLite fallback for this run."
      $env:DATABASE_URL = ""
    } else {
      Show-PostgresConnectionHelp -DbUrl $dbUrl -DbHost "" -DbPort 5432 -Reason "Invalid DATABASE_URL format."
      exit $POSTGRES_FAILURE_EXIT_CODE
    }
  }

  if ($dbUri -ne $null) {
    $dbHost = $dbUri.Host
    $dbPort = if ($dbUri.Port -gt 0) { $dbUri.Port } else { 5432 }
    $dbReachable = Test-TcpPort -ComputerName $dbHost -Port $dbPort
    if (-not $dbReachable) {
      if (Try-StartLocalPostgresService -DbHost $dbHost -DbPort $dbPort) {
        $dbReachable = $true
        Write-Host "PostgreSQL service was started automatically." -ForegroundColor DarkYellow
      }
    }
    if (-not $dbReachable) {
      if ($AllowSqliteFallback) {
        Write-Warning "PostgreSQL is not reachable at ${dbHost}:$dbPort. Using SQLite fallback for this run."
        $env:DATABASE_URL = ""
      } else {
        Show-PostgresConnectionHelp -DbUrl $dbUrl -DbHost $dbHost -DbPort $dbPort -Reason "TCP connection was refused or timed out."
        exit $POSTGRES_FAILURE_EXIT_CODE
      }
    } else {
      $ensureDbReason = ""
      if (-not (Ensure-PostgresDatabaseExists -PythonExe $venvPython -DatabaseUrl $dbUrl -ProjectRootPath $ProjectRoot -FailureReason ([ref]$ensureDbReason))) {
        if ($AllowSqliteFallback) {
          Write-Warning "PostgreSQL database bootstrap failed ($ensureDbReason). Using SQLite fallback for this run."
          $env:DATABASE_URL = ""
        } else {
          Show-PostgresConnectionHelp -DbUrl $dbUrl -DbHost $dbHost -DbPort $dbPort -Reason $ensureDbReason
          exit $POSTGRES_FAILURE_EXIT_CODE
        }
      }
      $pgReason = ""
      if (-not (Test-PostgresQuery -PythonExe $venvPython -DatabaseUrl $dbUrl -FailureReason ([ref]$pgReason))) {
        if ($AllowSqliteFallback) {
          Write-Warning "PostgreSQL authentication/query check failed ($pgReason). Using SQLite fallback for this run."
          $env:DATABASE_URL = ""
        } else {
          Show-PostgresConnectionHelp -DbUrl $dbUrl -DbHost $dbHost -DbPort $dbPort -Reason $pgReason
          exit $POSTGRES_FAILURE_EXIT_CODE
        }
      } else {
        $schemaReason = ""
        if (-not (Ensure-PostgresSchema -PythonExe $venvPython -DatabaseUrl $dbUrl -ProjectRootPath $ProjectRoot -FailureReason ([ref]$schemaReason))) {
          if ($AllowSqliteFallback) {
            Write-Warning "PostgreSQL schema initialization failed ($schemaReason). Using SQLite fallback for this run."
            $env:DATABASE_URL = ""
          } else {
            Show-PostgresConnectionHelp -DbUrl $dbUrl -DbHost $dbHost -DbPort $dbPort -Reason $schemaReason
            exit $POSTGRES_FAILURE_EXIT_CODE
          }
        }
      }
    }
  }
} else {
  if (Select-String -Path $envPath -Pattern '^\s*#\s*DATABASE_URL=' -Quiet) {
    Write-Host "Note: DATABASE_URL is commented in .env, so the app will run with SQLite." -ForegroundColor DarkYellow
  }
}

$bindHost = if ($envMap.ContainsKey("HOST")) { [string]$envMap["HOST"] } else { "127.0.0.1" }
$portRaw = if ($envMap.ContainsKey("PORT")) { [string]$envMap["PORT"] } else { "5000" }
$port = 5000
if (-not [int]::TryParse($portRaw, [ref]$port)) {
  $port = 5000
}
$openHost = if ($bindHost -in @("0.0.0.0", "::", "")) { "127.0.0.1" } else { $bindHost }
$url = "http://$openHost`:$port"

Write-Host "Website URL: $url"
if ($CheckOnly) {
  Write-Host "Check completed successfully."
  exit 0
}

if (-not $NoBrowser) {
  Start-Job -ScriptBlock {
    param($TargetUrl)
    Start-Sleep -Seconds 2
    Start-Process $TargetUrl | Out-Null
  } -ArgumentList $url | Out-Null
}

Write-Step "Starting PO website"
Write-Host "Press Ctrl + C to stop."
Push-Location $ProjectRoot
try {
  & $venvPython "app.py"
  if ($LASTEXITCODE -ne 0) {
    throw "The app exited with code $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
