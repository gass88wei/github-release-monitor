@echo off
cd /d "%~dp0"
title GitHub Release Monitor
"node\node.exe" "app\launcher.mjs" %*
set EXITCODE=%errorlevel%
if not "%EXITCODE%"=="0" (
  echo.
  echo [Error] Monitor exited with code %EXITCODE%.
)
pause
exit /b %EXITCODE%
