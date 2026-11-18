@echo off
setlocal
cd /d "%~dp0frontend"
if not exist .env.local (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0SETUP_BIZTRACK_WINDOWS.ps1"
  if errorlevel 1 exit /b 1
)
echo.
echo Starting BizTrack...
call npm run dev
