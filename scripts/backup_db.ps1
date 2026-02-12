param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$OutputDir = "",
  [string]$PgBin = ""
)

$ErrorActionPreference = "Stop"

function Resolve-PgTool {
  param(
    [string]$ToolName,
    [string]$PgBinHint = ""
  )

  if (-not [string]::IsNullOrWhiteSpace($PgBinHint)) {
    $hinted = Join-Path $PgBinHint $ToolName
    if (Test-Path $hinted) {
      return $hinted
    }
  }

  $cmd = Get-Command $ToolName -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  $roots = @()
  if (-not [string]::IsNullOrWhiteSpace($env:ProgramFiles)) {
    $roots += $env:ProgramFiles
  }
  $pf86 = [Environment]::GetEnvironmentVariable("ProgramFiles(x86)")
  if (-not [string]::IsNullOrWhiteSpace($pf86)) {
    $roots += $pf86
  }

  foreach ($root in $roots) {
    $pgRoot = Join-Path $root "PostgreSQL"
    if (-not (Test-Path $pgRoot)) {
      continue
    }
    $versionDirs = Get-ChildItem -Path $pgRoot -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
    foreach ($dir in $versionDirs) {
      $candidate = Join-Path $dir.FullName "bin\$ToolName"
      if (Test-Path $candidate) {
        return $candidate
      }
    }
  }

  throw "$ToolName not found. Install PostgreSQL client tools and add them to PATH, or pass -PgBin."
}

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = Join-Path $ProjectRoot "backups"
}

$envPath = Join-Path $ProjectRoot ".env"
if (-not (Test-Path $envPath)) {
  throw ".env not found at $envPath"
}

$envMap = @{}
Get-Content $envPath | ForEach-Object {
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
  $envMap[$key] = $value
}

$databaseUrl = $envMap["DATABASE_URL"]
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
  throw "DATABASE_URL is missing in .env"
}

try {
  $uri = [System.Uri]$databaseUrl
} catch {
  throw "Invalid DATABASE_URL format in .env"
}

$userInfo = $uri.UserInfo
if ([string]::IsNullOrWhiteSpace($userInfo) -or -not $userInfo.Contains(":")) {
  throw "DATABASE_URL must contain username and password"
}

$parts = $userInfo.Split(":", 2)
$dbUser = [System.Uri]::UnescapeDataString($parts[0])
$dbPass = [System.Uri]::UnescapeDataString($parts[1])
$dbHost = $uri.Host
$dbPort = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
$dbName = $uri.AbsolutePath.TrimStart("/")

if ([string]::IsNullOrWhiteSpace($dbName)) {
  throw "Database name is missing in DATABASE_URL"
}

$pgDumpExe = Resolve-PgTool -ToolName "pg_dump.exe" -PgBinHint $PgBin

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$backupFile = Join-Path $OutputDir "${dbName}_${timestamp}.dump"

$oldPgPassword = $env:PGPASSWORD
$env:PGPASSWORD = $dbPass
try {
  & $pgDumpExe -h $dbHost -p $dbPort -U $dbUser -d $dbName -F c -f $backupFile
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed with exit code $LASTEXITCODE"
  }
} finally {
  $env:PGPASSWORD = $oldPgPassword
}

Write-Host "Backup created: $backupFile"
