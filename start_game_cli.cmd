@echo off
setlocal

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%" || exit /b 1

if "%SHOWDOWN_PATH%"=="" (
  set "SHOWDOWN_PATH=%ROOT_DIR%vendor\pokemon-showdown"
)

if not exist "%SHOWDOWN_PATH%\dist\sim\index.js" (
  echo Pokemon Showdown vendor is missing:
  echo   %SHOWDOWN_PATH%\dist\sim\index.js
  echo.
  echo If you are using the release zip, please make sure vendor\pokemon-showdown exists.
  echo If you use your own Showdown checkout, set SHOWDOWN_PATH and run again.
  exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
  where py >nul 2>nul
  if errorlevel 1 (
    echo Python was not found. Run install_windows.cmd first.
    exit /b 1
  )
  set "PYTHON_CMD=py -3"
) else (
  set "PYTHON_CMD=python"
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Run install_windows.cmd first.
  exit /b 1
)

if "%~1"=="" (
  %PYTHON_CMD% "changeBattle-cli\play.py"
) else (
  %PYTHON_CMD% "changeBattle-cli\play.py" %*
)
