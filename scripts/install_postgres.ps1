param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [switch]$CheckOnly,
  [switch]$SkipEnvSetup,
  [switch]$NonInteractive
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$EXIT_WINGET_MISSING = 51
$EXIT_INSTALL_FAILED = 52
$EXIT_PSQL_NOT_FOUND = 53
$EXIT_DB_SETUP_FAILED = 55
$EXIT_ELEVATION_REQUIRED = 57

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-IsAdministrator {
  try {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  } catch {
    return $false
  }
}

function Ensure-ElevatedIfNeeded {
  if ($CheckOnly) {
    return
  }
  if (Test-IsAdministrator) {
    return
  }

  Write-Host ""
  Write-Host "[INFO] PostgreSQL install/config needs Administrator privileges." -ForegroundColor Yellow
  Write-Host "[INFO] Requesting elevation (UAC prompt)..." -ForegroundColor Yellow

  $scriptPath = if ($PSCommandPath) { $PSCommandPath } else { $MyInvocation.MyCommand.Path }
  $args = @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", $scriptPath,
    "-ProjectRoot", $ProjectRoot
  )
  if ($NonInteractive) { $args += "-NonInteractive" }
  if ($SkipEnvSetup) { $args += "-SkipEnvSetup" }
  if ($CheckOnly) { $args += "-CheckOnly" }

  try {
    $proc = Start-Process -FilePath "powershell.exe" -ArgumentList $args -Verb RunAs -PassThru -Wait
    exit $proc.ExitCode
  } catch {
    Write-Host ""
    Write-Host "[ERROR] Administrator elevation was canceled or failed." -ForegroundColor Red
    exit $EXIT_ELEVATION_REQUIRED
  }
}

function Refresh-CurrentSessionPath {
  $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $joined = @($machinePath, $userPath) -join ";"
  $parts = $joined.Split(";") | ForEach-Object { $_.Trim() } | Where-Object { $_ } | Select-Object -Unique
  $env:Path = ($parts -join ";")
}

function Get-YesNo {
  param(
    [string]$Prompt,
    [bool]$Default = $true
  )
  if ($NonInteractive) {
    return $Default
  }

  $hint = if ($Default) { "[Y/n]" } else { "[y/N]" }
  $answer = (Read-Host "$Prompt $hint").Trim().ToLowerInvariant()
  if ([string]::IsNullOrWhiteSpace($answer)) {
    return $Default
  }
  return $answer -in @("y", "yes")
}

function Read-InputOrDefault {
  param(
    [string]$Prompt,
    [string]$Default = ""
  )
  if ($NonInteractive) {
    return $Default
  }
  $value = (Read-Host "$Prompt [$Default]").Trim()
  if ([string]::IsNullOrWhiteSpace($value)) {
    return $Default
  }
  return $value
}

function Read-SecretOrDefault {
  param(
    [string]$Prompt,
    [string]$Default = ""
  )
  if ($NonInteractive) {
    return $Default
  }
  $secret = Read-Host $Prompt -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
  try {
    $value = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
  return [string]$value
}

function Read-SecretKeepDefault {
  param(
    [string]$Prompt,
    [string]$Default = ""
  )
  if ($NonInteractive) {
    return $Default
  }
  $secret = Read-Host "$Prompt [hidden; press Enter to keep current]" -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
  try {
    $value = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
  if ([string]::IsNullOrWhiteSpace($value)) {
    return $Default
  }
  return [string]$value
}

function Get-EnvValue {
  param(
    [string]$EnvPath,
    [string]$Key
  )
  if (-not (Test-Path $EnvPath)) {
    return ""
  }
  $lines = Get-Content -Path $EnvPath -ErrorAction SilentlyContinue
  if ($null -eq $lines) {
    return ""
  }
  foreach ($line in $lines) {
    $raw = [string]$line
    if ($raw -match "^\s*#") { continue }
    if ($raw -notmatch "^\s*$Key\s*=") { continue }
    $idx = $raw.IndexOf("=")
    if ($idx -lt 0) { continue }
    return $raw.Substring($idx + 1).Trim()
  }
  return ""
}

function Get-DatabaseDefaultsFromEnv {
  param([string]$EnvPath)

  $result = [ordered]@{
    Host = "127.0.0.1"
    Port = 5432
    AdminUser = "postgres"
    AdminPassword = ""
    AppUser = "po_user"
    AppPassword = ""
    AppDb = "po_db"
  }

  $dbUrl = [string](Get-EnvValue -EnvPath $EnvPath -Key "DATABASE_URL")
  if ($dbUrl -notmatch "^\s*postgresql://") {
    $adminPassEnv = [string]$env:POSTGRES_ADMIN_PASSWORD
    if (-not [string]::IsNullOrWhiteSpace($adminPassEnv)) {
      $result.AdminPassword = $adminPassEnv.Trim()
    }
    return $result
  }

  try {
    $uri = [System.Uri]$dbUrl
    if (-not [string]::IsNullOrWhiteSpace($uri.Host)) {
      $result.Host = $uri.Host
    }
    if ($uri.Port -gt 0) {
      $result.Port = $uri.Port
    }
    $dbName = [System.Uri]::UnescapeDataString(($uri.AbsolutePath -replace "^/", ""))
    if (-not [string]::IsNullOrWhiteSpace($dbName)) {
      $result.AppDb = $dbName
    }
    $userInfo = [string]$uri.UserInfo
    if (-not [string]::IsNullOrWhiteSpace($userInfo)) {
      $parts = $userInfo.Split(":", 2)
      if ($parts.Count -ge 1 -and -not [string]::IsNullOrWhiteSpace($parts[0])) {
        $result.AppUser = [System.Uri]::UnescapeDataString($parts[0])
      }
      if ($parts.Count -eq 2 -and -not [string]::IsNullOrWhiteSpace($parts[1])) {
        $result.AppPassword = [System.Uri]::UnescapeDataString($parts[1])
      }
    }

    # If DATABASE_URL points to postgres superuser, reuse for bootstrap by default.
    if ($result.AppUser -eq "postgres" -and -not [string]::IsNullOrWhiteSpace($result.AppPassword)) {
      $result.AdminUser = "postgres"
      $result.AdminPassword = $result.AppPassword
    } else {
      $adminPassEnv = [string]$env:POSTGRES_ADMIN_PASSWORD
      if (-not [string]::IsNullOrWhiteSpace($adminPassEnv)) {
        $result.AdminPassword = $adminPassEnv.Trim()
      }
    }
  } catch {
    $adminPassEnv = [string]$env:POSTGRES_ADMIN_PASSWORD
    if (-not [string]::IsNullOrWhiteSpace($adminPassEnv)) {
      $result.AdminPassword = $adminPassEnv.Trim()
    }
  }

  return $result
}

function New-RandomToken {
  param([int]$Length = 24)
  $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  $builder = New-Object System.Text.StringBuilder
  for ($i = 0; $i -lt $Length; $i++) {
    $idx = Get-Random -Minimum 0 -Maximum $chars.Length
    [void]$builder.Append($chars[$idx])
  }
  return $builder.ToString()
}

function Find-PgTool {
  param([string]$ToolName)

  # Prefer project-local PostgreSQL binaries if bundled with the project.
  $projectRoots = @(
    (Join-Path $ProjectRoot "PostgreSQL\bin"),
    (Join-Path $ProjectRoot "postgresql\bin"),
    (Join-Path $ProjectRoot "pgsql\bin"),
    (Join-Path $ProjectRoot "pg\bin")
  )
  foreach ($binRoot in $projectRoots) {
    if ([string]::IsNullOrWhiteSpace($binRoot)) {
      continue
    }
    $candidate = Join-Path $binRoot $ToolName
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  # Fallback: scan project for */bin/<tool>.
  if (Test-Path $ProjectRoot) {
    $projectCandidate = Get-ChildItem -Path $ProjectRoot -Filter $ToolName -File -Recurse -ErrorAction SilentlyContinue `
      | Where-Object { $_.FullName -match "\\bin\\" } `
      | Sort-Object LastWriteTime -Descending `
      | Select-Object -First 1
    if ($projectCandidate) {
      return $projectCandidate.FullName
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

  # Registry install locations (EnterpriseDB installer writes these keys).
  $regPaths = @(
    "HKLM:\SOFTWARE\PostgreSQL\Installations",
    "HKLM:\SOFTWARE\WOW6432Node\PostgreSQL\Installations"
  )
  foreach ($regPath in $regPaths) {
    if (-not (Test-Path $regPath)) {
      continue
    }
    $installs = Get-ChildItem -Path $regPath -ErrorAction SilentlyContinue
    foreach ($install in $installs) {
      try {
        $props = Get-ItemProperty -Path $install.PSPath -ErrorAction Stop
        $baseDir = @($props."Base Directory", $props."BaseDir", $props."Installation Directory", $props."InstallLocation") `
          | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } `
          | Select-Object -First 1
        if (-not $baseDir) {
          continue
        }
        $candidate = Join-Path ([string]$baseDir) "bin\$ToolName"
        if (Test-Path $candidate) {
          return $candidate
        }
      } catch {
        continue
      }
    }
  }

  # Derive bin path from service ImagePath when available.
  $pgServices = @(Get-PostgresServices)
  foreach ($svc in $pgServices) {
    try {
      $cim = Get-CimInstance Win32_Service -Filter ("Name='" + $svc.Name.Replace("'", "''") + "'") -ErrorAction Stop
      $imagePath = [string]$cim.PathName
      if ([string]::IsNullOrWhiteSpace($imagePath)) {
        continue
      }
      $match = [regex]::Match($imagePath, '([A-Za-z]:\\[^"]*?\\bin)\\')
      if (-not $match.Success) {
        continue
      }
      $binDir = $match.Groups[1].Value
      $candidate = Join-Path $binDir $ToolName
      if (Test-Path $candidate) {
        return $candidate
      }
    } catch {
      continue
    }
  }

  # Winget can install/cache binaries outside Program Files\PostgreSQL.
  $wingetRoots = @()
  if (-not [string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) {
    $wingetRoots += (Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages")
  }
  $programData = [Environment]::GetEnvironmentVariable("ProgramData")
  if (-not [string]::IsNullOrWhiteSpace($programData)) {
    $wingetRoots += (Join-Path $programData "Microsoft\WinGet\Packages")
  }

  foreach ($root in $wingetRoots) {
    if (-not (Test-Path $root)) {
      continue
    }
    $candidate = Get-ChildItem -Path $root -Filter $ToolName -File -Recurse -ErrorAction SilentlyContinue `
      | Where-Object { $_.FullName -match "PostgreSQL" } `
      | Sort-Object LastWriteTime -Descending `
      | Select-Object -First 1
    if ($candidate) {
      return $candidate.FullName
    }
  }

  return $null
}

function Find-ProjectPostgresInstaller {
  if (-not (Test-Path $ProjectRoot)) {
    return $null
  }

  $patterns = @(
    "postgresql-*-windows-*.exe",
    "postgresql-*.exe",
    "*postgres*windows*x64*.exe"
  )

  foreach ($pattern in $patterns) {
    $candidate = Get-ChildItem -Path $ProjectRoot -File -Filter $pattern -ErrorAction SilentlyContinue `
      | Sort-Object LastWriteTime -Descending `
      | Select-Object -First 1
    if ($candidate) {
      return $candidate.FullName
    }
  }

  return $null
}

function Install-PostgresFromProjectInstaller {
  param(
    [string]$InstallerPath,
    [hashtable]$DbDefaults
  )

  if ([string]::IsNullOrWhiteSpace($InstallerPath) -or -not (Test-Path $InstallerPath)) {
    throw "Project PostgreSQL installer file was not found."
  }

  $port = 5432
  $portRaw = [string]$DbDefaults.Port
  if (-not [int]::TryParse($portRaw, [ref]$port)) {
    $port = 5432
  }

  $adminPassword = [string]$DbDefaults.AdminPassword
  if ([string]::IsNullOrWhiteSpace($adminPassword)) {
    $adminPassword = "postgres"
  }

  $args = @(
    "--mode", "unattended",
    "--unattendedmodeui", "none",
    "--enable-components", "server,commandlinetools",
    "--superaccount", "postgres",
    "--superpassword", $adminPassword,
    "--servicepassword", $adminPassword,
    "--serverport", $port.ToString()
  )

  Write-Host "Using project installer: $InstallerPath" -ForegroundColor DarkYellow
  $proc = Start-Process -FilePath $InstallerPath -ArgumentList $args -PassThru -Wait
  if ($proc.ExitCode -ne 0) {
    throw "PostgreSQL local installer failed with exit code $($proc.ExitCode)."
  }
}

function Wait-ForPgTool {
  param(
    [string]$ToolName,
    [int]$TimeoutSeconds = 180,
    [int]$PollIntervalSeconds = 3
  )

  $deadline = (Get-Date).AddSeconds([Math]::Max(5, $TimeoutSeconds))
  do {
    $found = Find-PgTool -ToolName $ToolName
    if ($found) {
      return $found
    }
    Start-Sleep -Seconds ([Math]::Max(1, $PollIntervalSeconds))
  } while ((Get-Date) -lt $deadline)

  return $null
}

function Test-TcpPort {
  param(
    [string]$ComputerName,
    [int]$Port,
    [int]$TimeoutMs = 1500
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

function Get-PostgresServices {
  try {
    return @(Get-Service -ErrorAction Stop | Where-Object {
      $_.Name -like "postgresql*" -or $_.DisplayName -like "*PostgreSQL*"
    })
  } catch {
    return @()
  }
}

function Ensure-PostgresServiceRunning {
  param(
    [string]$HostName = "127.0.0.1",
    [int]$Port = 5432
  )

  $services = @(Get-PostgresServices)
  if (-not $services -or $services.Count -eq 0) {
    return $false
  }

  foreach ($svc in $services) {
    if ($svc.Status -eq "Running") {
      continue
    }
    try {
      Start-Service -Name $svc.Name -ErrorAction Stop
      Write-Host "Started service: $($svc.Name)" -ForegroundColor DarkYellow
    } catch {
      Write-Host "Could not start service $($svc.Name): $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
  }

  if ([string]::IsNullOrWhiteSpace($HostName) -or $HostName -notin @("127.0.0.1", "localhost", "::1", "[::1]")) {
    return $true
  }

  for ($i = 0; $i -lt 12; $i++) {
    if (Test-TcpPort -ComputerName $HostName -Port $Port) {
      return $true
    }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Get-PostgresWingetOverride {
  param([hashtable]$DbDefaults)

  $port = 5432
  $portRaw = [string]$DbDefaults.Port
  if (-not [int]::TryParse($portRaw, [ref]$port)) {
    $port = 5432
  }

  $adminPassword = [string]$DbDefaults.AdminPassword
  $tokens = @(
    "--mode", "unattended",
    "--unattendedmodeui", "none",
    "--enable-components", "server,commandlinetools",
    "--serverport", $port.ToString(),
    "--superaccount", "postgres"
  )

  if (-not [string]::IsNullOrWhiteSpace($adminPassword)) {
    $tokens += @("--superpassword", $adminPassword, "--servicepassword", $adminPassword)
  }

  $rendered = $tokens | ForEach-Object {
    $text = [string]$_
    if ($text -match '[\s"]') {
      '"' + ($text.Replace('"', '\"')) + '"'
    } else {
      $text
    }
  }

  return ($rendered -join " ")
}

function Ensure-EnvFile {
  param([string]$EnvPath)
  if (Test-Path $EnvPath) {
    return
  }
  $examplePath = Join-Path $ProjectRoot ".env.example"
  if (Test-Path $examplePath) {
    Copy-Item -Path $examplePath -Destination $EnvPath -Force
    return
  }
  New-Item -Path $EnvPath -ItemType File -Force | Out-Null
}

function Update-EnvValue {
  param(
    [string]$EnvPath,
    [string]$Key,
    [string]$Value
  )

  Ensure-EnvFile -EnvPath $EnvPath
  $lines = Get-Content -Path $EnvPath -ErrorAction SilentlyContinue
  if ($null -eq $lines) {
    $lines = @()
  }

  $updated = $false
  $result = New-Object System.Collections.Generic.List[string]

  foreach ($line in $lines) {
    if ($line -match "^\s*#?\s*$Key\s*=") {
      $result.Add("$Key=$Value")
      $updated = $true
    } else {
      $result.Add($line)
    }
  }

  if (-not $updated) {
    $result.Add("$Key=$Value")
  }

  Set-Content -Path $EnvPath -Value $result -Encoding UTF8
}

function Ensure-PostgresInstalled {
  param([hashtable]$DbDefaults)

  $psql = Find-PgTool -ToolName "psql.exe"
  $services = @(Get-PostgresServices)
  if ($psql) {
    return [PSCustomObject]@{
      PsqlPath = $psql
      Services = $services
      InstalledNow = $false
    }
  }

  if ($services -and $services.Count -gt 0) {
    Write-Host "PostgreSQL service detected. Continuing without psql tool discovery." -ForegroundColor DarkYellow
    return [PSCustomObject]@{
      PsqlPath = ""
      Services = $services
      InstalledNow = $false
    }
  }

  if ($CheckOnly) {
    throw "PostgreSQL tools/services are not detected."
  }

  $localInstaller = Find-ProjectPostgresInstaller
  if (-not [string]::IsNullOrWhiteSpace($localInstaller)) {
    Write-Step "Installing PostgreSQL from project installer"
    try {
      Install-PostgresFromProjectInstaller -InstallerPath $localInstaller -DbDefaults $DbDefaults
    } catch {
      throw "PostgreSQL local installer failed: $($_.Exception.Message)"
    }

    Refresh-CurrentSessionPath
    $psqlAfterLocal = Wait-ForPgTool -ToolName "psql.exe" -TimeoutSeconds 240 -PollIntervalSeconds 3
    $servicesAfterLocal = @(Get-PostgresServices)
    if ($psqlAfterLocal) {
      return [PSCustomObject]@{
        PsqlPath = $psqlAfterLocal
        Services = $servicesAfterLocal
        InstalledNow = $true
      }
    }

    if ($servicesAfterLocal -and $servicesAfterLocal.Count -gt 0) {
      Write-Host "Local installer finished and PostgreSQL service is detected." -ForegroundColor DarkYellow
      return [PSCustomObject]@{
        PsqlPath = ""
        Services = $servicesAfterLocal
        InstalledNow = $true
      }
    }

    throw "PostgreSQL local installer completed, but no PostgreSQL tools/service were detected."
  }

  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) {
    throw "winget is not available."
  }

  $overrideArgs = Get-PostgresWingetOverride -DbDefaults $DbDefaults

  function Try-InstallByPackageId {
    param(
      [string]$PackageId,
      [string]$OverrideArgs
    )
    Write-Host "Trying package id: $PackageId"
    if (-not [string]::IsNullOrWhiteSpace($OverrideArgs)) {
      winget install -e --id $PackageId --source winget --scope machine --silent --accept-package-agreements --accept-source-agreements --override $OverrideArgs
      if ($LASTEXITCODE -eq 0) {
        return $true
      }
      Write-Host "Override install failed for $PackageId, retrying without override..." -ForegroundColor DarkYellow
    }
    winget install -e --id $PackageId --source winget --scope machine --silent --accept-package-agreements --accept-source-agreements
    return $LASTEXITCODE -eq 0
  }

  function Try-InstallFromPackageList {
    param(
      [string[]]$PackageIds,
      [string]$OverrideArgs
    )
    foreach ($id in $PackageIds) {
      if (Try-InstallByPackageId -PackageId $id -OverrideArgs $OverrideArgs) {
        return $true
      }
    }
    return $false
  }

  Write-Step "Installing PostgreSQL via winget"
  $packageIds = @(
    "PostgreSQL.PostgreSQL",
    "PostgreSQL.PostgreSQL.17",
    "PostgreSQL.PostgreSQL.16",
    "PostgreSQL.PostgreSQL.15"
  )

  # Best effort source refresh before install.
  winget source update *> $null
  $installed = Try-InstallFromPackageList -PackageIds $packageIds -OverrideArgs $overrideArgs

  if (-not $installed) {
    Write-Step "Winget source repair (retry once)"
    winget source reset --force *> $null
    winget source update *> $null
    $installed = Try-InstallFromPackageList -PackageIds $packageIds -OverrideArgs $overrideArgs
  }

  if (-not $installed) {
    throw "PostgreSQL installation failed using winget after source repair."
  }

  Refresh-CurrentSessionPath
  $psql = Wait-ForPgTool -ToolName "psql.exe" -TimeoutSeconds 240 -PollIntervalSeconds 3
  $servicesAfter = @(Get-PostgresServices)
  if ($psql) {
    return [PSCustomObject]@{
      PsqlPath = $psql
      Services = $servicesAfter
      InstalledNow = $true
    }
  }

  if ($servicesAfter -and $servicesAfter.Count -gt 0) {
    Write-Host "PostgreSQL installed and service detected, but psql tool is not visible in this shell yet." -ForegroundColor DarkYellow
    return [PSCustomObject]@{
      PsqlPath = ""
      Services = $servicesAfter
      InstalledNow = $true
    }
  }

  throw "PostgreSQL installed but no PostgreSQL service/client tools were detected."
}

function Run-DbBootstrap {
  param(
    [string]$PsqlPath,
    [string]$DbHost,
    [int]$Port,
    [string]$AdminUser,
    [string]$AdminPassword,
    [string]$AppUser,
    [string]$AppPassword,
    [string]$AppDb
  )

  $escUserLit = $AppUser.Replace("'", "''")
  $escPassLit = $AppPassword.Replace("'", "''")
  $escDbLit = $AppDb.Replace("'", "''")
  $identUser = $AppUser.Replace('"', '""')
  $identDb = $AppDb.Replace('"', '""')

  $sql = @"
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$escUserLit') THEN
    CREATE ROLE "$identUser" LOGIN PASSWORD '$escPassLit';
  ELSE
    ALTER ROLE "$identUser" WITH LOGIN PASSWORD '$escPassLit';
  END IF;
END
`$`$;

SELECT format('CREATE DATABASE "%s" OWNER "%s"', '$identDb', '$identUser')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '$escDbLit')
\gexec

GRANT ALL PRIVILEGES ON DATABASE "$identDb" TO "$identUser";
"@

  $tmpSql = Join-Path ([System.IO.Path]::GetTempPath()) ("po_pg_bootstrap_" + [Guid]::NewGuid().ToString("N") + ".sql")

  $oldPass = $env:PGPASSWORD
  try {
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($tmpSql, $sql, $utf8NoBom)
    if (-not [string]::IsNullOrWhiteSpace($AdminPassword)) {
      $env:PGPASSWORD = $AdminPassword
    } else {
      Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }

    & $PsqlPath -h $DbHost -p $Port -U $AdminUser -d postgres -v ON_ERROR_STOP=1 -f $tmpSql
    if ($LASTEXITCODE -ne 0) {
      throw "psql returned exit code $LASTEXITCODE."
    }
  } finally {
    Remove-Item -Path $tmpSql -Force -ErrorAction SilentlyContinue
    if ($null -ne $oldPass) {
      $env:PGPASSWORD = $oldPass
    } else {
      Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }
  }
}

Ensure-ElevatedIfNeeded

Write-Step "PostgreSQL installer"
Write-Host "Project root: $ProjectRoot"
$envPath = Join-Path $ProjectRoot ".env"
$dbDefaults = Get-DatabaseDefaultsFromEnv -EnvPath $envPath

$targetHost = [string]$dbDefaults.Host
if ([string]::IsNullOrWhiteSpace($targetHost)) {
  $targetHost = "127.0.0.1"
}
$targetPort = 5432
$targetPortRaw = [string]$dbDefaults.Port
if (-not [int]::TryParse($targetPortRaw, [ref]$targetPort)) {
  $targetPort = 5432
}

try {
  $installResult = Ensure-PostgresInstalled -DbDefaults $dbDefaults
} catch {
  $message = $_.Exception.Message
  if ($message -like "*winget*not available*") {
    Write-Host ""
    Write-Host "[ERROR] winget is missing. Install PostgreSQL manually." -ForegroundColor Red
    exit $EXIT_WINGET_MISSING
  }
  if ($message -like "*installation failed*") {
    Write-Host ""
    Write-Host "[ERROR] PostgreSQL install failed via winget." -ForegroundColor Red
    Write-Host "Run these commands in a new terminal, then retry option 10:" -ForegroundColor Yellow
    Write-Host "  winget source reset --force" -ForegroundColor DarkYellow
    Write-Host "  winget source update" -ForegroundColor DarkYellow
    Write-Host "  winget search PostgreSQL" -ForegroundColor DarkYellow
    Write-Host "  winget install -e --id PostgreSQL.PostgreSQL.17 --source winget --accept-package-agreements --accept-source-agreements" -ForegroundColor DarkYellow
    Write-Host "If winget still fails, install manually: https://www.postgresql.org/download/windows/" -ForegroundColor DarkYellow
    exit $EXIT_INSTALL_FAILED
  }
  if ($message -like "*local installer failed*") {
    Write-Host ""
    Write-Host "[ERROR] PostgreSQL local installer failed." -ForegroundColor Red
    Write-Host "Check installer file inside project folder and run it manually once if needed." -ForegroundColor Yellow
    Write-Host "Then run option 10 again." -ForegroundColor Yellow
    exit $EXIT_INSTALL_FAILED
  }
  if ($message -like "*tools/services are not detected*" -or $message -like "*no PostgreSQL service/client tools were detected*") {
    Write-Host ""
    Write-Host "[ERROR] PostgreSQL tools/service are missing after installation attempt." -ForegroundColor Red
    Write-Host "Open terminal as Administrator and run option 10 again." -ForegroundColor Yellow
    Write-Host "If winget keeps failing, install manually: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit $EXIT_PSQL_NOT_FOUND
  }
  throw
}

$psqlPath = [string]$installResult.PsqlPath
if (-not [string]::IsNullOrWhiteSpace($psqlPath)) {
  Write-Host "psql detected at: $psqlPath"
} else {
  Write-Host "psql tool not detected in this shell; continuing with service-based validation." -ForegroundColor DarkYellow
}

$serviceReady = Ensure-PostgresServiceRunning -HostName $targetHost -Port $targetPort
if ($serviceReady) {
  Write-Host "PostgreSQL service is reachable on ${targetHost}:$targetPort." -ForegroundColor Green
} else {
  Write-Host "PostgreSQL service is not reachable on ${targetHost}:$targetPort yet." -ForegroundColor DarkYellow
  Write-Host "If needed, run as Administrator once and start PostgreSQL service manually." -ForegroundColor DarkYellow
}

if ($CheckOnly) {
  Write-Host "Check completed successfully."
  exit 0
}

if ($SkipEnvSetup) {
  Write-Host "Skipping DB/.env setup by request."
  exit 0
}

$shouldConfigure = Get-YesNo -Prompt "Do you want to create/update PO database user and update .env now?" -Default $true
if (-not $shouldConfigure) {
  Write-Host "PostgreSQL installation step completed."
  exit 0
}

Write-Step "Database setup"

$pgHost = Read-InputOrDefault -Prompt "PostgreSQL host" -Default ([string]$dbDefaults.Host)
$pgPortRaw = Read-InputOrDefault -Prompt "PostgreSQL port" -Default ([string]$dbDefaults.Port)
$pgPort = 5432
if (-not [int]::TryParse($pgPortRaw, [ref]$pgPort)) {
  $pgPort = 5432
}

$adminUser = Read-InputOrDefault -Prompt "Admin user (existing postgres superuser)" -Default ([string]$dbDefaults.AdminUser)
$adminPassword = Read-SecretOrDefault -Prompt "Admin password (leave blank if local trust auth)" -Default ([string]$dbDefaults.AdminPassword)

$appUser = Read-InputOrDefault -Prompt "App DB user" -Default ([string]$dbDefaults.AppUser)
$appDb = Read-InputOrDefault -Prompt "App DB name" -Default ([string]$dbDefaults.AppDb)
$appPassword = Read-SecretOrDefault -Prompt "App DB password (leave blank to auto-generate)" -Default ([string]$dbDefaults.AppPassword)

if ([string]::IsNullOrWhiteSpace($appPassword)) {
  if ([string]::IsNullOrWhiteSpace($psqlPath) -and $NonInteractive) {
    if (-not [string]::IsNullOrWhiteSpace($adminPassword)) {
      $appPassword = $adminPassword
      Write-Host "Using admin password for DATABASE_URL because psql bootstrap is unavailable." -ForegroundColor DarkYellow
    } else {
      $appPassword = "postgres"
      Write-Host "Using fallback password 'postgres' because no app/admin password is available." -ForegroundColor DarkYellow
    }
  } else {
    $appPassword = New-RandomToken -Length 28
    Write-Host "Generated app DB password automatically." -ForegroundColor Yellow
  }
}

$dbBootstrapSkipped = $false
if ([string]::IsNullOrWhiteSpace($psqlPath)) {
  if ($NonInteractive) {
    $dbBootstrapSkipped = $true
    Write-Host "Skipping DB bootstrap in non-interactive mode because psql is unavailable." -ForegroundColor DarkYellow
  } else {
    Write-Host ""
    Write-Host "[ERROR] psql client tools are required for automatic DB user/database bootstrap." -ForegroundColor Red
    Write-Host "Close and reopen terminal, then retry option 10." -ForegroundColor Yellow
    exit $EXIT_PSQL_NOT_FOUND
  }
} else {
  try {
    Run-DbBootstrap -PsqlPath $psqlPath -DbHost $pgHost -Port $pgPort -AdminUser $adminUser -AdminPassword $adminPassword -AppUser $appUser -AppPassword $appPassword -AppDb $appDb
  } catch {
    Write-Host ""
    Write-Host "[ERROR] Database bootstrap failed: $($_.Exception.Message)" -ForegroundColor Red
    exit $EXIT_DB_SETUP_FAILED
  }
}

$encUser = [System.Uri]::EscapeDataString($appUser)
$encPass = [System.Uri]::EscapeDataString($appPassword)
$encDb = [System.Uri]::EscapeDataString($appDb)
$dbUrl = "postgresql://$encUser`:$encPass@$pgHost`:$pgPort/$encDb"
$currentDbUrl = [string](Get-EnvValue -EnvPath $envPath -Key "DATABASE_URL")
if ($dbBootstrapSkipped -and -not [string]::IsNullOrWhiteSpace($currentDbUrl)) {
  Write-Host "Keeping existing DATABASE_URL because DB bootstrap was skipped." -ForegroundColor DarkYellow
} else {
  Update-EnvValue -EnvPath $envPath -Key "DATABASE_URL" -Value $dbUrl
}

$existingAccessCode = [string](Get-EnvValue -EnvPath $envPath -Key "ACCESS_LOGIN_CODE")
$accessCodeDefault = if ([string]::IsNullOrWhiteSpace($existingAccessCode)) {
  New-RandomToken -Length 72
} else {
  $existingAccessCode
}
$accessCode = Read-SecretKeepDefault -Prompt "Access login code (for sign-in page)" -Default $accessCodeDefault
if ([string]::IsNullOrWhiteSpace($accessCode)) {
  $accessCode = $accessCodeDefault
}
Update-EnvValue -EnvPath $envPath -Key "ACCESS_LOGIN_CODE" -Value $accessCode

Write-Step "Completed"
if ($dbBootstrapSkipped) {
  Write-Host "PostgreSQL install/service check completed, but DB bootstrap was skipped." -ForegroundColor Yellow
  Write-Host "Existing DATABASE_URL was kept. If login fails, run option 10 again in a new terminal." -ForegroundColor Yellow
} else {
  Write-Host "DATABASE_URL updated in: $envPath" -ForegroundColor Green
  Write-Host "App DB user: $appUser"
  Write-Host "App DB name: $appDb"
  Write-Host "Host/Port: ${pgHost}:$pgPort"
  Write-Host "If password was auto-generated, it is already saved inside .env."
}
Write-Host "ACCESS_LOGIN_CODE updated in .env." -ForegroundColor Green
Write-Host ""
Write-Host "Next step: run run_website.bat and choose option 1." -ForegroundColor Cyan
exit 0
