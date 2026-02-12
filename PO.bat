@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1

set "PROJECT_ROOT=%~dp0"
set "SETUP_SCRIPT=%PROJECT_ROOT%scripts\setup_and_run.ps1"

if not exist "%SETUP_SCRIPT%" (
  echo [ERROR] Missing launcher script:
  echo %SETUP_SCRIPT%
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%SETUP_SCRIPT%" %*
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [ERROR] PO launcher failed ^(exit code %EXIT_CODE%^).
  pause
  exit /b %EXIT_CODE%
)

exit /b 0
