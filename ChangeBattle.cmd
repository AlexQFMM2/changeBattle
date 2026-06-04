@echo off
setlocal

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%" || exit /b 1

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT_DIR%ChangeBattle.ps1" %*
set "ERR=%ERRORLEVEL%"

if not "%ERR%"=="0" (
  echo.
  echo ChangeBattle failed to start. Error code: %ERR%
  echo You can try running install_windows.cmd first, then start_game_cli.cmd.
  pause
)
exit /b %ERR%
