@echo off
setlocal

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%" || exit /b 1

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT_DIR%install_windows.ps1"
set "ERR=%ERRORLEVEL%"

echo.
if "%ERR%"=="0" (
  echo Install check completed. You can run start_game_cli.cmd now.
) else (
  echo Install check failed. Please read the messages above.
)
pause
exit /b %ERR%
