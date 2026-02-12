@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul 2>&1

for /f %%A in ('echo prompt $E ^| cmd') do set "ESC=%%A"
set "C_RESET=%ESC%[0m"
set "C_CYAN=%ESC%[96m"
set "C_GREEN=%ESC%[92m"
set "C_YELLOW=%ESC%[93m"
set "C_RED=%ESC%[91m"
set "C_BLUE=%ESC%[94m"

set "SCRIPT_PATH=%~dp0scripts\setup_and_run.ps1"
set "PG_INSTALL_SCRIPT=%~dp0scripts\install_postgres.ps1"
set "PG_AUTO_STAMP=%~dp0.postgres_auto_setup.stamp"

if not exist "%SCRIPT_PATH%" (
  echo.
  echo %C_RED%[ERROR]%C_RESET% Missing launcher script:
  echo "%SCRIPT_PATH%"
  pause
  exit /b 1
)

if not exist "%PG_INSTALL_SCRIPT%" (
  echo.
  echo %C_RED%[ERROR]%C_RESET% Missing PostgreSQL installer script:
  echo "%PG_INSTALL_SCRIPT%"
  pause
  exit /b 1
)

if not "%~1"=="" goto :direct_mode

:menu
call :show_banner
echo %C_YELLOW%New user? Start with option [1].%C_RESET%
echo.
echo %C_CYAN%[1]%C_RESET% Start website ^(recommended for new users^)
echo %C_CYAN%[2]%C_RESET% Start website ^(skip dependency install^)
echo %C_CYAN%[3]%C_RESET% Start website ^(force reinstall dependencies^)
echo %C_CYAN%[4]%C_RESET% Health check only ^(no start^)
echo %C_CYAN%[5]%C_RESET% Start + persist CLI env vars ^(PO_HOME / PO_VENV / PATH^)
echo %C_CYAN%[6]%C_RESET% Start + allow temporary SQLite fallback
echo %C_CYAN%[7]%C_RESET% Persist CLI env vars only ^(no website start^)
echo %C_CYAN%[8]%C_RESET% Install Python 3.11 via winget
echo %C_CYAN%[9]%C_RESET% Guided check ^(tell me which option to use^)
echo %C_CYAN%[10]%C_RESET% Install PostgreSQL + configure .env
echo %C_CYAN%[0]%C_RESET% Exit
echo.
set "MENU_CHOICE="
set /p "MENU_CHOICE=Select option [0-10]: "

if "%MENU_CHOICE%"=="1" call :run_ps "" & goto :after_run
if "%MENU_CHOICE%"=="2" call :run_ps "-SkipInstall" & goto :after_run
if "%MENU_CHOICE%"=="3" call :run_ps "-ForceInstall" & goto :after_run
if "%MENU_CHOICE%"=="4" call :run_ps "-NoBrowser -CheckOnly" & goto :after_run
if "%MENU_CHOICE%"=="5" call :run_ps "-PersistCliEnv" & goto :after_run
if "%MENU_CHOICE%"=="6" call :run_ps "-AllowSqliteFallback" & goto :after_run
if "%MENU_CHOICE%"=="7" call :run_ps "-SkipInstall -NoBrowser -CheckOnly -PersistCliEnv" & goto :after_run
if "%MENU_CHOICE%"=="8" call :install_python & goto :after_run
if "%MENU_CHOICE%"=="9" call :guided_check & goto :after_run
if "%MENU_CHOICE%"=="10" call :install_postgres & goto :after_run
if "%MENU_CHOICE%"=="0" exit /b 0

echo.
echo %C_YELLOW%Invalid option.%C_RESET% Please choose 0..10.
timeout /t 2 >nul
goto :menu

:after_run
set "EXIT_CODE=%ERRORLEVEL%"
echo.
if "%EXIT_CODE%"=="0" (
  echo %C_GREEN%Completed successfully.%C_RESET%
) else (
  echo %C_RED%Operation failed ^(exit code %EXIT_CODE%^).%C_RESET%
)
echo.
pause
goto :menu

:direct_mode
call :run_ps "%*"
exit /b %ERRORLEVEL%

:run_ps
set "PS_ARGS=%~1"
if "%~2" NEQ "" set "PS_ARGS=%*"
set "AUTO_PG_TRIED=0"
call :check_python
if errorlevel 1 (
  echo.
  echo %C_YELLOW%[Python Missing]%C_RESET% Python was not found. Attempting automatic install...
  call :install_python
  set "PY_INSTALL_EXIT=!ERRORLEVEL!"
  if not "!PY_INSTALL_EXIT!"=="0" (
    echo.
    echo %C_RED%[Python Missing]%C_RESET% Automatic Python install failed.
    echo %C_YELLOW%Try this manually:%C_RESET% winget install -e --id Python.Python.3.11
    exit /b !PY_INSTALL_EXIT!
  )
  call :check_python
  if errorlevel 1 (
    echo.
    echo %C_RED%[ERROR]%C_RESET% Python install completed but is still not detected in this terminal.
    echo Close and reopen terminal, then run run_website.bat again.
    exit /b 44
  )
)
:run_ps_execute
echo.
echo %C_BLUE%Launching PO Management...%C_RESET%
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_PATH%" %PS_ARGS%
set "EXIT_CODE=%ERRORLEVEL%"
if "%EXIT_CODE%"=="31" (
  if "!AUTO_PG_TRIED!"=="0" (
    if exist "!PG_AUTO_STAMP!" (
      echo.
      echo %C_YELLOW%[Auto Setup]%C_RESET% PostgreSQL auto-setup was already attempted before on this project.
      echo %C_YELLOW%[Auto Setup]%C_RESET% Skipping re-install loop. Use option 10 for explicit install/reconfigure.
      set "AUTO_PG_TRIED=1"
    ) else (
      echo.
      echo %C_YELLOW%[Auto Setup]%C_RESET% PostgreSQL check failed. Attempting automatic PostgreSQL install/config...
      call :install_postgres_auto
      set "PG_AUTO_EXIT=!ERRORLEVEL!"
      if "!PG_AUTO_EXIT!"=="0" (
        >"!PG_AUTO_STAMP!" echo Auto setup attempted on %DATE% %TIME%
        set "AUTO_PG_TRIED=1"
        echo %C_GREEN%[Auto Setup]%C_RESET% PostgreSQL setup completed. Retrying startup...
        goto :run_ps_execute
      )
      if "!PG_AUTO_EXIT!"=="53" (
        echo %C_RED%[Auto Setup]%C_RESET% PostgreSQL tools/service are still missing.
        echo %C_YELLOW%[Auto Setup]%C_RESET% Run option 10 in an Administrator terminal, then retry option 1.
      )
      if "!PG_AUTO_EXIT!"=="57" (
        echo %C_RED%[Auto Setup]%C_RESET% Administrator elevation was canceled.
        echo %C_YELLOW%[Auto Setup]%C_RESET% Re-run option 10 and accept the UAC prompt.
      )
      echo %C_YELLOW%[Auto Setup]%C_RESET% Automatic PostgreSQL setup failed ^(exit code !PG_AUTO_EXIT!^).
    )
  )
)
if not "%EXIT_CODE%"=="0" (
  echo.
  if "%EXIT_CODE%"=="31" (
    echo %C_RED%[PostgreSQL Required]%C_RESET% Unable to connect to PostgreSQL.
    echo %C_YELLOW%What you can do next:%C_RESET%
    echo   1^) Choose option 10 to install/configure PostgreSQL ^(run terminal as Administrator^).
    echo   2^) Or fix DATABASE_URL/PostgreSQL service manually.
    echo   3^) Retry option 1.
    echo   4^) Optional temporary fallback: option 6 or -AllowSqliteFallback
  ) else (
    echo %C_RED%[ERROR]%C_RESET% Website launcher failed with exit code %EXIT_CODE%.
    echo Review the message above, fix the issue, then retry.
  )
)
exit /b %EXIT_CODE%

:check_python
set "_PY_OK=0"
where py >nul 2>&1
if not errorlevel 1 (
  py -3 --version >nul 2>&1
  if not errorlevel 1 set "_PY_OK=1"
)
if "!_PY_OK!"=="0" (
  where python >nul 2>&1
  if not errorlevel 1 (
    python --version >nul 2>&1
    if not errorlevel 1 set "_PY_OK=1"
  )
)
if "!_PY_OK!"=="1" exit /b 0
exit /b 1

:install_python
call :check_python
if not errorlevel 1 (
  echo.
  echo %C_GREEN%Python is already installed on this computer.%C_RESET%
  exit /b 0
)

where winget >nul 2>&1
if errorlevel 1 (
  echo.
  echo %C_RED%[ERROR]%C_RESET% winget is not available on this system.
  echo Install Python manually from https://www.python.org/downloads/ then retry.
  exit /b 42
)

echo.
echo %C_BLUE%Installing Python 3.11 via winget...%C_RESET%
winget install -e --id Python.Python.3.11 --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo.
  echo %C_RED%[ERROR]%C_RESET% Python installation failed via winget.
  exit /b 43
)

call :check_python
if errorlevel 1 (
  echo.
  echo %C_YELLOW%Python installed but not detected in current shell yet.%C_RESET%
  echo Close and reopen terminal, then run run_website.bat again.
  exit /b 44
)

echo.
echo %C_GREEN%Python installed successfully.%C_RESET%
exit /b 0

:install_postgres
echo.
echo %C_BLUE%Launching PostgreSQL installer...%C_RESET%
powershell -NoProfile -ExecutionPolicy Bypass -File "%PG_INSTALL_SCRIPT%"
set "EXIT_CODE=%ERRORLEVEL%"
if "%EXIT_CODE%"=="0" (
  >"%PG_AUTO_STAMP%" echo Manual setup completed on %DATE% %TIME%
)
if not "%EXIT_CODE%"=="0" (
  echo.
  if "%EXIT_CODE%"=="51" (
    echo %C_RED%[ERROR]%C_RESET% winget is missing. Install PostgreSQL manually.
  ) else if "%EXIT_CODE%"=="52" (
    echo %C_RED%[ERROR]%C_RESET% PostgreSQL install failed via winget.
  ) else if "%EXIT_CODE%"=="53" (
    echo %C_RED%[ERROR]%C_RESET% PostgreSQL tools/service not detected ^(psql/service missing^).
    echo %C_YELLOW%Hint:%C_RESET% Run this terminal as Administrator and try option 10 again.
  ) else if "%EXIT_CODE%"=="55" (
    echo %C_RED%[ERROR]%C_RESET% PostgreSQL installed, but DB/.env setup failed.
  ) else if "%EXIT_CODE%"=="57" (
    echo %C_RED%[ERROR]%C_RESET% Administrator elevation canceled for PostgreSQL setup.
    echo %C_YELLOW%Hint:%C_RESET% Run terminal as Administrator, then try option 10 again.
  ) else (
    echo %C_RED%[ERROR]%C_RESET% PostgreSQL installer failed ^(exit code %EXIT_CODE%^).
  )
)
exit /b %EXIT_CODE%

:install_postgres_auto
echo.
echo %C_BLUE%Launching PostgreSQL installer (non-interactive)...%C_RESET%
powershell -NoProfile -ExecutionPolicy Bypass -File "%PG_INSTALL_SCRIPT%" -NonInteractive
set "EXIT_CODE=%ERRORLEVEL%"
if "%EXIT_CODE%"=="0" (
  >"%PG_AUTO_STAMP%" echo Auto setup completed on %DATE% %TIME%
)
if not "%EXIT_CODE%"=="0" (
  echo.
  if "%EXIT_CODE%"=="51" (
    echo %C_RED%[ERROR]%C_RESET% winget is missing. Install PostgreSQL manually.
  ) else if "%EXIT_CODE%"=="52" (
    echo %C_RED%[ERROR]%C_RESET% PostgreSQL install failed via winget.
  ) else if "%EXIT_CODE%"=="53" (
    echo %C_RED%[ERROR]%C_RESET% PostgreSQL tools/service not detected ^(psql/service missing^).
    echo %C_YELLOW%Hint:%C_RESET% Run this terminal as Administrator and try option 10 again.
  ) else if "%EXIT_CODE%"=="55" (
    echo %C_RED%[ERROR]%C_RESET% PostgreSQL installed, but DB/.env setup failed.
  ) else if "%EXIT_CODE%"=="57" (
    echo %C_RED%[ERROR]%C_RESET% Administrator elevation canceled for PostgreSQL setup.
    echo %C_YELLOW%Hint:%C_RESET% Run terminal as Administrator, then try option 10 again.
  ) else (
    echo %C_RED%[ERROR]%C_RESET% PostgreSQL installer failed ^(exit code %EXIT_CODE%^).
  )
)
exit /b %EXIT_CODE%

:guided_check
echo.
echo %C_BLUE%Running guided check...%C_RESET%
call :check_python
if errorlevel 1 (
  echo.
  echo %C_YELLOW%Result:%C_RESET% Python is missing.
  echo Next step: choose option 1. It will auto-install Python and start.
  exit /b 0
)

if not exist "%~dp0.env" (
  echo.
  echo %C_YELLOW%Result:%C_RESET% .env file not found.
  echo Next step: choose option 1. Launcher will create .env automatically.
  exit /b 0
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_PATH%" -SkipInstall -NoBrowser -CheckOnly >nul 2>&1
set "GUIDE_EXIT=%ERRORLEVEL%"

if "%GUIDE_EXIT%"=="31" (
  echo.
  echo %C_YELLOW%Result:%C_RESET% PostgreSQL is configured but failed to connect.
  echo Next step: choose option 1 ^(auto setup^) or option 10 ^(manual installer^).
  echo Temporary fallback: choose option 6.
  exit /b 0
)

if "%GUIDE_EXIT%"=="0" (
  echo.
  echo %C_GREEN%Result:%C_RESET% System check passed.
  echo Next step: choose option 1 to start the website.
  exit /b 0
)

echo.
echo %C_RED%Result:%C_RESET% Some issue needs attention ^(check code %GUIDE_EXIT%^).
echo Next step: choose option 4 for a visible health check.
exit /b 0

:show_banner
cls
echo.
echo %C_CYAN%===============================================================%C_RESET%
echo %C_CYAN%                     PO MANAGEMENT LAUNCHER                    %C_RESET%
echo %C_CYAN%             Dynamic setup - no fixed computer paths            %C_RESET%
echo %C_CYAN%===============================================================%C_RESET%
echo.
echo Project: %~dp0
echo.
exit /b 0
